'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import { getLogger } from '@/lib/core/logger';
import { MaintenanceTask, Vendor } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';

const logger = getLogger('Component');

const MAINTENANCE_CATEGORIES = [
  'elevator',
  'water_tank',
  'generator',
  'common_area',
  'other',
] as const;

const RECURRENCE_OPTIONS = ['none', 'monthly', 'quarterly', 'semi_annual', 'annual'] as const;

const STATUS_OPTIONS = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'overdue',
  'skipped',
] as const;

const taskSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters long').trim(),
    description: z.string().max(500, 'Description must be at most 500 characters long').optional(),
    category: z.enum(MAINTENANCE_CATEGORIES),
    vendorId: z
      .string()
      .optional()
      .nullable()
      .transform(val => val || undefined),
    scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'Scheduled date must be a valid date',
    }),
    dueDate: z.string().optional(),
    status: z.enum(STATUS_OPTIONS),
    costEstimate: z.coerce.number().min(0, 'Cost estimate must be a positive number').optional(),
    actualCost: z.coerce.number().min(0, 'Actual cost must be a positive number').optional(),
    notes: z.string().max(500, 'Notes must be at most 500 characters long').optional(),
    recurrence: z.enum(RECURRENCE_OPTIONS),
  })
  .refine(
    data => {
      if (data.dueDate && data.scheduledDate) {
        return new Date(data.dueDate) > new Date(data.scheduledDate);
      }
      return true;
    },
    {
      message: 'Due date must be after scheduled date',
      path: ['dueDate'],
    }
  );

type TaskFormValues = z.infer<typeof taskSchema>;

interface MaintenanceTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => Promise<void>;
  vendors: Vendor[];
  editingTask?: MaintenanceTask | null;
  isViewOnly?: boolean;
}

export function MaintenanceTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  vendors,
  editingTask,
  isViewOnly = false,
}: MaintenanceTaskDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      vendorId: undefined,
      scheduledDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      dueDate: '',
      status: 'scheduled',
      costEstimate: 0,
      actualCost: 0,
      notes: '',
      recurrence: 'none',
    },
  });

  // Update form when editing task changes
  React.useEffect(() => {
    if (editingTask) {
      form.reset({
        title: editingTask.title,
        description: editingTask.description || '',
        category: editingTask.category as (typeof MAINTENANCE_CATEGORIES)[number],
        vendorId: editingTask.vendorId || undefined,
        scheduledDate: editingTask.scheduledDate.split('T')[0],
        dueDate: editingTask.dueDate?.split('T')[0] || '',
        status: editingTask.status,
        costEstimate: editingTask.costEstimate || 0,
        actualCost: editingTask.actualCost || 0,
        notes: editingTask.notes || '',
        recurrence: (editingTask.recurrence || 'none') as (typeof RECURRENCE_OPTIONS)[number],
      });
    } else {
      form.reset({
        title: '',
        description: '',
        category: 'other',
        vendorId: undefined,
        scheduledDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'scheduled',
        costEstimate: 0,
        actualCost: 0,
        notes: '',
        recurrence: 'none',
      });
    }
  }, [editingTask, form]);

  const handleSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      const taskData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        title: data.title,
        category: data.category,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        status: data.status,
        recurrence: data.recurrence,
      };

      // Add optional fields only if they have values
      if (data.description && data.description.trim()) {
        taskData.description = data.description.trim();
      }
      if (data.vendorId) {
        taskData.vendorId = data.vendorId;
      }
      if (data.dueDate) {
        taskData.dueDate = new Date(data.dueDate).toISOString();
      }
      if (data.costEstimate && data.costEstimate > 0) {
        taskData.costEstimate = data.costEstimate;
      }
      if (data.actualCost && data.actualCost > 0) {
        taskData.actualCost = data.actualCost;
      }
      if (data.notes && data.notes.trim()) {
        taskData.notes = data.notes.trim();
      }
      if (data.status === 'completed') {
        taskData.completedDate = new Date().toISOString();
      }

      await onSubmit(taskData);

      toast({
        title: editingTask ? 'Task Updated' : 'Task Created',
        description: `Task "${data.title}" has been ${editingTask ? 'updated' : 'created'} successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingTask ? 'update' : 'create'} task. Please try again.`,
        variant: 'destructive',
      });
      logger.error('Error submitting task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isViewOnly ? 'View Task Details' : editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {isViewOnly
              ? 'Task details are shown below. Only administrators can edit completed tasks.'
              : editingTask
                ? 'Update the maintenance task details below.'
                : 'Add a new maintenance task to track work that needs to be done.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Replace elevator motor"
                      {...field}
                      disabled={isViewOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the task..."
                      className="resize-none"
                      {...field}
                      disabled={isViewOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isViewOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="elevator">Elevator</SelectItem>
                        <SelectItem value="water_tank">Water Tank</SelectItem>
                        <SelectItem value="generator">Generator</SelectItem>
                        <SelectItem value="common_area">Common Area</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isViewOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Vendor (Optional)</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(value || undefined)}
                    value={field.value || ''}
                    disabled={isViewOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No vendor assigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors
                        .filter(v => v.isActive)
                        .map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Estimate (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        {...field}
                        disabled={isViewOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Cost (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        {...field}
                        disabled={isViewOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isViewOnly}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (One-time)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or instructions..."
                      className="resize-none"
                      {...field}
                      disabled={isViewOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col gap-3">
              {!isViewOnly && (
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Spinner className="mr-2 h-4 w-4" />}
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full"
              >
                {isViewOnly ? 'Close' : 'Cancel'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
