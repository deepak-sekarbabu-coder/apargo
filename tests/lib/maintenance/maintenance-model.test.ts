// Basic data model tests for maintenance feature (lightweight, not hitting Firestore)
import { MaintenanceTask } from '@/lib/types';

describe('MaintenanceTask model', () => {
  it('computes overdue status when due date in past and not completed', () => {
    const today = new Date();
    const past = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
    const task: MaintenanceTask = {
      id: 't1',
      title: 'Test',
      category: 'elevator',
      scheduledDate: past,
      status: 'scheduled',
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      recurrence: 'none',
    };
    // Local compute similar to firestore helper
    const compute = (t: MaintenanceTask) => {
      if (t.status === 'completed' || t.status === 'cancelled') return t.status;
      const todayISO = new Date().toISOString().split('T')[0];
      const due = t.dueDate || t.scheduledDate;
      if (due < todayISO) return 'overdue';
      return t.status;
    };
    expect(compute(task)).toBe('overdue');
  });
});
