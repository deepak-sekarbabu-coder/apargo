// Test file for recurring maintenance task functionality
import {
  calculateNextRecurrenceDate,
  createRecurringTaskFromCompleted,
  shouldCreateRecurringTask,
} from '@/lib/maintenance-utils';
import { MaintenanceTask } from '@/lib/types';

describe('Recurring Maintenance Tasks', () => {
  const baseTask: MaintenanceTask = {
    id: 'test-task-1',
    title: 'Monthly Elevator Inspection',
    description: 'Regular monthly inspection of elevator systems',
    category: 'elevator',
    scheduledDate: '2025-01-15T00:00:00.000Z',
    dueDate: '2025-01-20T00:00:00.000Z',
    completedDate: '2025-01-18T10:30:00.000Z',
    status: 'completed',
    costEstimate: 5000,
    actualCost: 4500,
    notes: 'Inspection completed successfully',
    recurrence: 'monthly',
    createdBy: 'admin-user-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-18T10:30:00.000Z',
  };

  describe('calculateNextRecurrenceDate', () => {
    it('should calculate monthly recurrence correctly', () => {
      const completionDate = '2025-01-18T10:30:00.000Z';
      const nextDate = calculateNextRecurrenceDate(completionDate, 'monthly');
      const expected = new Date('2025-01-18T10:30:00.000Z');
      expected.setMonth(expected.getMonth() + 1);

      expect(nextDate).toBe(expected.toISOString());
    });

    it('should calculate quarterly recurrence correctly', () => {
      const completionDate = '2025-01-18T10:30:00.000Z';
      const nextDate = calculateNextRecurrenceDate(completionDate, 'quarterly');
      const expected = new Date('2025-01-18T10:30:00.000Z');
      expected.setMonth(expected.getMonth() + 3);

      expect(nextDate).toBe(expected.toISOString());
    });

    it('should calculate semi-annual recurrence correctly', () => {
      const completionDate = '2025-01-18T10:30:00.000Z';
      const nextDate = calculateNextRecurrenceDate(completionDate, 'semi_annual');
      const expected = new Date('2025-01-18T10:30:00.000Z');
      expected.setMonth(expected.getMonth() + 6);

      expect(nextDate).toBe(expected.toISOString());
    });

    it('should calculate annual recurrence correctly', () => {
      const completionDate = '2025-01-18T10:30:00.000Z';
      const nextDate = calculateNextRecurrenceDate(completionDate, 'annual');
      const expected = new Date('2025-01-18T10:30:00.000Z');
      expected.setFullYear(expected.getFullYear() + 1);

      expect(nextDate).toBe(expected.toISOString());
    });
  });

  describe('shouldCreateRecurringTask', () => {
    it('should return true for completed recurring task', () => {
      expect(shouldCreateRecurringTask(baseTask)).toBe(true);
    });

    it('should return false for non-recurring task', () => {
      const nonRecurringTask = { ...baseTask, recurrence: 'none' as const };
      expect(shouldCreateRecurringTask(nonRecurringTask)).toBe(false);
    });

    it('should return false for incomplete task', () => {
      const incompleteTask = { ...baseTask, status: 'in_progress' as const };
      expect(shouldCreateRecurringTask(incompleteTask)).toBe(false);
    });

    it('should return false for task without completion date', () => {
      const taskWithoutCompletion = { ...baseTask, completedDate: undefined };
      expect(shouldCreateRecurringTask(taskWithoutCompletion)).toBe(false);
    });
  });

  describe('createRecurringTaskFromCompleted', () => {
    it('should create new task with correct next scheduled date', () => {
      const newTask = createRecurringTaskFromCompleted(baseTask);

      // Should preserve basic properties
      expect(newTask.title).toBe(baseTask.title);
      expect(newTask.description).toBe(baseTask.description);
      expect(newTask.category).toBe(baseTask.category);
      expect(newTask.recurrence).toBe(baseTask.recurrence);
      expect(newTask.createdBy).toBe(baseTask.createdBy);

      // Should reset completion-specific data
      expect(newTask.status).toBe('scheduled');
      expect(newTask.completedDate).toBeUndefined();
      expect(newTask.actualCost).toBeUndefined();
      expect(newTask.attachments).toBeUndefined();

      // Should have new scheduled date (one month after completion)
      const expectedDate = new Date(baseTask.completedDate!);
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should calculate due date if original task had one', () => {
      const newTask = createRecurringTaskFromCompleted(baseTask);

      // Should have new due date (one month after original completion)
      const expectedDueDate = new Date(baseTask.completedDate!);
      expectedDueDate.setMonth(expectedDueDate.getMonth() + 1);
      expect(newTask.dueDate).toBe(expectedDueDate.toISOString());
    });

    it('should throw error for non-recurring task', () => {
      const nonRecurringTask = { ...baseTask, recurrence: 'none' as const };
      expect(() => createRecurringTaskFromCompleted(nonRecurringTask)).toThrow(
        'Cannot create recurring task from a non-recurring task'
      );
    });

    it('should throw error for task without completion date', () => {
      const taskWithoutCompletion = { ...baseTask, completedDate: undefined };
      expect(() => createRecurringTaskFromCompleted(taskWithoutCompletion)).toThrow(
        'Cannot create recurring task without completion date'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle month overflow correctly', () => {
      // Test task completed on December 31st
      const decemberTask = {
        ...baseTask,
        completedDate: '2024-12-31T23:59:59.000Z',
      };

      const newTask = createRecurringTaskFromCompleted(decemberTask);
      const expectedDate = new Date('2024-12-31T23:59:59.000Z');
      expectedDate.setMonth(expectedDate.getMonth() + 1); // Should become January 31, 2025

      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });

    it('should handle leap year edge case', () => {
      // Test task completed on February 29th of leap year
      const leapYearTask = {
        ...baseTask,
        completedDate: '2024-02-29T12:00:00.000Z', // 2024 is a leap year
        recurrence: 'annual' as const,
      };

      const newTask = createRecurringTaskFromCompleted(leapYearTask);
      const expectedDate = new Date('2024-02-29T12:00:00.000Z');
      expectedDate.setFullYear(expectedDate.getFullYear() + 1); // Should become February 28, 2025

      expect(newTask.scheduledDate).toBe(expectedDate.toISOString());
    });
  });
});

console.log('✅ All recurring task utility tests defined successfully!');
