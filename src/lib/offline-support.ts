// React hook for offline support
import { useEffect, useState } from 'react';

// Enhanced offline support utility
// Provides offline-first functionality with background sync

export interface OfflineAction {
  id: string;
  type: 'expense' | 'payment';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  pendingActions: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
}

class OfflineSupportManager {
  private isOnline = navigator.onLine;
  private pendingActions: OfflineAction[] = [];
  private syncInProgress = false;
  private syncListeners: ((status: OfflineStatus) => void)[] = [];
  private lastSyncTime: number | null = null;

  constructor() {
    this.initializeListeners();
    this.loadPendingActions();
  }

  private initializeListeners() {
    // Online/Offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });

    // Service worker message handling
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener(
        'message',
        this.handleServiceWorkerMessage.bind(this)
      );
    }

    // Periodic sync check
    setInterval(() => this.checkSyncStatus(), 30000); // Every 30 seconds
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case 'OFFLINE_STATUS':
        this.updateFromServiceWorker(data);
        break;
      case 'SYNC_COMPLETED':
        this.onSyncCompleted();
        break;
      case 'SYNC_FAILED':
        this.onSyncFailed(data);
        break;
    }
  }

  private updateFromServiceWorker(data: any) {
    if (typeof data.totalOfflineItems === 'number') {
      // Update pending actions count
      this.notifyStatusChange();
    }
  }

  // Public methods for app integration
  public async addOfflineAction(type: 'expense' | 'payment', data: any): Promise<void> {
    const action: OfflineAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.pendingActions.push(action);
    await this.savePendingActions();

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncAction(action);
    } else {
      this.notifyStatusChange();
    }
  }

  public async syncAction(action: OfflineAction): Promise<boolean> {
    if (this.syncInProgress) return false;

    try {
      this.syncInProgress = true;

      const endpoint = action.type === 'expense' ? '/api/expenses' : '/api/payments';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.data),
      });

      if (response.ok) {
        await this.removePendingAction(action.id);
        this.lastSyncTime = Date.now();
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Sync failed for action:', action.id, error);
      return false;
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  public async syncAllPending(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    const pendingActions = [...this.pendingActions];

    for (const action of pendingActions) {
      const success = await this.syncAction(action);

      if (!success) {
        action.retryCount++;
        if (action.retryCount >= action.maxRetries) {
          console.warn('Max retries reached for action:', action.id);
          // Keep the action for manual retry
        }
      }

      // Small delay between syncs to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  public async triggerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_SYNC',
      });
    } else {
      // Fallback to direct sync
      await this.syncAllPending();
    }
  }

  public getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingActions.length,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
    };
  }

  public onStatusChange(callback: (status: OfflineStatus) => void): () => void {
    this.syncListeners.push(callback);

    // Immediately call with current status
    callback(this.getStatus());

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  public async clearOfflineData(): Promise<void> {
    this.pendingActions = [];
    await this.savePendingActions();
    this.notifyStatusChange();
  }

  public async exportOfflineData(): Promise<any> {
    return {
      pendingActions: this.pendingActions,
      exportTime: new Date().toISOString(),
      version: '1.0',
    };
  }

  // Private helper methods
  private async removePendingAction(actionId: string): Promise<void> {
    this.pendingActions = this.pendingActions.filter(action => action.id !== actionId);
    await this.savePendingActions();
  }

  private async savePendingActions(): Promise<void> {
    try {
      // Save to localStorage for persistence
      localStorage.setItem('apargo_offline_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }

  private async loadPendingActions(): Promise<void> {
    try {
      const saved = localStorage.getItem('apargo_offline_actions');
      if (saved) {
        this.pendingActions = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
      this.pendingActions = [];
    }
  }

  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.syncListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  private async checkSyncStatus(): Promise<void> {
    // Request status from service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_OFFLINE_STATUS',
      });
    }

    // Auto-sync if online and we have pending actions
    if (this.isOnline && this.pendingActions.length > 0 && !this.syncInProgress) {
      setTimeout(() => this.syncAllPending(), 1000);
    }
  }

  private onSyncCompleted(): void {
    this.lastSyncTime = Date.now();
    this.notifyStatusChange();
  }

  private onSyncFailed(data: any): void {
    console.error('Background sync failed:', data);
    this.notifyStatusChange();
  }
}

// Singleton instance
export const offlineSupport = new OfflineSupportManager();

export function useOfflineSupport() {
  const [status, setStatus] = useState<OfflineStatus>(offlineSupport.getStatus());

  useEffect(() => {
    const unsubscribe = offlineSupport.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const addOfflineAction = (type: 'expense' | 'payment', data: any) =>
    offlineSupport.addOfflineAction(type, data);

  const syncNow = () => offlineSupport.syncAllPending();
  const clearData = () => offlineSupport.clearOfflineData();
  const exportData = () => offlineSupport.exportOfflineData();

  return {
    status,
    isOnline: status.isOnline,
    pendingActions: status.pendingActions,
    syncInProgress: status.syncInProgress,
    lastSyncTime: status.lastSyncTime,
    addOfflineAction,
    syncNow,
    clearData,
    exportData,
  };
}

// Offline-aware fetch utility
export async function offlineAwareFetch(
  url: string,
  options: RequestInit = {},
  allowOffline: boolean = false
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // If request was successful, optionally save to offline cache
    if (response.ok && options.method === 'GET') {
      // Cache successful GET requests for offline access
      // This would integrate with the service worker caching
    }

    return response;
  } catch (error) {
    if (allowOffline) {
      // Try to return cached data
      console.warn('Network request failed, offline data not yet implemented');
      throw new Error('Request failed and no offline data available');
    } else {
      throw error;
    }
  }
}
