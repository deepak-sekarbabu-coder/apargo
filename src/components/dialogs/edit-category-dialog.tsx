'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { Category } from '@/lib/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Icons } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';

// Updated import path

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'An icon is required'),
  noSplit: z.boolean().optional(),
  // Payment Event Configuration
  isPaymentEvent: z.boolean().optional(),
  monthlyAmount: z.number().min(0, 'Monthly amount must be positive').optional(),
  dayOfMonth: z
    .number()
    .min(1, 'Day must be between 1-28')
    .max(28, 'Day must be between 1-28')
    .optional(),
  autoGenerate: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  children: React.ReactNode;
  category: Category;
  onUpdateCategory: (category: Category) => void;
}

export function EditCategoryDialog({
  children,
  category,
  onUpdateCategory,
}: EditCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      icon: category.icon,
      noSplit: category.noSplit || false,
      isPaymentEvent: category.isPaymentEvent || false,
      monthlyAmount: category.monthlyAmount,
      dayOfMonth: category.dayOfMonth || 1,
      autoGenerate: category.autoGenerate || false,
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon,
        noSplit: category.noSplit || false,
        isPaymentEvent: category.isPaymentEvent || false,
        monthlyAmount: category.monthlyAmount,
        dayOfMonth: category.dayOfMonth || 1,
        autoGenerate: category.autoGenerate || false,
      });
    }
  }, [category, form]);

  const onSubmit = (data: CategoryFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      const updatedCategory = {
        ...category,
        name: data.name,
        icon: data.icon,
        noSplit: data.noSplit,
        isPaymentEvent: data.isPaymentEvent,
        monthlyAmount: data.monthlyAmount,
        dayOfMonth: data.dayOfMonth,
        autoGenerate: data.autoGenerate,
      };
      onUpdateCategory(updatedCategory);
      toast({
        title: 'Category Updated',
        description: `The category has been updated.`,
      });
      setIsSaving(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CategoryIcon name={category.icon as keyof typeof Icons} className="h-10 w-10" />
            <DialogTitle>Edit Category</DialogTitle>
          </div>
          <DialogDescription>Update the details for this category.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={() => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Input placeholder="Icon name" value={category.icon} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noSplit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>No Split Expense</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Expenses in this category won&apos;t be split among apartments and will only
                      be paid by the person who added them.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Payment Event Configuration Section */}
            <FormField
              control={form.control}
              name="isPaymentEvent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Payment Event Generator</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic generation of monthly payment events (e.g., maintenance fees)
                      for all apartments.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Payment Event Configuration Fields - Only show when isPaymentEvent is enabled */}
            {form.watch('isPaymentEvent') && (
              <div className="space-y-4 p-4 rounded-md border bg-muted/50">
                <h4 className="text-sm font-medium">Payment Event Configuration</h4>

                <FormField
                  control={form.control}
                  name="monthlyAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 2500"
                          {...field}
                          onChange={e =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        The monthly fee amount that will be charged to each apartment.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generation Day of Month</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="28"
                          placeholder="1"
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                          value={field.value || 1}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Day of the month (1-28) when payment events will be automatically generated.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoGenerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Auto-Generation</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Automatically generate payment events each month on the specified day.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
