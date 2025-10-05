import { format } from 'date-fns';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Play,
  Settings,
  SkipForward,
  Timer,
  User,
  XCircle,
} from 'lucide-react';

import React from 'react';

import type { MaintenanceTask, Vendor } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

import { getTaskProgress } from './use-maintenance-data';

// Enhanced status configurations with icons and improved colors
const statusConfig: Record<
  MaintenanceTask['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  scheduled: {
    label: 'Scheduled',
    variant: 'secondary',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Calendar,
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: Timer,
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50',
    textColor: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'secondary',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: XCircle,
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
    textColor: 'text-red-700 dark:text-red-300',
    icon: Clock,
  },
  skipped: {
    label: 'Skipped',
    variant: 'outline',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: SkipForward,
  },
};

// Enhanced status badge component
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

// Enhanced Task Card Component for Upcoming/Active Tasks
interface TaskCardProps {
  task: MaintenanceTask;
  vendor?: Vendor;
  onEdit: () => void;
  onUpdateStatus: (task: MaintenanceTask, status: MaintenanceTask['status']) => void;
  isAdmin: boolean;
  showProgress?: boolean;
  progress?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  vendor,
  onEdit,
  onUpdateStatus,
  isAdmin,
  showProgress = false,
  progress = 0,
}) => {
  return (
    <div className="group relative p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 hover:border-border/60">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={onEdit}
          className="text-left flex-1 hover:text-primary transition-colors"
          title={isAdmin ? 'Edit task' : 'View task details'}
        >
          <h4 className="font-semibold text-base leading-tight text-card-foreground group-hover:text-primary transition-colors">
            {task.title}
          </h4>
        </button>
        <StatusBadge status={task.status} />
      </div>

      {/* Progress bar for in-progress tasks */}
      {showProgress && task.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Task Details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground/60" />
          <span className="font-medium">{format(new Date(task.scheduledDate), 'MMM d, yyyy')}</span>
        </div>

        {vendor && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground/60" />
            <span>{vendor.name}</span>
          </div>
        )}

        {task.costEstimate && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground/60" />
            <span>Est. ₹{task.costEstimate.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!(
        task.status === 'completed' ||
        task.status === 'cancelled' ||
        task.status === 'skipped'
      ) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.status !== 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(task, 'in_progress')}
              className="inline-flex items-center gap-1 text-xs"
            >
              <Play className="w-3 h-3" />
              Start
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(task, 'completed')}
            className="inline-flex items-center gap-1 text-xs"
          >
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </Button>
          {task.recurrence && task.recurrence !== 'none' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(task, 'skipped')}
              className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 hover:border-orange-300"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(task, 'cancelled')}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <XCircle className="w-3 h-3" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

interface UpcomingTasksSectionProps {
  upcomingTasks: MaintenanceTask[];
  vendorMap: Record<string, Vendor>;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onEditTask: (task: MaintenanceTask) => void;
  onViewTask: (task: MaintenanceTask) => void;
  onUpdateStatus: (task: MaintenanceTask, status: MaintenanceTask['status']) => void;
  isAdmin: boolean;
}

export function UpcomingTasksSection({
  upcomingTasks,
  vendorMap,
  isCollapsed,
  onToggleCollapse,
  onEditTask,
  onViewTask,
  onUpdateStatus,
  isAdmin,
}: UpcomingTasksSectionProps) {
  return (
    <Card className="shadow-sm border-0 bg-gradient-to-br from-card via-card to-card/80">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CardHeader className="pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Upcoming & Active
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {upcomingTasks.length} tasks requiring attention
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
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No upcoming tasks
                </h3>
                <p className="text-sm text-muted-foreground">
                  All maintenance tasks are up to date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    vendor={task.vendorId ? vendorMap[task.vendorId] : undefined}
                    onEdit={() => (isAdmin ? onEditTask(task) : onViewTask(task))}
                    onUpdateStatus={onUpdateStatus}
                    isAdmin={isAdmin}
                    showProgress={task.status === 'in_progress'}
                    progress={getTaskProgress(task)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
