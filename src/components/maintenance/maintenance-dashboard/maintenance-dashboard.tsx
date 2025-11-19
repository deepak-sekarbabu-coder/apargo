'use client';

import { useMaintenance } from '@/context/maintenance-context';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';

import React, { useCallback, useState } from 'react';

import { MaintenanceTask } from '@/lib/core/types';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MaintenanceTaskSkeleton } from '@/components/ui/skeleton';

import { useToast } from '@/hooks/use-toast';

import { CompletedTasksSection } from './completed-tasks-section';
import { MaintenanceSummaryCards } from './maintenance-summary-cards';
import { SkippedTasksSection } from './skipped-tasks-section';
import { UpcomingTasksSection } from './upcoming-tasks-section';
import { useMaintenanceData } from './use-maintenance-data';

interface MaintenanceDashboardProps {
  onCreateTask?: () => void;
  onEditTask?: (task: MaintenanceTask) => void;
  onViewTask?: (task: MaintenanceTask) => void;
  isAdmin: boolean;
}

export function MaintenanceDashboard({
  onCreateTask,
  onEditTask,
  onViewTask,
  isAdmin,
}: MaintenanceDashboardProps) {
  const { toast } = useToast();

  // Use the maintenance context for data (efficient subscription-based pattern like other pages)
  const { tasks, vendors, loading, editTask, removeTask } = useMaintenance();

  // Local error state and operations
  const [error, setError] = useState<string | null>(null);

  // Collapse states for each section
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [skippedCollapsed, setSkippedCollapsed] = useState(false);

  // Pagination state for completed tasks
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
  const [isLoadingCompletedTasks, setIsLoadingCompletedTasks] = useState(false);
  const COMPLETED_TASKS_PER_PAGE = 5;

  // Process data using custom hook
  const { upcomingTasks, completedTasks, skippedTasks, vendorMap, activeVendorsCount } =
    useMaintenanceData(tasks, vendors);

  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    // Context handles refresh via subscriptions, no manual refresh needed
    toast({
      title: 'Refreshed',
      description: 'Data is automatically synced via real-time subscriptions.',
    });
  }, [toast]);

  // Task status update using context methods
  const updateTaskStatus = useCallback(
    async (taskId: string, status: MaintenanceTask['status']) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<MaintenanceTask> = { status };

      if (status === 'completed') {
        updates.completedDate = new Date().toISOString();
      }

      if (status === 'skipped') {
        updates.skippedDate = new Date().toISOString();
      }

      await editTask(taskId, updates);
    },
    [tasks, editTask]
  );

  // Task deletion using context methods
  const deleteTask = useCallback(
    async (taskId: string) => {
      await removeTask(taskId);
    },
    [removeTask]
  );

  // Handle status updates with optimistic UI and error handling
  const handleUpdateStatus = useCallback(
    async (task: MaintenanceTask, status: MaintenanceTask['status']) => {
      try {
        await updateTaskStatus(task.id, status);

        // Show success message
        const statusMessage =
          {
            completed: 'Task marked as completed',
            in_progress: 'Task started',
            cancelled: 'Task cancelled',
            skipped: 'Task skipped',
            scheduled: 'Task rescheduled',
            overdue: 'Task marked as overdue',
          }[status] || 'Task status updated';

        toast({
          title: 'Success',
          description: statusMessage,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to update task status',
          variant: 'destructive',
        });
      }
    },
    [updateTaskStatus, toast]
  );

  // Handle task deletion with confirmation
  const handleDeleteTask = useCallback(
    async (task: MaintenanceTask) => {
      try {
        await deleteTask(task.id);
        toast({
          title: 'Task Deleted',
          description: `Task "${task.title}" has been deleted successfully.`,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete task',
          variant: 'destructive',
        });
      }
    },
    [deleteTask, toast]
  );

  // Handle create task action
  const handleCreateTask = useCallback(() => {
    if (onCreateTask) {
      onCreateTask();
    }
  }, [onCreateTask]);

  // Handle edit task action
  const handleEditTask = useCallback(
    (task: MaintenanceTask) => {
      if (onEditTask) {
        onEditTask(task);
      }
    },
    [onEditTask]
  );

  // Handle view task action
  const handleViewTask = useCallback(
    (task: MaintenanceTask) => {
      if (onViewTask) {
        onViewTask(task);
      }
    },
    [onViewTask]
  );

  // Handle page change with loading state
  const handleCompletedPageChange = async (page: number) => {
    setIsLoadingCompletedTasks(true);
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setCompletedCurrentPage(page);
    setIsLoadingCompletedTasks(false);
  };

  // Handle refresh action
  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
      toast({
        title: 'Refreshed',
        description: 'Data has been refreshed successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    }
  }, [refresh, toast]);

  return (
    <div className="space-y-4 sm:space-y-8 p-4 md:p-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm">{error}</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={clearErrors} className="flex-1 sm:flex-none">
                Dismiss
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="flex-1 sm:flex-none">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Maintenance Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage property maintenance tasks and track progress
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            size="lg"
            className="inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={handleCreateTask}
            className="inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow flex-1 sm:flex-none"
            size="lg"
            disabled={loading}
          >
            <Plus className="w-5 h-5" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && tasks.length === 0 && (
        <div className="space-y-4 sm:space-y-8">
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mt-2"></div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <MaintenanceTaskSkeleton count={3} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Only show when not in initial loading state */}
      {(!loading || tasks.length > 0) && (
        <>
          {/* Summary Cards */}
          <MaintenanceSummaryCards
            upcomingCount={upcomingTasks.length}
            completedCount={completedTasks.length}
            activeVendorsCount={activeVendorsCount}
          />

          {/* Main Content Grid */}
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">
            {/* Upcoming & Active Tasks Section */}
            <UpcomingTasksSection
              upcomingTasks={upcomingTasks}
              vendorMap={vendorMap}
              isCollapsed={upcomingCollapsed}
              onToggleCollapse={setUpcomingCollapsed}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onUpdateStatus={handleUpdateStatus}
              isAdmin={isAdmin}
            />

            {/* Recently Completed Tasks Section */}
            <CompletedTasksSection
              completedTasks={completedTasks}
              vendorMap={vendorMap}
              isCollapsed={completedCollapsed}
              onToggleCollapse={setCompletedCollapsed}
              currentPage={completedCurrentPage}
              onPageChange={handleCompletedPageChange}
              isLoadingTasks={isLoadingCompletedTasks}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onDeleteTask={handleDeleteTask}
              isAdmin={isAdmin}
              tasksPerPage={COMPLETED_TASKS_PER_PAGE}
            />

            {/* Skipped Tasks Section */}
            <SkippedTasksSection
              skippedTasks={skippedTasks}
              vendorMap={vendorMap}
              isCollapsed={skippedCollapsed}
              onToggleCollapse={setSkippedCollapsed}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onDeleteTask={handleDeleteTask}
              isAdmin={isAdmin}
            />
          </div>
        </>
      )}
    </div>
  );
}
export default MaintenanceDashboard;
