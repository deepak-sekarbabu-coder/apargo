import { ChevronDown, ChevronUp, SkipForward } from 'lucide-react';

import React from 'react';

import type { MaintenanceTask, Vendor } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Reuse the CompletedTaskCard from the completed tasks section
import { CompletedTaskCard } from './completed-tasks-section';

interface SkippedTasksSectionProps {
  skippedTasks: MaintenanceTask[];
  vendorMap: Record<string, Vendor>;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onEditTask: (task: MaintenanceTask) => void;
  onViewTask: (task: MaintenanceTask) => void;
  onDeleteTask: (task: MaintenanceTask) => void;
  isAdmin: boolean;
  maxDisplayCount?: number;
}

export function SkippedTasksSection({
  skippedTasks,
  vendorMap,
  isCollapsed,
  onToggleCollapse,
  onEditTask,
  onViewTask,
  onDeleteTask,
  isAdmin,
  maxDisplayCount = 5,
}: SkippedTasksSectionProps) {
  if (skippedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between hover:bg-muted/30 -m-2 p-2 rounded-lg transition-colors group cursor-pointer">
              <div className="flex items-center space-x-3">
                <SkipForward className="h-6 w-6 text-orange-500" />
                <div>
                  <CardTitle className="text-lg text-foreground">Skipped Tasks</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {skippedTasks.length} total skipped tasks
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
            {skippedTasks.length === 0 ? (
              <div className="text-center py-12">
                <SkipForward className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No skipped tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skippedTasks.slice(0, maxDisplayCount).map(task => (
                  <CompletedTaskCard
                    key={task.id}
                    task={task}
                    vendor={task.vendorId ? vendorMap[task.vendorId] : undefined}
                    onEdit={() => (isAdmin ? onEditTask(task) : onViewTask(task))}
                    onDelete={() => onDeleteTask(task)}
                    isAdmin={isAdmin}
                  />
                ))}
                {skippedTasks.length > maxDisplayCount && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {maxDisplayCount} of {skippedTasks.length} skipped tasks
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
