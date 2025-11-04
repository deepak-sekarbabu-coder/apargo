'use client';

import { AlertTriangle, Cog, LineChart, Users as UsersIcon, Wallet } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { Card, CardContent } from '@/components/ui/card';

interface FeatureItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string; // tailwind bg color
  onSelect: () => void;
}

interface FeatureGridProps {
  onSelect: (view: string) => void;
  className?: string;
  isAdmin?: boolean;
}

export function FeatureGrid({ onSelect, isAdmin }: FeatureGridProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const features: FeatureItem[] = [
    {
      key: 'ledger',
      label: 'Ledger',
      description: 'Track balances & payments',
      icon: <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      onSelect: () => onSelect('ledger'),
    },
    {
      key: 'expense-analytics',
      label: 'Expense Mgmt',
      description: 'Analyze monthly spending',
      icon: <LineChart className="h-6 w-6 sm:h-7 sm:w-7" />,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      onSelect: () => onSelect('expense-analytics'),
    },
    {
      key: 'faults',
      label: 'Fault Mgmt',
      description: 'Report & resolve issues',
      icon: <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      onSelect: () => onSelect('faults'),
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      description: 'Tasks & scheduling',
      icon: <Cog className="h-6 w-6 sm:h-7 sm:w-7" />,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      onSelect: () => onSelect('maintenance'),
    },
    {
      key: 'community',
      label: 'Community',
      description: 'Polls & announcements',
      icon: <UsersIcon className="h-6 w-6 sm:h-7 sm:w-7" />,
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      onSelect: () => onSelect('community'),
    },
    // Admin only feature card
    ...(isAdmin
      ? [
          {
            key: 'admin',
            label: 'Admin',
            description: 'User & system settings',
            icon: <UsersIcon className="h-6 w-6 sm:h-7 sm:w-7" />,
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            onSelect: () => onSelect('admin'),
          } as FeatureItem,
        ]
      : []),
  ];

  // Handle touch events for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragOffset.x;
    const deltaY = touch.clientY - dragOffset.y;

    // Minimum swipe distance (50px)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        setCurrentIndex(prev => prev - 1);
      } else if (deltaX < 0 && currentIndex < features.length - 2) {
        // Swipe left - go to next (show 2 items on mobile)
        setCurrentIndex(prev => prev + 1);
      }
    }

    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-xs text-muted-foreground">Swipe to navigate</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            'grid grid-cols-2 sm:grid-cols-3 transition-transform duration-300 ease-out',
            // widen columns when admin adds extra card
            isAdmin ? 'md:grid-cols-6' : 'md:grid-cols-5',
            'gap-3 touch-pan-x'
          )}
          style={{
            transform: `translateX(-${currentIndex * 50}%)`,
          }}
        >
          {features.map(f => (
            <button
              key={f.key}
              onClick={f.onSelect}
              className={cn(
                'group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-xl touch-manipulation min-h-[120px]',
                isDragging && 'pointer-events-none'
              )}
              style={{
                touchAction: 'manipulation',
              }}
            >
              <Card
                className={cn(
                  'h-full border border-border/60 hover:shadow-lg active:shadow-md transition-all duration-200 rounded-xl',
                  'bg-gradient-to-br from-background to-muted/40 hover:from-muted/20 hover:to-background/60',
                  'active:scale-95'
                )}
              >
                <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-3 text-center">
                  <div
                    className={cn(
                      'p-3 rounded-xl inline-flex items-center justify-center shrink-0',
                      f.color,
                      'group-hover:scale-110 transition-transform'
                    )}
                  >
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-tight">{f.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {f.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile pagination dots */}
      <div className="flex justify-center gap-2 sm:hidden">
        {Array.from({ length: Math.ceil(features.length / 2) }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}
