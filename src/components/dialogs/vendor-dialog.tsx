'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import { Vendor } from '@/lib/core/types';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const SERVICE_TYPES = [
  'elevator',
  'plumbing',
  'electrical',
  'hvac',
  'cleaning',
  'security',
  'landscaping',
  'general_maintenance',
  'other',
] as const;

const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  serviceType: z.enum(SERVICE_TYPES),
  phone: z
    .string()
    .optional()
    .refine(
      val => !val || /^(\+91[\s\-]?)?[6-9]\d{9}$/.test(val.replace(/[\s\-]/g, '')),
      'Please enter a valid Indian phone number (e.g., +91 98765 43210)'
    ),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  rating: z
    .union([z.string(), z.coerce.number()])
    .optional()
    .refine(
      val =>
        !val ||
        val === '' ||
        (typeof val === 'string' && val.trim() === '') ||
        (typeof val === 'number' && val >= 1 && val <= 5) ||
        (typeof val === 'string' &&
          !isNaN(parseFloat(val)) &&
          parseFloat(val) >= 1 &&
          parseFloat(val) <= 5),
      'Rating must be between 1 and 5'
    ),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>
  ) => Promise<void>;
  editingVendor?: Vendor | null;
}

export function VendorDialog({ open, onOpenChange, onSubmit, editingVendor }: VendorDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      serviceType: 'other',
      phone: '',
      email: '',
      address: '',
      rating: '',
      notes: '',
      isActive: true,
    },
  });

  // Update form when editing vendor changes
  React.useEffect(() => {
    if (editingVendor) {
      form.reset({
        name: editingVendor.name || '',
        serviceType: editingVendor.serviceType as (typeof SERVICE_TYPES)[number],
        phone: editingVendor.phone || '',
        email: editingVendor.email || '',
        address: editingVendor.address || '',
        rating: editingVendor.rating ? String(editingVendor.rating) : '',
        notes: editingVendor.notes || '',
        isActive: editingVendor.isActive,
      });
    } else {
      form.reset({
        name: '',
        serviceType: 'other',
        phone: '',
        email: '',
        address: '',
        rating: '',
        notes: '',
        isActive: true,
      });
    }
  }, [editingVendor, form]);

  const handleSubmit = async (data: VendorFormValues) => {
    setLoading(true);
    try {
      const vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'> = {
        name: data.name,
        serviceType: data.serviceType,
        isActive: data.isActive,
      };

      // Add optional fields only if they have values
      if (data.phone && data.phone.trim()) {
        vendorData.phone = data.phone.trim();
      }
      if (data.email && data.email.trim()) {
        vendorData.email = data.email.trim();
      }
      if (data.address && data.address.trim()) {
        vendorData.address = data.address.trim();
      }
      if (data.rating && typeof data.rating === 'string' && data.rating.trim()) {
        const ratingNum = parseFloat(data.rating);
        if (ratingNum > 0 && ratingNum <= 5) {
          vendorData.rating = ratingNum;
        }
      } else if (typeof data.rating === 'number' && data.rating > 0 && data.rating <= 5) {
        vendorData.rating = data.rating;
      }
      if (data.notes && data.notes.trim()) {
        vendorData.notes = data.notes.trim();
      }

      await onSubmit(vendorData);

      toast({
        title: editingVendor ? 'Vendor Updated' : 'Vendor Created',
        description: `Vendor "${data.name}" has been ${editingVendor ? 'updated' : 'created'} successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingVendor ? 'update' : 'create'} vendor. Please try again.`,
        variant: 'destructive',
      });
      console.error('Error submitting vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          <DialogDescription>
            {editingVendor
              ? 'Update the vendor information below.'
              : 'Add a new vendor to your maintenance network.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Elevator Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="elevator">Elevator</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="landscaping">Landscaping</SelectItem>
                      <SelectItem value="general_maintenance">General Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vendor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 123 ABC Colony, Mumbai, Maharashtra 400001"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5 stars, Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" min="1" max="5" step="0.1" {...field} />
                  </FormControl>
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
                      placeholder="Additional notes about this vendor..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Vendor</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this vendor as active and available for new tasks.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2 h-4 w-4" />}
                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
