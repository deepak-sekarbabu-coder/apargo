import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { MaintenanceTask } from '../core/types';
import { db } from '../firebase/firebase';
import {
  createRecurringTaskFromCompleted,
  createRecurringTaskFromSkipped,
  shouldCreateRecurringTask,
  shouldCreateRecurringTaskOnSkip,
} from '../maintenance/maintenance-utils';
import { removeUndefined } from './firestore-utils';

const computeTaskStatus = (task: MaintenanceTask): MaintenanceTask => {
  // If already in a terminal state, leave unchanged
  if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'overdue')
    return task;
  const today = new Date().toISOString().split('T')[0];
  const due = task.dueDate || task.scheduledDate;
  // For non-terminal active states (scheduled, in_progress) compute overdue
  if (due < today) {
    return { ...task, status: 'overdue' };
  }
  return task;
};

export const getMaintenanceTasks = async (
  start?: string,
  end?: string,
  status?: MaintenanceTask['status'][],
  limit_count = 50
): Promise<MaintenanceTask[]> => {
  let tasksQuery = query(collection(db, 'maintenanceTasks'));

  // Filter by status if provided (for upcoming/active tasks)
  if (status && status.length > 0) {
    tasksQuery = query(tasksQuery, where('status', 'in', status));
  }

  // Add date filtering with proper indexing
  if (start && end) {
    tasksQuery = query(
      tasksQuery,
      where('scheduledDate', '>=', start),
      where('scheduledDate', '<=', end),
      orderBy('scheduledDate', 'desc'),
      limit(limit_count)
    );
  } else if (status && status.includes('completed')) {
    // For completed tasks, order by completion date
    tasksQuery = query(tasksQuery, orderBy('completedDate', 'desc'), limit(limit_count));
  } else {
    // Default: order by scheduled date
    tasksQuery = query(tasksQuery, orderBy('scheduledDate', 'desc'), limit(limit_count));
  }

  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
  return tasks.map(computeTaskStatus);
};

// Optimized queries for dashboard performance
export const getUpcomingMaintenanceTasks = async (limit_count = 20): Promise<MaintenanceTask[]> => {
  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', 'in', ['scheduled', 'in_progress']),
    orderBy('status', 'asc'),
    orderBy('scheduledDate', 'asc'),
    limit(limit_count)
  );

  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
  return tasks.map(computeTaskStatus);
};

export const getCompletedMaintenanceTasks = async (
  page = 1,
  pageSize = 5
): Promise<{ tasks: MaintenanceTask[]; hasMore: boolean }> => {
  const offset = (page - 1) * pageSize;

  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', '==', 'completed'),
    orderBy('completedDate', 'desc'),
    limit(pageSize + 1) // Get one extra to check if there are more
  );

  const snapshot = await getDocs(tasksQuery);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);

  // Apply offset manually (Firestore doesn't have efficient offset)
  const tasks = allTasks.slice(offset, offset + pageSize).map(computeTaskStatus);
  const hasMore = allTasks.length > offset + pageSize;

  return { tasks, hasMore };
};

export const getMaintenanceTasksCount = async (): Promise<{
  total: number;
  upcoming: number;
  completed: number;
}> => {
  // Use count() aggregation for efficiency
  const totalQuery = query(collection(db, 'maintenanceTasks'));
  const upcomingQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', 'in', ['scheduled', 'in_progress'])
  );
  const completedQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', '==', 'completed')
  );

  const [totalSnap, upcomingSnap, completedSnap] = await Promise.all([
    getCountFromServer(totalQuery),
    getCountFromServer(upcomingQuery),
    getCountFromServer(completedQuery),
  ]);

  return {
    total: totalSnap.data().count,
    upcoming: upcomingSnap.data().count,
    completed: completedSnap.data().count,
  };
};

export const addMaintenanceTask = async (
  task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    status?: MaintenanceTask['status'];
  }
): Promise<MaintenanceTask> => {
  const tasksCol = collection(db, 'maintenanceTasks');
  const now = new Date().toISOString();
  const newTask: Omit<MaintenanceTask, 'id'> = {
    ...task,
    status: task.status || 'scheduled',
    createdAt: now,
    updatedAt: now,
  };
  const cleanTask = removeUndefined(newTask);
  const docRef = await addDoc(tasksCol, cleanTask);
  return computeTaskStatus({ id: docRef.id, ...cleanTask } as MaintenanceTask);
};

export const updateMaintenanceTask = async (
  id: string,
  task: Partial<MaintenanceTask>
): Promise<MaintenanceTask | undefined> => {
  const taskDoc = doc(db, 'maintenanceTasks', id);

  // First, get the current task to check if we need to handle recurrence
  const currentTaskSnap = await getDoc(taskDoc);
  if (!currentTaskSnap.exists()) {
    throw new Error('Task not found');
  }

  const currentTask = { id: currentTaskSnap.id, ...currentTaskSnap.data() } as MaintenanceTask;

  // Update the current task
  const clean = removeUndefined({ ...task, updatedAt: new Date().toISOString() });
  await updateDoc(taskDoc, clean);

  // Create the updated task object for recurrence check
  const updatedTask: MaintenanceTask = { ...currentTask, ...task };

  // Check if this update completes a recurring task and we need to create a new instance
  if (
    task.status === 'completed' &&
    currentTask.status !== 'completed' && // Only if it wasn't already completed
    shouldCreateRecurringTask(updatedTask)
  ) {
    try {
      // Create a new recurring task
      const recurringTaskData = createRecurringTaskFromCompleted(updatedTask);
      const newRecurringTask = await addMaintenanceTask({
        ...recurringTaskData,
        createdBy: updatedTask.createdBy,
      });

      return newRecurringTask;
    } catch (error) {
      console.error('Failed to create recurring task:', error);
      // Don't fail the original update if recurring task creation fails
    }
  }

  // Check if this update skips a recurring task and we need to create a new instance
  if (
    task.status === 'skipped' &&
    currentTask.status !== 'skipped' && // Only if it wasn't already skipped
    shouldCreateRecurringTaskOnSkip(updatedTask)
  ) {
    try {
      // Create a new recurring task from the skipped task
      const recurringTaskData = createRecurringTaskFromSkipped(updatedTask);
      const newRecurringTask = await addMaintenanceTask({
        ...recurringTaskData,
        createdBy: updatedTask.createdBy,
      });

      return newRecurringTask;
    } catch (error) {
      console.error('Failed to create recurring task from skipped task:', error);
      // Don't fail the original update if recurring task creation fails
    }
  }

  return undefined;
};

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
  const taskDoc = doc(db, 'maintenanceTasks', id);
  await deleteDoc(taskDoc);
};

export const subscribeToMaintenanceTasks = (
  callback: (tasks: MaintenanceTask[]) => void,
  limitCount = 200
) => {
  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    orderBy('scheduledDate', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(tasksQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
    callback(tasks.map(computeTaskStatus));
  });
};

// Helper to apply actualCost to budget aggregations when task completes
