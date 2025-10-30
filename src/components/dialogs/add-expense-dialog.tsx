'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import Image from 'next/image';

import { uploadImage } from '@/lib/storage';
import type { Category, Expense, User } from '@/lib/types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';

// Updated import path

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Please select a category'),
  paid: z.boolean().default(false),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface AddExpenseDialogProps {
  children: React.ReactNode;
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  currentUser: User;
  isLoadingApartments?: boolean;
}

export function AddExpenseDialog({
  children,
  categories,
  onAddExpense,
  currentUser,
  isLoadingApartments = false,
}: AddExpenseDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);
  const [fileError, setFileError] = React.useState('');
  const { toast } = useToast();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      categoryId: '',
      paid: false,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError('');
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        newErrors.push(`File "${file.name}" is not a supported type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newErrors.push(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (newErrors.length > 0) {
      setFileError(newErrors.join('\n'));
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs for display
    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setUploadedUrls(prev => [...prev, ...previewUrls]);
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true);
    setFileError('');
    try {
      if (!currentUser.apartment) {
        toast({
          title: 'Error',
          description: 'You must belong to an apartment to add an expense.',
        });
        return;
      }

      // Upload receipt files to Firebase Storage
      const uploadPromises = selectedFiles.map((file, index) => {
        const path = `receipts/${Date.now()}_${index}_${file.name}`;
        return uploadImage(file, path);
      });

      let receiptUrls: string[] = [];
      if (uploadPromises.length > 0) {
        receiptUrls = await Promise.all(uploadPromises);
      }

      const expenseData: Omit<Expense, 'id' | 'date'> = {
        description: data.description,
        amount: data.amount,
        paidByApartment: currentUser.apartment,
        categoryId: data.categoryId,
        receipt: receiptUrls.length > 0 ? receiptUrls[0] : undefined, // For backward compatibility, store first receipt URL
        owedByApartments: [],
        perApartmentShare: 0,
        paid: data.paid,
      };

      await onAddExpense(expenseData);

      // Clean up preview URLs
      uploadedUrls.forEach(url => URL.revokeObjectURL(url));

      toast({
        title: 'Expense Added!',
        description: `"${data.description}" for $${data.amount} has been logged.`,
      });
      setOpen(false);
      form.reset();
      setSelectedFiles([]);
      setUploadedUrls([]);
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Failed to upload receipt');
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your receipt.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">Add New Expense</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new shared expense. It will be automatically split among all apartment members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Monthly electricity bill"
                      {...field}
                      className="h-12 text-base touch-manipulation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="120.50"
                      {...field}
                      className="h-12 text-base touch-manipulation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base touch-manipulation">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id} className="py-3">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 touch-manipulation">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-5 w-5 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">Mark as Paid</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Receipt (Optional){' '}
                  <span className="text-xs text-muted-foreground">
                    (Max {MAX_FILE_SIZE_MB}MB per file, .jpg, .jpeg, .png, .webp, .pdf)
                  </span>
                </label>
                <Input
                  type="file"
                  accept={ACCEPTED_FILE_TYPES.join(',')}
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  className="h-12 text-base touch-manipulation"
                />
              </div>
              {uploadedUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedUrls.map((fileUrl, i) =>
                    fileUrl.includes('.pdf') || selectedFiles[i]?.type === 'application/pdf' ? (
                      <a
                        key={i}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors touch-manipulation"
                      >
                        PDF {i + 1}
                      </a>
                    ) : (
                      <Image
                        key={i}
                        src={fileUrl}
                        alt="Receipt preview"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )
                  )}
                </div>
              )}
              {fileError && (
                <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  {fileError}
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || isLoadingApartments}
                className="w-full h-12 text-base font-medium touch-manipulation"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Adding...
                  </span>
                ) : isLoadingApartments ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Loading apartments...
                  </span>
                ) : (
                  'Add Expense'
                )}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  // Clean up preview URLs
                  uploadedUrls.forEach(url => URL.revokeObjectURL(url));
                  setSelectedFiles([]);
                  setUploadedUrls([]);
                  setFileError('');
                  form.reset();
                  setOpen(false);
                }}
                disabled={loading}
                className="w-full h-12 text-base font-medium touch-manipulation"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
