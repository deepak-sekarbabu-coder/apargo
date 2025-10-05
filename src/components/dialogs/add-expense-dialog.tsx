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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Add a new shared expense. It will be automatically split among all apartment members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly electricity bill" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="120.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as Paid</FormLabel>
                  </div>
                </FormItem>
              )}
            />
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
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadedUrls.map((fileUrl, i) =>
                  fileUrl.includes('.pdf') || selectedFiles[i]?.type === 'application/pdf' ? (
                    <a
                      key={i}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline"
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
              {fileError && <div className="text-red-500 text-sm mt-1">{fileError}</div>}
            </div>
            <DialogFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={loading || isLoadingApartments} className="w-full">
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
                variant="ghost"
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
                className="w-full"
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
