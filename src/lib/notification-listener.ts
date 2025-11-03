/**
 * Robust notification listener with connection management
 * Handles Firestore real-time listener issues and provides fallback mechanisms
 */
import {
  DocumentData,
  Query,
  QuerySnapshot,
  Unsubscribe,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

interface NotificationListenerOptions {
  apartment: string;
  onNotifications: (notifications: Notification[]) => void;
  onError?: (error: Error) => void;
  retryDelay?: number;
  maxRetries?: number;
}

export class NotificationListener {
  private apartment: string;
  private onNotifications: (notifications: Notification[]) => void;
  private onError?: (error: Error) => void;
  private retryDelay: number;
  private maxRetries: number;
  private currentRetries: number = 0;
  private unsubscribes: Unsubscribe[] = [];
  private isActive: boolean = false;
  private retryTimeout?: NodeJS.Timeout;
  private stringNotifications = new Map<string, Notification>();
  private arrayNotifications = new Map<string, Notification>();
  private keepAliveInterval?: NodeJS.Timeout;

  constructor(options: NotificationListenerOptions) {
    this.apartment = options.apartment;
    this.onNotifications = options.onNotifications;
    this.onError = options.onError;
    this.retryDelay = options.retryDelay || 2000;
    this.maxRetries = options.maxRetries || 5;
  }

  start(): void {
    if (this.isActive) {
      console.warn('NotificationListener already active');
      return;
    }

    this.isActive = true;
    this.currentRetries = 0;
    this.setupListeners();
    this.startKeepAlive();
  }

  stop(): void {
    this.isActive = false;
    this.cleanup();
  }

  private setupListeners(): void {
    if (!this.isActive) return;

    console.log('🔔 Setting up notification listeners for apartment:', this.apartment);

    // Use separate queries since unified query with mixed types is not supported
    this.setupFallbackListeners();
  }

  private setupSingleListener(query: Query<DocumentData>, source: string): void {
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => this.handleSnapshot(snapshot, source),
      (error: unknown) => this.handleError(error, source)
    );
    this.unsubscribes.push(unsubscribe);
  }

  private setupFallbackListeners(): void {
    if (!this.isActive) return;

    // Fallback to separate queries with staggered setup
    const stringQuery = query(
      collection(db, 'notifications'),
      where('toApartmentId', '==', this.apartment)
    );

    const arrayQuery = query(
      collection(db, 'notifications'),
      where('toApartmentId', 'array-contains', this.apartment)
    );

    // Setup first listener
    this.setupSingleListener(stringQuery, 'string');

    // Setup second listener with slight delay to avoid conflicts
    setTimeout(() => {
      if (!this.isActive) return;
      this.setupSingleListener(arrayQuery, 'array');
    }, 100);
  }

  private handleSnapshot(snapshot: QuerySnapshot<DocumentData>, source?: string): void {
    const now = new Date();

    // Choose the appropriate map based on query source
    const targetMap = source === 'string' ? this.stringNotifications : this.arrayNotifications;

    // Clear the target map and repopulate it
    targetMap.clear();

    snapshot.docs.forEach(doc => {
      const data = doc.data() as Omit<Notification, 'id'>;

      this.logNotificationProcessing(this.apartment, source || '', doc.id, data);

      if (this.isNotificationExpired(data, now)) {
        this.logExpiredNotification(this.apartment, doc.id);
        return;
      }

      const isReadForUser = this.normalizeReadStatus(data, this.apartment);

      this.logReadStatus(this.apartment, data, isReadForUser);

      const notification = {
        id: doc.id,
        ...data,
        isRead: isReadForUser,
      } as Notification;

      targetMap.set(doc.id, notification);

      this.logAddedNotification(this.apartment, source || '', notification);
    });

    this.emitNotifications();

    if (source) {
      console.log(`🔔 ${source} query updated:`, snapshot.size, 'notifications');
      if (this.apartment === 'T2') {
        console.log(`🔍 T2 ${source} map size:`, targetMap.size);
        console.log(
          `🔍 T2 total notifications:`,
          this.stringNotifications.size + this.arrayNotifications.size
        );
      }
    } else {
      console.log('🔔 Unified query updated:', snapshot.size, 'notifications');
    }
  }

  private emitNotifications(): void {
    // Merge notifications from both maps, avoiding duplicates
    const mergedMap = new Map<string, Notification>();

    // Add notifications from string query
    this.stringNotifications.forEach((notification, id) => {
      mergedMap.set(id, notification);
    });

    // Add notifications from array query (will overwrite duplicates, which is fine)
    this.arrayNotifications.forEach((notification, id) => {
      mergedMap.set(id, notification);
    });

    const notifications = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (this.apartment === 'T2') {
      console.log(
        `🔍 Emitting ${notifications.length} notifications for T2:`,
        notifications.map(n => ({ id: n.id, title: n.title, isRead: n.isRead }))
      );
      console.log(
        `🔍 String map: ${this.stringNotifications.size}, Array map: ${this.arrayNotifications.size}`
      );
    }

    this.onNotifications(notifications);
  }

  private handleError(error: unknown, source?: string): void {
    const errorMessage = source ? `${source} listener error` : 'Notification listener error';
    console.error(`🚫 ${errorMessage}:`, error);

    const errorType = this.classifyError(error);

    if (errorType === 'idle-timeout') {
      this.handleIdleTimeout();
      return;
    }

    this.callOnError(error);

    if (this.shouldRetry(this.currentRetries, this.maxRetries)) {
      this.performRetry();
    } else {
      this.handleMaxRetriesReached();
    }
  }

  private classifyError(error: unknown): string {
    const isErrorLike = (err: unknown): err is { message?: string; code?: number } =>
      typeof err === 'object' && err !== null;

    const isIdleTimeout =
      isErrorLike(error) &&
      (error.message?.includes('CANCELLED') ||
        error.message?.includes('Timed out waiting for new targets') ||
        error.code === 1);

    return isIdleTimeout ? 'idle-timeout' : 'other';
  }

  private handleIdleTimeout(): void {
    console.log('🔄 Detected idle timeout, restarting listener immediately');
    if (this.isActive) {
      this.cleanup();
      setTimeout(() => {
        if (this.isActive) {
          this.setupListeners();
        }
      }, 1000);
    }
  }

  private callOnError(error: unknown): void {
    if (this.onError) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.onError(errorObj);
    }
  }

  private shouldRetry(currentRetries: number, maxRetries: number): boolean {
    return currentRetries < maxRetries;
  }

  private performRetry(): void {
    this.currentRetries++;
    const delay = this.calculateRetryDelay(this.currentRetries, this.retryDelay);

    console.log(
      `🔄 Retrying notification listener in ${delay}ms (attempt ${this.currentRetries}/${this.maxRetries})`
    );

    this.retryTimeout = setTimeout(() => {
      if (this.isActive) {
        this.cleanup();
        this.setupListeners();
      }
    }, delay);
  }

  private calculateRetryDelay(retryCount: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, retryCount - 1);
  }

  private handleMaxRetriesReached(): void {
    console.error('🚫 Max retries reached for notification listener');
    this.stop();
  }

  private startKeepAlive(): void {
    // Restart listeners every 5 minutes to prevent idle timeouts
    this.keepAliveInterval = setInterval(
      () => {
        if (this.isActive) {
          console.log('🔄 Refreshing notification listeners to prevent idle timeout');
          this.cleanup();
          this.setupListeners();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  private isNotificationExpired(data: Omit<Notification, 'id'>, now: Date): boolean {
    if (data.type === 'announcement' && (data as any).expiresAt) {
      const expiryDate = new Date((data as any).expiresAt);
      return expiryDate < now;
    }
    return false;
  }

  private normalizeReadStatus(data: Omit<Notification, 'id'>, apartmentId: string): boolean {
    if (data.type === 'announcement' && typeof data.isRead === 'object' && data.isRead !== null) {
      return Boolean((data.isRead as Record<string, boolean>)[apartmentId]);
    } else {
      return Boolean(data.isRead);
    }
  }

  private logNotificationProcessing(
    apartmentId: string,
    source: string,
    docId: string,
    data: Omit<Notification, 'id'>
  ): void {
    if (apartmentId === 'T2') {
      console.log(`🔍 Processing notification for T2 (${source}):`, {
        id: docId,
        title: data.title,
        type: data.type,
        toApartmentId: data.toApartmentId,
        isRead: data.isRead,
        source,
      });
    }
  }

  private logExpiredNotification(apartmentId: string, docId: string): void {
    if (apartmentId === 'T2') {
      console.log(`🔍 Filtering out expired notification:`, docId);
    }
  }

  private logReadStatus(
    apartmentId: string,
    data: Omit<Notification, 'id'>,
    isReadForUser: boolean
  ): void {
    if (apartmentId === 'T2') {
      if (data.type === 'announcement' && typeof data.isRead === 'object' && data.isRead !== null) {
        console.log(`🔍 T2 isRead processing:`, {
          isReadObject: data.isRead,
          apartmentKey: apartmentId,
          isReadForUser,
        });
      } else {
        console.log(`🔍 T2 simple isRead:`, { isRead: data.isRead, isReadForUser });
      }
    }
  }

  private logAddedNotification(
    apartmentId: string,
    source: string,
    notification: Notification
  ): void {
    if (apartmentId === 'T2') {
      console.log(`🔍 Added notification to T2 ${source} map:`, {
        id: notification.id,
        title: notification.title,
        isRead: notification.isRead,
      });
    }
  }

  private cleanup(): void {
    // Clear retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }

    // Clear keep alive interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = undefined;
    }

    // Unsubscribe from all listeners
    this.unsubscribes.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from notification listener:', error);
      }
    });
    this.unsubscribes = [];

    // Clear notification maps
    this.stringNotifications.clear();
    this.arrayNotifications.clear();
  }
}

// Utility function for admin users to listen to all announcements
export class AdminNotificationListener {
  private onNotifications: (notifications: Notification[]) => void;
  private onError?: (error: Error) => void;
  private unsubscribe?: Unsubscribe;
  private isActive: boolean = false;

  constructor(
    onNotifications: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ) {
    this.onNotifications = onNotifications;
    this.onError = onError;
  }

  private handleAdminSnapshot(snapshot: QuerySnapshot<DocumentData>): void {
    const now = new Date();
    const notifications = snapshot.docs
      .map(doc => {
        const data = doc.data() as Omit<Notification, 'id'>;

        // Filter out expired announcements
        if ((data as any).expiresAt) {
        const expiryDate = new Date((data as any).expiresAt);
        if (expiryDate < now) return null;
        }

        return {
          id: doc.id,
          ...data,
          isRead: false, // Admins see all as unread
        } as Notification;
      })
      .filter((n): n is Notification => n !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.onNotifications(notifications);
  }

  start(): void {
    if (this.isActive) return;

    this.isActive = true;

    const announcementsQuery = query(
      collection(db, 'notifications'),
      where('type', '==', 'announcement')
    );

    this.unsubscribe = onSnapshot(
      announcementsQuery,
      snapshot => this.handleAdminSnapshot(snapshot),
      error => {
        console.error('🚫 Admin notification listener error:', error);
        if (this.onError) {
          this.onError(error);
        }
      }
    );
  }

  stop(): void {
    this.isActive = false;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}
