'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { User } from '@/lib/core/types';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const userSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters long').trim(),
  email: z
    .string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters long')
    .trim(),
  phone: z
    .string()
    .optional()
    .transform(val => val?.replace(/[\s\-]/g, ''))
    .refine(
      val => !val || /^(\+91)?[6-9]\d{9}$/.test(val),
      'Please enter a valid 10-digit Indian mobile number, optionally with a +91 prefix'
    ),
  // Include 'incharge' because the `User` type allows it in the codebase
  // (this keeps the form schema aligned with `src/lib/types.ts`).
  role: z.enum(['user', 'admin', 'incharge']),
  propertyRole: z.enum(['tenant', 'owner']).optional(),
  apartment: z.string().optional(),
  avatar: z
    .any()
    .optional()
    .refine(
      files => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditUserDialogProps {
  children: React.ReactNode;
  user: User;
  onUpdateUser: (user: User) => void;
}

export function EditUserDialog({ children, user, onUpdateUser }: EditUserDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [apartments, setApartments] = React.useState<string[]>([]);
  const { toast } = useToast();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      propertyRole: user.propertyRole || 'tenant',
      apartment: user.apartment || '',
      avatar: undefined,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        propertyRole: user.propertyRole || 'tenant',
        apartment: user.apartment || '',
      });
    }
  }, [user, form]);

  React.useEffect(() => {
    import('@/lib/firestore/apartments').then(({ getApartments }) => {
      getApartments().then(apts => setApartments(apts.map(a => a.id)));
    });
  }, []);

  const fileRef = form.register('avatar');

  const onSubmit = async (data: UserFormValues) => {
    setIsSaving(true);
    let avatarDataUrl: string | undefined = user.avatar;
    if (data.avatar && data.avatar.length > 0) {
      const file = data.avatar[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      avatarDataUrl = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result as string);
      });
    }

    const updatedUser: User = {
      ...user,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      propertyRole: data.propertyRole,
      apartment: data.apartment || '',
      avatar: avatarDataUrl,
    };
    onUpdateUser(updatedUser);
    toast({
      title: 'User Updated',
      description: `Information for ${data.name} has been updated.`,
    });
    setIsSaving(false);
    setOpen(false);
  };

  const handleResetPassword = () => {
    // In a real app, this would trigger a password reset flow.
    // Here, we just notify the admin what the password is.
    toast({
      title: 'Password Reset',
      description: `Password for ${user.name} has been reset to "password".`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Responsive adjustments: use max-w responsive, clamp height with safe viewport units, ensure internal scroll not body scroll */}
      <DialogContent className="w-full max-w-[95vw] xs:max-w-md sm:max-w-[560px] md:max-w-[600px] mx-2 sm:mx-auto max-h-[90svh] md:max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
            </Avatar>
            <DialogTitle>Edit User</DialogTitle>
          </div>
          <DialogDescription>Update the details for this user account.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-w-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input className="w-full min-w-0" placeholder="e.g., John Doe" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full min-w-0"
                      type="email"
                      placeholder="e.g., john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full min-w-0"
                      placeholder="e.g., +91 98765 43210"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <div className="relative w-full min-w-0 overflow-hidden">
                      <Input
                        className="w-full min-w-0 truncate file:mr-2 file:py-1 file:px-2 file:text-xs file:rounded-md"
                        type="file"
                        accept="image/*"
                        {...fileRef}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Responsive grid: 1 col on very small, 2 on small/medium, 3 on large+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0 truncate">
                          <SelectValue placeholder="Select system role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0 truncate">
                          <SelectValue placeholder="Select property role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apartment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0 truncate">
                          <SelectValue placeholder="Select an apartment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {apartments.map(apt => (
                          <SelectItem key={apt} value={apt}>
                            {apt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
              {/* Left group (Reset Password) stays left on desktop, last on mobile */}
              <Button
                type="button"
                onClick={handleResetPassword}
                className="w-full sm:w-auto bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              {/* Right group: Save first, Cancel second on mobile (normal order on desktop) */}
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto order-1">
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="w-4 h-4" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-gray-400 order-2"
                >
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
