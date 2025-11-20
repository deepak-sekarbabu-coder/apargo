'use client';

import { useCallback, useEffect, useState } from 'react';

import { MaintenanceTask, Vendor } from '@/lib/core/types';

// Types for API responses
interface TasksResponse {
  success: boolean;
  tasks: MaintenanceTask[];
}

interface VendorsResponse {
  success: boolean;
  vendors: Vendor[];
}

interface TaskResponse {
  success: boolean;
  task: MaintenanceTask;
}

interface VendorResponse {
  success: boolean;
  vendor: Vendor;
}

// Type for error responses from API
interface ErrorResponse {
  error?: string;
  message?: string;
}

// Type guard to check if response data has error/message properties
function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    (typeof (data as ErrorResponse).error === 'string' ||
      typeof (data as ErrorResponse).message === 'string')
  );
}

// Enhanced fetch wrapper with robust error handling & clearer messages
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage: string | undefined;

    // Try JSON first
    try {
      const data: unknown = await response.clone().json();
      if (isErrorResponse(data)) {
        errorMessage = data.error || data.message;
      }
    } catch {
      // Fallback to plain text (e.g. HTML error page or empty body)
      try {
        const text = await response.text();
        if (text) {
          errorMessage = text.slice(0, 250); // cap size
        }
      } catch {
        // ignore
      }
    }

    // Provide friendlier defaults based on status when no explicit message
    if (!errorMessage) {
      if (response.status === 401) errorMessage = 'You are not signed in. Please login and retry.';
      else if (response.status === 403) errorMessage = 'Access denied. Admin permission required.';
      else if (response.status === 404) errorMessage = 'Requested resource not found.';
      else if (response.status >= 500) errorMessage = 'Server error. Please try again shortly.';
      else errorMessage = `Request failed (HTTP ${response.status}).`;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Hook for maintenance tasks
export function useMaintenanceTasks() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<MaintenanceTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<MaintenanceTask[]>([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming/active tasks (most important for dashboard)
  const fetchUpcomingTasks = useCallback(async () => {
    try {
      setUpcomingLoading(true);
      setError(null);

      const response = await apiRequest<{ tasks: MaintenanceTask[] }>(
        '/api/admin/maintenance/tasks?type=upcoming'
      );
      setUpcomingTasks(response.tasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upcoming tasks';
      setError(errorMessage);
      console.error('Error fetching upcoming tasks:', err);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  // Fetch completed tasks with pagination
  const fetchCompletedTasks = useCallback(async (page = 1, pageSize = 5) => {
    try {
      setCompletedLoading(true);
      setError(null);

      const response = await apiRequest<{
        tasks: MaintenanceTask[];
        hasMore: boolean;
        page: number;
        pageSize: number;
      }>(`/api/admin/maintenance/tasks?type=completed&page=${page}&pageSize=${pageSize}`);

      if (page === 1) {
        setCompletedTasks(response.tasks);
      } else {
        setCompletedTasks(prev => [...prev, ...response.tasks]);
      }

      return {
        tasks: response.tasks,
        hasMore: response.hasMore,
        page: response.page,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch completed tasks';
      setError(errorMessage);
      throw err;
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  // Fetch task counts for summary cards
  const fetchTaskCounts = useCallback(async () => {
    try {
      const response = await apiRequest<{ counts: typeof taskCounts }>(
        '/api/admin/maintenance/tasks?type=count'
      );
      setTaskCounts(response.counts);
    } catch (err) {
      console.error('Error fetching task counts:', err);
    }
  }, []);

  // Fetch all tasks (fallback for compatibility)
  const fetchTasks = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);

      const url = `/api/admin/maintenance/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest<TasksResponse>(url);

      setTasks(response.tasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new task
  const createTask = useCallback(
    async (taskData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
      try {
        const response = await apiRequest<TaskResponse>('/api/admin/maintenance/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData),
        });

        // Optimistically update state
        setTasks(prev => [response.task, ...prev]);
        return response.task;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Update task
  const updateTask = useCallback(
    async (id: string, updates: Partial<MaintenanceTask>) => {
      try {
        // Optimistically update state
        setTasks(prev => prev.map(task => (task.id === id ? { ...task, ...updates } : task)));

        await apiRequest('/api/admin/maintenance/tasks', {
          method: 'PUT',
          body: JSON.stringify({ id, ...updates }),
        });
      } catch (err) {
        // Revert optimistic update on error
        await fetchTasks();
        const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchTasks]
  );

  // Delete task
  const deleteTask = useCallback(
    async (id: string) => {
      try {
        // Optimistically update state
        setTasks(prev => prev.filter(task => task.id !== id));

        await apiRequest(`/api/admin/maintenance/tasks?id=${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        // Revert optimistic update on error
        await fetchTasks();
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchTasks]
  );

  // Update task status (convenience method)
  const updateTaskStatus = useCallback(
    async (id: string, status: MaintenanceTask['status']) => {
      const updates: Partial<MaintenanceTask> = { status };

      if (status === 'completed') {
        updates.completedDate = new Date().toISOString();
      }

      if (status === 'skipped') {
        updates.skippedDate = new Date().toISOString();
      }

      return updateTask(id, updates);
    },
    [updateTask]
  );

  // Initial fetch - start with upcoming tasks for fastest initial load
  useEffect(() => {
    fetchUpcomingTasks();
    fetchTaskCounts();
  }, [fetchUpcomingTasks, fetchTaskCounts]);

  return {
    // All tasks (for compatibility)
    tasks,
    loading,

    // Optimized task sets
    upcomingTasks,
    completedTasks,
    taskCounts,
    upcomingLoading,
    completedLoading,

    // Actions
    error,
    fetchTasks,
    fetchUpcomingTasks,
    fetchCompletedTasks,
    fetchTaskCounts,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    setError, // Allow manual error clearing
  };
}

// Hook for vendors
export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all vendors
  const fetchVendors = useCallback(async (activeOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/admin/maintenance/vendors${activeOnly ? '?activeOnly=true' : ''}`;
      const response = await apiRequest<VendorsResponse>(url);

      setVendors(response.vendors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vendors';
      setError(errorMessage);
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new vendor
  const createVendor = useCallback(
    async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>) => {
      try {
        const response = await apiRequest<VendorResponse>('/api/admin/maintenance/vendors', {
          method: 'POST',
          body: JSON.stringify(vendorData),
        });

        // Optimistically update state
        setVendors(prev => [response.vendor, ...prev]);
        return response.vendor;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create vendor';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Update vendor
  const updateVendor = useCallback(
    async (id: string, updates: Partial<Vendor>) => {
      try {
        // Optimistically update state
        setVendors(prev =>
          prev.map(vendor => (vendor.id === id ? { ...vendor, ...updates } : vendor))
        );

        await apiRequest('/api/admin/maintenance/vendors', {
          method: 'PUT',
          body: JSON.stringify({ id, ...updates }),
        });
      } catch (err) {
        // Revert optimistic update on error
        await fetchVendors();
        const errorMessage = err instanceof Error ? err.message : 'Failed to update vendor';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchVendors]
  );

  // Delete vendor
  const deleteVendor = useCallback(
    async (id: string) => {
      try {
        // Optimistically update state
        setVendors(prev => prev.filter(vendor => vendor.id !== id));

        await apiRequest(`/api/admin/maintenance/vendors?id=${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        // Revert optimistic update on error
        await fetchVendors();
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete vendor';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchVendors]
  );

  // Initial fetch
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    setError, // Allow manual error clearing
  };
}

// Combined hook for both tasks and vendors (convenience hook)
export function useMaintenanceData() {
  const tasksHook = useMaintenanceTasks();
  const vendorsHook = useVendors();

  const loading = tasksHook.loading || vendorsHook.loading;
  const error = tasksHook.error || vendorsHook.error;

  const clearErrors = useCallback(() => {
    tasksHook.setError(null);
    vendorsHook.setError(null);
  }, [tasksHook, vendorsHook]);

  const refresh = useCallback(async () => {
    await Promise.all([tasksHook.fetchTasks(), vendorsHook.fetchVendors()]);
  }, [tasksHook, vendorsHook]);

  return {
    // Tasks
    tasks: tasksHook.tasks,
    createTask: tasksHook.createTask,
    updateTask: tasksHook.updateTask,
    deleteTask: tasksHook.deleteTask,
    updateTaskStatus: tasksHook.updateTaskStatus,

    // Vendors
    vendors: vendorsHook.vendors,
    createVendor: vendorsHook.createVendor,
    updateVendor: vendorsHook.updateVendor,
    deleteVendor: vendorsHook.deleteVendor,

    // Combined state
    loading,
    error,
    clearErrors,
    refresh,
  };
}
