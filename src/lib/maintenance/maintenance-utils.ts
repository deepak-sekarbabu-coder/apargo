import { MaintenanceTask } from '../core/types';

/**
 * Calculate the next scheduled date for a recurring task based on the completion date
 * and the recurrence interval.
 */
export function calculateNextRecurrenceDate(
  completionDate: string,
  recurrence: NonNullable<MaintenanceTask['recurrence']>
): string {
  const completionDateTime = new Date(completionDate);

  switch (recurrence) {
    case 'monthly':
      completionDateTime.setMonth(completionDateTime.getMonth() + 1);
      break;
    case 'quarterly':
      completionDateTime.setMonth(completionDateTime.getMonth() + 3);
      break;
    case 'semi_annual':
      completionDateTime.setMonth(completionDateTime.getMonth() + 6);
      break;
    case 'annual':
      completionDateTime.setFullYear(completionDateTime.getFullYear() + 1);
      break;
    case 'none':
    default:
      // For non-recurring tasks, return the original date (this shouldn't be called)
      return completionDate;
  }

  return completionDateTime.toISOString();
}

/**
 * Create a new recurring task based on a completed task.
 * This strips out completion-specific data and updates the scheduled date.
 */
export function createRecurringTaskFromCompleted(
  completedTask: MaintenanceTask
): Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> {
  if (!completedTask.recurrence || completedTask.recurrence === 'none') {
    throw new Error('Cannot create recurring task from a non-recurring task');
  }

  if (!completedTask.completedDate) {
    throw new Error('Cannot create recurring task without completion date');
  }

  const nextScheduledDate = calculateNextRecurrenceDate(
    completedTask.completedDate,
    completedTask.recurrence
  );

  return {
    title: completedTask.title,
    description: completedTask.description,
    category: completedTask.category,
    vendorId: completedTask.vendorId,
    scheduledDate: nextScheduledDate,
    dueDate: completedTask.dueDate
      ? calculateNextRecurrenceDate(completedTask.completedDate, completedTask.recurrence)
      : undefined,
    status: 'scheduled',
    costEstimate: completedTask.costEstimate,
    // Reset actual cost and completion date for new task
    actualCost: undefined,
    completedDate: undefined,
    attachments: undefined, // Start fresh with attachments
    notes: completedTask.notes,
    recurrence: completedTask.recurrence,
    createdBy: completedTask.createdBy,
  };
}

/**
 * Check if a task should generate a recurring instance when completed.
 */
export function shouldCreateRecurringTask(task: MaintenanceTask): boolean {
  return (
    task.status === 'completed' &&
    task.recurrence !== undefined &&
    task.recurrence !== 'none' &&
    task.completedDate !== undefined
  );
}

/**
 * Check if a task should generate a recurring instance when skipped.
 */
export function shouldCreateRecurringTaskOnSkip(task: MaintenanceTask): boolean {
  return (
    task.status === 'skipped' &&
    task.recurrence !== undefined &&
    task.recurrence !== 'none' &&
    task.skippedDate !== undefined
  );
}

/**
 * Create a new recurring task based on a skipped task.
 * This strips out skip-specific data and updates the scheduled date to current date + recurrence interval.
 */
export function createRecurringTaskFromSkipped(
  skippedTask: MaintenanceTask
): Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'> {
  if (!skippedTask.recurrence || skippedTask.recurrence === 'none') {
    throw new Error('Cannot create recurring task from a non-recurring task');
  }

  if (!skippedTask.skippedDate) {
    throw new Error('Cannot create recurring task without skip date');
  }

  // Calculate next scheduled date from current date (when skipped) + recurrence interval
  const nextScheduledDate = calculateNextRecurrenceDate(
    skippedTask.skippedDate,
    skippedTask.recurrence
  );

  return {
    title: skippedTask.title,
    description: skippedTask.description,
    category: skippedTask.category,
    vendorId: skippedTask.vendorId,
    scheduledDate: nextScheduledDate,
    dueDate: skippedTask.dueDate
      ? calculateNextRecurrenceDate(skippedTask.skippedDate, skippedTask.recurrence)
      : undefined,
    status: 'scheduled',
    costEstimate: skippedTask.costEstimate,
    // Reset completion/skip specific data for new task
    actualCost: undefined,
    completedDate: undefined,
    skippedDate: undefined,
    attachments: undefined, // Start fresh with attachments
    notes: skippedTask.notes,
    recurrence: skippedTask.recurrence,
    createdBy: skippedTask.createdBy,
  };
}
