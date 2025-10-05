import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  SkipForward,
  Timer,
  User,
  XCircle,
} from 'lucide-react';

import React, { useMemo } from 'react';

import type { MaintenanceTask, Vendor } from '@/lib/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SimplePagination } from '@/components/ui/pagination';
import { MaintenanceTaskSkeleton } from '@/components/ui/skeleton';

// Status badge component matching the main dashboard
const statusConfig: Record<
  MaintenanceTask['status'],
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50',
    textColor: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: XCircle,
  },
  skipped: {
    label: 'Skipped',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: SkipForward,
  },
  scheduled: {
    label: 'Scheduled',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Calendar,
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Timer,
  },
  overdue: {
    label: 'Overdue',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
    textColor: 'text-red-700 dark:text-red-300',
    icon: Clock,
  },
};

const StatusBadge = ({ status }: { status: MaintenanceTask['status'] }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
      ${config.bgColor} ${config.textColor}
      transition-colors duration-200
    `}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
};

// Enhanced Completed Task Card Component
interface CompletedTaskCardProps {
  task: MaintenanceTask;
  vendor?: Vendor;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

export const CompletedTaskCard: React.FC<CompletedTaskCardProps> = ({
  task,
  vendor,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  return (
    <div className="group relative p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 hover:border-border/60">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={onEdit}
          className="text-left flex-1 hover:text-primary transition-colors"
          title={isAdmin ? 'Edit completed task' : 'View completed task details'}
        >
          <h4 className="font-semibold text-base leading-tight text-card-foreground group-hover:text-primary transition-colors">
            {task.title}
          </h4>
        </button>
        <StatusBadge status={task.status} />
      </div>

      {/* Task Details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {task.completedDate && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="font-medium">
              Completed {format(new Date(task.completedDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}
        {task.skippedDate && task.status === 'skipped' && (
          <div className="flex items-center gap-2">
            <SkipForward className="w-4 h-4 text-orange-500" />
            <span className="font-medium">
              Skipped {format(new Date(task.skippedDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {vendor && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground/60" />
            <span>{vendor.name}</span>
          </div>
        )}

        {task.actualCost && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground/60" />
            <span>Cost: ₹{task.actualCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-destructive hover:text-destructive hover:border-destructive"
              >
                Delete Task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be
                  undone and will permanently remove the task.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

interface CompletedTasksSectionProps {
  completedTasks: MaintenanceTask[];
  vendorMap: Record<string, Vendor>;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoadingTasks: boolean;
  onEditTask: (task: MaintenanceTask) => void;
  onViewTask: (task: MaintenanceTask) => void;
  onDeleteTask: (task: MaintenanceTask) => void;
  isAdmin: boolean;
  tasksPerPage?: number;
}

export function CompletedTasksSection({
  completedTasks,
  vendorMap,
  isCollapsed,
  onToggleCollapse,
  currentPage,
  onPageChange,
  isLoadingTasks,
  onEditTask,
  onViewTask,
  onDeleteTask,
  isAdmin,
  tasksPerPage = 5,
}: CompletedTasksSectionProps) {
  // Paginated completed tasks (computed only when page changes)
  const paginatedCompletedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return completedTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [completedTasks, currentPage, tasksPerPage]);

  // Total pages for completed tasks
  const totalPages = Math.ceil(completedTasks.length / tasksPerPage);

  return (
    <Card className="shadow-sm border-0 bg-gradient-to-br from-card via-card to-card/80">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CardHeader className="pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Recently Completed
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {completedTasks.length} total completed tasks
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="group-hover:bg-muted/50">
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {isLoadingTasks ? (
              <MaintenanceTaskSkeleton count={tasksPerPage} />
            ) : completedTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No completed tasks
                </h3>
                <p className="text-sm text-muted-foreground">Completed tasks will appear here</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedCompletedTasks.map(task => (
                    <CompletedTaskCard
                      key={task.id}
                      task={task}
                      vendor={task.vendorId ? vendorMap[task.vendorId] : undefined}
                      onEdit={() => (isAdmin ? onEditTask(task) : onViewTask(task))}
                      onDelete={() => onDeleteTask(task)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <SimplePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={onPageChange}
                      isLoading={isLoadingTasks}
                      aria-label="Completed tasks pagination"
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
