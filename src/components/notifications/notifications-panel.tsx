'use client';

import { useAuth } from '@/context/auth-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Bell, BellOff } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { db } from '@/lib/firebase';
import { AdminNotificationListener, NotificationListener } from '@/lib/notification-listener';
import type { Notification } from '@/lib/types';

import { NotificationItem } from '@/components/notifications/notification-item';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationsPanelProps {
  className?: string;
}

export function NotificationsPanel({ className }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const apartment = user?.apartment;

  // Notification listener management
  const listenerRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup previous listener
    if (listenerRef.current) {
      listenerRef.current.stop();
      listenerRef.current = null;
    }

    if (!apartment) {
      // Handle admin users without apartment
      if (user && user.role === 'admin') {
        const adminListener = new AdminNotificationListener(
          (notifications: Notification[]) => {
            const unread = notifications.reduce((acc, n) => acc + (typeof n.isRead === 'boolean' && !n.isRead ? 1 : 0), 0);
            setNotifications(notifications);
            setUnreadCount(unread);
            setConnectionError(null);
          },
          (error: Error) => {
            console.error('Admin notification listener error:', error);
            setConnectionError('Failed to load notifications. Retrying...');
          }
        );

        adminListener.start();
        listenerRef.current = adminListener;

        return () => {
          adminListener.stop();
        };
      }

      // Non-admin users without apartment
      setNotifications([]);
      setUnreadCount(0);
      setConnectionError(null);
      return;
    }

    // Wait for authentication to be fully established
    if (!user) {
      return;
    }

    console.log('🔔 Setting up robust notification listener for apartment:', apartment);

    // Setup the robust notification listener
    const listener = new NotificationListener({
      apartment,
      onNotifications: (notifications: Notification[]) => {
        if (apartment === 'T2') {
          console.log(
            `🔍 NotificationsPanel received ${notifications.length} notifications for T2:`,
            notifications.map(n => ({ id: n.id, title: n.title, isRead: n.isRead }))
          );
        }
        const unread = notifications.reduce((acc, n) => acc + (typeof n.isRead === 'boolean' && !n.isRead ? 1 : 0), 0);
        if (apartment === 'T2') {
          console.log(`🔍 T2 unread count:`, unread);
        }
        setNotifications(notifications);
        setUnreadCount(unread);
        setConnectionError(null);
      },
      onError: (error: Error) => {
        console.error('Notification listener error:', error);
        setConnectionError('Connection issues detected. Retrying...');
      },
      retryDelay: 2000,
      maxRetries: 5,
    });

    listener.start();
    listenerRef.current = listener;

    return () => {
      listener.stop();
    };
  }, [apartment, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.stop();
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (!user || !user.apartment) return;
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      console.log(`🔍 Marking notification as read for ${user.apartment}:`, {
        notificationId,
        notificationType: notification.type,
        currentIsRead: notification.isRead,
      });

      // For announcements, we need to get the original document to access the isRead map
      if (notification.type === 'announcement') {
        // Get the current document to access the original isRead map
        const notificationRef = doc(db, 'notifications', notificationId);
        const currentDoc = await getDoc(notificationRef);

        if (currentDoc.exists()) {
          const currentData = currentDoc.data();
          const currentIsRead = currentData.isRead;

          console.log(`🔍 Current isRead map:`, currentIsRead);

          if (typeof currentIsRead === 'object' && currentIsRead !== null) {
            // Update the specific apartment in the isRead map
            const updatedIsRead = { ...currentIsRead, [user.apartment]: true };
            console.log(`🔍 Updating isRead map:`, updatedIsRead);

            await updateDoc(notificationRef, {
              isRead: updatedIsRead,
            });
          } else {
            // Fallback: create new isRead map
            const updatedIsRead = { [user.apartment]: true };
            console.log(`🔍 Creating new isRead map:`, updatedIsRead);

            await updateDoc(notificationRef, {
              isRead: updatedIsRead,
            });
          }
        }
      } else {
        // For regular notifications with boolean isRead
        await updateDoc(doc(db, 'notifications', notificationId), {
          isRead: true,
        });
      }

      console.log(`✅ Successfully marked notification as read for ${user.apartment}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !user.apartment) return;

    try {
      console.log(`🔍 Marking all notifications as read for ${user.apartment}`);

      // Process each notification individually to handle isRead maps correctly
      const unreadNotifications = notifications.filter(n => !n.isRead);

      for (const notification of unreadNotifications) {
        if (notification.type === 'announcement') {
          // Get the current document to access the original isRead map
          const notificationRef = doc(db, 'notifications', notification.id);
          const currentDoc = await getDoc(notificationRef);

          if (currentDoc.exists()) {
            const currentData = currentDoc.data();
            const currentIsRead = currentData.isRead;

            if (typeof currentIsRead === 'object' && currentIsRead !== null) {
              // Update the specific apartment in the isRead map
              const updatedIsRead = { ...currentIsRead, [user.apartment]: true };
              await updateDoc(notificationRef, {
                isRead: updatedIsRead,
              });
            } else {
              // Fallback: create new isRead map
              const updatedIsRead = { [user.apartment]: true };
              await updateDoc(notificationRef, {
                isRead: updatedIsRead,
              });
            }
          }
        } else {
          // For regular notifications with boolean isRead
          await updateDoc(doc(db, 'notifications', notification.id), {
            isRead: true,
          });
        }
      }

      console.log(`✅ Successfully marked all notifications as read for ${user.apartment}`);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          {...({
            variant: 'ghost',
            size: 'icon',
            className: `relative ${className}`,
            'aria-label':
              unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : 'Open notifications',
          } as ButtonProps)}
        >
          {unreadCount > 0 ? (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 dark:bg-red-400 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          ) : null}
          <Bell className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>

        {connectionError && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{connectionError}</p>
          </div>
        )}

        {notifications.length > 0 ? (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            </ScrollArea>
            {unreadCount > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  {...({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-8 text-xs px-2 sm:px-3',
                    onClick: markAllAsRead,
                    'aria-label': 'Mark all notifications as read',
                  } as ButtonProps)}
                >
                  <span className="hidden sm:inline">Mark all as read</span>
                  <span className="sm:hidden">Mark all</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
            <BellOff className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
