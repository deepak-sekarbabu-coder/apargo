// Test file for skip-related utility functions
import {
  calculateNextRecurrenceDate,
  createRecurringTaskFromSkipped,
  shouldCreateRecurringTaskOnSkip,
} from '@/lib/maintenance-utils';
import { MaintenanceTask } from '@/lib/types';

describe('Skip Functionality Utility Functions', () => {
  const baseSkippedTask: MaintenanceTask = {
    id: 'test-skip-1',
    title: 'Monthly Water Tank Cleaning',
    description: 'Regular monthly cleaning of water tank',
    category: 'water_tank',
    scheduledDate: '2025-08-23T00:00:00.000Z',
    dueDate: '2025-08-25T00:00:00.000Z',
    skippedDate: '2025-08-23T10:30:00.000Z',
    status: 'skipped',
    costEstimate: 3000,
    notes: 'Routine maintenance task',
    recurrence: 'monthly',
    createdBy: 'admin-user-1',
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: '2025-08-23T10:30:00.000Z',
  };

  describe('shouldCreateRecurringTaskOnSkip', () => {
    it('should return true for skipped recurring task', () => {
      expect(shouldCreateRecurringTaskOnSkip(baseSkippedTask)).toBe(true);
    });

    it('should return false for non-recurring skipped task', () => {
      const nonRecurringTask = { ...baseSkippedTask, recurrence: 'none' as const };
      expect(shouldCreateRecurringTaskOnSkip(nonRecurringTask)).toBe(false);
    });

    it('should return false for skipped task without recurrence', () => {
      const noRecurrenceTask = { ...baseSkippedTask, recurrence: undefined };
      expect(shouldCreateRecurringTaskOnSkip(noRecurrenceTask)).toBe(false);
    });

    it('should return false for non-skipped task', () => {
      const nonSkippedTask = { ...baseSkippedTask, status: 'scheduled' as const };
      expect(shouldCreateRecurringTaskOnSkip(nonSkippedTask)).toBe(false);
    });

    it('should return false for skipped task without skip date', () => {
      const taskWithoutSkipDate = { ...baseSkippedTask, skippedDate: undefined };
      expect(shouldCreateRecurringTaskOnSkip(taskWithoutSkipDate)).toBe(false);
    });
  });

  describe('createRecurringTaskFromSkipped', () => {
    it('should create new task with correct next scheduled date for monthly recurrence', () => {
      const newTask = createRecurringTaskFromSkipped(baseSkippedTask);

      // Should preserve basic properties
      expect(newTask.title).toBe(baseSkippedTask.title);
      expect(newTask.description).toBe(baseSkippedTask.description);
      expect(newTask.category).toBe(baseSkippedTask.category);
      expect(newTask.recurrence).toBe(baseSkippedTask.recurrence);
      expect(newTask.createdBy).toBe(baseSkippedTask.createdBy);

      // Should reset skip/completion-specific data
      expect(newTask.status).toBe('scheduled');
      expect(newTask.skippedDate).toBeUndefined();
      expect(newTask.completedDate).toBeUndefined();
      expect(newTask.actualCost).toBeUndefined();
      expect(newTask.attachments).toBeUndefined();

      // Should have new scheduled date (one month after skip date)
      const expectedDate = new Date(baseSkippedTask.skippedDate!);
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should calculate due date if original task had one', () => {
      const newTask = createRecurringTaskFromSkipped(baseSkippedTask);

      // Should have new due date (one month after original skip date)
      const expectedDueDate = new Date(baseSkippedTask.skippedDate!);
      expectedDueDate.setMonth(expectedDueDate.getMonth() + 1);
      expect(newTask.dueDate).toBe(expectedDueDate.toISOString());
    });

    it('should handle quarterly recurrence correctly', () => {
      const quarterlyTask = { ...baseSkippedTask, recurrence: 'quarterly' as const };
      const newTask = createRecurringTaskFromSkipped(quarterlyTask);

      const expectedDate = new Date(quarterlyTask.skippedDate!);
      expectedDate.setMonth(expectedDate.getMonth() + 3);
      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should handle semi-annual recurrence correctly', () => {
      const semiAnnualTask = { ...baseSkippedTask, recurrence: 'semi_annual' as const };
      const newTask = createRecurringTaskFromSkipped(semiAnnualTask);

      const expectedDate = new Date(semiAnnualTask.skippedDate!);
      expectedDate.setMonth(expectedDate.getMonth() + 6);
      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should handle annual recurrence correctly', () => {
      const annualTask = { ...baseSkippedTask, recurrence: 'annual' as const };
      const newTask = createRecurringTaskFromSkipped(annualTask);

      const expectedDate = new Date(annualTask.skippedDate!);
      expectedDate.setFullYear(expectedDate.getFullYear() + 1);
      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should throw error for non-recurring skipped task', () => {
      const nonRecurringTask = { ...baseSkippedTask, recurrence: 'none' as const };
      expect(() => createRecurringTaskFromSkipped(nonRecurringTask)).toThrow(
        'Cannot create recurring task from a non-recurring task'
      );
    });

    it('should throw error for skipped task without skip date', () => {
      const taskWithoutSkipDate = { ...baseSkippedTask, skippedDate: undefined };
      expect(() => createRecurringTaskFromSkipped(taskWithoutSkipDate)).toThrow(
        'Cannot create recurring task without skip date'
      );
    });

    it('should handle task without due date', () => {
      const taskWithoutDueDate = { ...baseSkippedTask, dueDate: undefined };
      const newTask = createRecurringTaskFromSkipped(taskWithoutDueDate);

      expect(newTask.dueDate).toBeUndefined();
    });
  });

  describe('Edge cases for skip functionality', () => {
    it('should handle month overflow correctly for skipped tasks', () => {
      // Test task skipped on December 31st
      const decemberSkippedTask = {
        ...baseSkippedTask,
        skippedDate: '2024-12-31T23:59:59.000Z',
      };

      const newTask = createRecurringTaskFromSkipped(decemberSkippedTask);
      const expectedDate = new Date('2024-12-31T23:59:59.000Z');
      expectedDate.setMonth(expectedDate.getMonth() + 1); // Should become January 31, 2025

      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should handle leap year edge case for skipped tasks', () => {
      // Test task skipped on February 29th of leap year
      const leapYearSkippedTask = {
        ...baseSkippedTask,
        skippedDate: '2024-02-29T12:00:00.000Z', // 2024 is a leap year
        recurrence: 'annual' as const,
      };

      const newTask = createRecurringTaskFromSkipped(leapYearSkippedTask);
      const expectedDate = new Date('2024-02-29T12:00:00.000Z');
      expectedDate.setFullYear(expectedDate.getFullYear() + 1); // Should become February 28, 2025

      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should preserve vendor and cost estimate from skipped task', () => {
      const skippedTaskWithVendor = {
        ...baseSkippedTask,
        vendorId: 'vendor-123',
        costEstimate: 5000,
      };

      const newTask = createRecurringTaskFromSkipped(skippedTaskWithVendor);

      expect(newTask.vendorId).toBe('vendor-123');
      expect(newTask.costEstimate).toBe(5000);
    });

    it('should preserve notes from skipped task', () => {
      const skippedTaskWithNotes = {
        ...baseSkippedTask,
        notes: 'Important maintenance notes',
      };

      const newTask = createRecurringTaskFromSkipped(skippedTaskWithNotes);

      expect(newTask.notes).toBe('Important maintenance notes');
    });
  });
});

console.log('✅ Skip utility function tests created successfully!');
