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

export function FeatureGrid({ onSelect, className, isAdmin }: FeatureGridProps) {
  const features: FeatureItem[] = [
    {
      key: 'ledger',
      label: 'Ledger',
      description: 'Track balances & payments',
      icon: <Wallet className="h-7 w-7" />,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      onSelect: () => onSelect('ledger'),
    },
    {
      key: 'expense-analytics',
      label: 'Expense Mgmt',
      description: 'Analyze monthly spending',
      icon: <LineChart className="h-7 w-7" />,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      onSelect: () => onSelect('expense-analytics'),
    },
    {
      key: 'faults',
      label: 'Fault Mgmt',
      description: 'Report & resolve issues',
      icon: <AlertTriangle className="h-7 w-7" />,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      onSelect: () => onSelect('faults'),
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      description: 'Tasks & scheduling',
      icon: <Cog className="h-7 w-7" />,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      onSelect: () => onSelect('maintenance'),
    },
    {
      key: 'community',
      label: 'Community',
      description: 'Polls & announcements',
      icon: <UsersIcon className="h-7 w-7" />,
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
            icon: <UsersIcon className="h-7 w-7" />,
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            onSelect: () => onSelect('admin'),
          } as FeatureItem,
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3',
        // widen columns when admin adds extra card
        isAdmin ? 'md:grid-cols-6' : 'md:grid-cols-5',
        'gap-3',
        className
      )}
    >
      {features.map(f => (
        <button
          key={f.key}
          onClick={f.onSelect}
          className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-xl"
        >
          <Card
            className={cn(
              'h-full border border-border/60 hover:shadow-sm transition-colors rounded-xl',
              'bg-gradient-to-br from-background to-muted/40'
            )}
          >
            <CardContent className="p-3 flex flex-col items-start gap-2">
              <div
                className={cn(
                  'p-2 rounded-lg inline-flex items-center justify-center shrink-0',
                  f.color,
                  'group-hover:scale-110 transition-transform'
                )}
              >
                {f.icon}
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-sm font-semibold leading-tight">{f.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {f.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
