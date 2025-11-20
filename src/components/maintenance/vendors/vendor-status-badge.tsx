import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

export function StatusBadge({ active, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
        active
          ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/30'
          : 'bg-gray-100 text-gray-600 ring-gray-300 dark:bg-gray-500/15 dark:text-gray-400 dark:ring-gray-500/30'
      } ${className}`}
      aria-label={active ? 'Active vendor' : 'Inactive vendor'}
    >
      <span
        className={`block h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
