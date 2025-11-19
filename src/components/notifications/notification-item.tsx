'use client';

import { format } from 'date-fns';
import { Bell, Check, Clock, Megaphone, Vote } from 'lucide-react';

import * as React from 'react';

import type { Notification } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return <Clock className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      case 'announcement':
        const priorityColors = {
          high: 'text-red-500 dark:text-red-400',
          medium: 'text-blue-500 dark:text-blue-400',
          low: 'text-gray-500 dark:text-gray-400',
        };
        const colorClass =
          priorityColors[notification.priority as keyof typeof priorityColors] ||
          'text-blue-500 dark:text-blue-400';
        return <Megaphone className={`h-5 w-5 ${colorClass}`} />;
      case 'poll':
        return <Vote className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'reminder':
        return 'Reminder';
      case 'announcement':
        return 'Announcement';
      case 'poll':
        return 'Community Poll';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const isRead = typeof notification.isRead === 'boolean' ? notification.isRead : false;

  // Defer any locale-dependent formatting until after mount to avoid SSR/CSR mismatches
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const createdAtLabel = React.useMemo(() => {
    if (!mounted) return '';
    try {
      return format(new Date(notification.createdAt), 'MMM d • h:mm a');
    } catch {
      return '';
    }
  }, [mounted, notification.createdAt]);

  const dueDateLabel = React.useMemo(() => {
    if (!mounted || !notification.dueDate) return '';
    try {
      return `Due ${format(new Date(notification.dueDate), 'MMM d')}`;
    } catch {
      return '';
    }
  }, [mounted, notification.dueDate]);

  return (
    <Card
      className={`mb-2 overflow-hidden transition-all duration-200 hover:shadow-md ${
        !isRead
          ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'bg-card/50 hover:bg-card/70 dark:bg-card/30 dark:hover:bg-card/50'
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-sm leading-tight flex-1 break-words">
                {notification.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge
                variant={!isRead ? 'default' : 'outline'}
                className={`text-xs ${
                !isRead
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/70 dark:text-blue-200 dark:hover:bg-blue-900/50'
                : ''
                }`}
                >
                  {getTypeLabel()}
                </Badge>
                {!isRead && (
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2 break-words">{notification.message}</p>

            {notification.amount && (
              <div className="mb-2 p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">
                    {notification.currency || '₹'}
                    {notification.amount.toFixed(2)}
                  </span>
                  {notification.dueDate && (
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {dueDateLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate" suppressHydrationWarning>
                {createdAtLabel}
              </span>

              {!isRead && (
              <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs px-2"
              onClick={handleMarkAsRead}
              >
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">Read</span>
              </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
