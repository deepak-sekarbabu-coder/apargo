// Test file for recurring maintenance task functionality
const {
  calculateNextRecurrenceDate,
  createRecurringTaskFromCompleted,
  shouldCreateRecurringTask,
} = require('../../../src/lib/maintenance-utils');

describe('Recurring Maintenance Tasks', () => {
  const baseTask = {
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
  });

  describe('shouldCreateRecurringTask', () => {
    it('should return true for completed recurring task', () => {
      expect(shouldCreateRecurringTask(baseTask)).toBe(true);
    });

    it('should return false for non-recurring task', () => {
      const nonRecurringTask = { ...baseTask, recurrence: 'none' };
      expect(shouldCreateRecurringTask(nonRecurringTask)).toBe(false);
    });

    it('should return false for incomplete task', () => {
      const incompleteTask = { ...baseTask, status: 'in_progress' };
      expect(shouldCreateRecurringTask(incompleteTask)).toBe(false);
    });
  });

  describe('createRecurringTaskFromCompleted', () => {
    it('should create new task with correct properties', () => {
      const newTask = createRecurringTaskFromCompleted(baseTask);

      // Should preserve basic properties
      expect(newTask.title).toBe(baseTask.title);
      expect(newTask.description).toBe(baseTask.description);
      expect(newTask.category).toBe(baseTask.category);
      expect(newTask.recurrence).toBe(baseTask.recurrence);

      // Should reset completion-specific data
      expect(newTask.status).toBe('scheduled');
      expect(newTask.completedDate).toBeUndefined();
      expect(newTask.actualCost).toBeUndefined();
    });
  });
});

console.log('✅ Recurring task test file created successfully!');
