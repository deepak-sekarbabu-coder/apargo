import { useMemo } from 'react';

import type { MaintenanceTask, Vendor } from '@/lib/types';

export function useMaintenanceData(tasks: MaintenanceTask[], vendors: Vendor[]) {
  return useMemo(() => {
    // Create vendor lookup map once
    const vendorLookup = Object.fromEntries(vendors.map(v => [v.id, v]));

    // Single pass through tasks with early filtering
    const upcoming: MaintenanceTask[] = [];
    const completed: MaintenanceTask[] = [];
    const skipped: MaintenanceTask[] = [];

    // Use a Set to track seen IDs for deduplication
    const seenIds = new Set<string>();

    for (const task of tasks) {
      // Skip duplicates
      if (seenIds.has(task.id)) continue;
      seenIds.add(task.id);

      // Categorize tasks
      if (['scheduled', 'in_progress', 'overdue'].includes(task.status)) {
        upcoming.push(task);
      } else if (task.status === 'completed') {
        completed.push(task);
      } else if (task.status === 'skipped') {
        skipped.push(task);
      }
    }

    // Sort each category (limit to what's needed for display)
    upcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    completed.sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));
    skipped.sort((a, b) => (b.skippedDate || '').localeCompare(a.skippedDate || ''));

    return {
      upcomingTasks: upcoming.slice(0, 10), // Limit upcoming tasks for performance
      completedTasks: completed,
      skippedTasks: skipped,
      vendorMap: vendorLookup,
      activeVendorsCount: vendors.filter(v => v.isActive).length,
    };
  }, [tasks, vendors]);
}

// Task progress calculation for in-progress tasks
export const getTaskProgress = (task: MaintenanceTask) => {
  if (task.status !== 'in_progress') return 0;

  const scheduledDate = new Date(task.scheduledDate);
  const now = new Date();
  const daysSinceStart = Math.max(
    0,
    Math.floor((now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Assume a task takes 3 days on average, adjust as needed
  const estimatedDays = 3;
  return Math.min(100, (daysSinceStart / estimatedDays) * 100);
};
