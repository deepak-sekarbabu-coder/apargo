'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import { getApartments } from '@/lib/firestore/apartments';
import type { User } from '@/lib/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

import { useDeviceInfo } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Updated import path

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UserProfileDialogProps {
  children: React.ReactNode;
  user: User;
  onUpdateUser: (user: User) => void;
}

export function UserProfileDialog({ children, user, onUpdateUser }: UserProfileDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [apartments, setApartments] = React.useState<string[]>([]);
  const { toast } = useToast();
  const { isMobile } = useDeviceInfo();
  const profileSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email(),
        phone: z
          .string()
          .optional()
          .refine(
            val => !val || /^(\+91[\s\-]?)?[6-9]\d{9}$/.test(val.replace(/[\s\-]/g, '')),
            'Please enter a valid Indian phone number (e.g., +91 98765 43210)'
          ),
        avatar: z
          .any()
          .optional()
          .refine(
            files => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
            `Max file size is 5MB.`
          )
          .refine(
            files =>
              !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
            'Only .jpg, .jpeg, .png and .webp formats are supported.'
          ),
        apartment: z.enum(
          (apartments.length > 0 ? apartments : ['placeholder']) as [string, ...string[]],
          {
            required_error: 'Apartment is required',
          }
        ),
        propertyRole: z.enum(['tenant', 'owner'], { required_error: 'Role is required' }),
      }),
    [apartments]
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: undefined,
      apartment: user.apartment || '',
      propertyRole: user.propertyRole || 'tenant',
    },
  });

  React.useEffect(() => {
    getApartments().then(apts => setApartments(apts.map(a => a.id)));
  }, []);

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        apartment:
          apartments.length > 0 && apartments.includes(user.apartment)
            ? user.apartment
            : apartments.length > 0
              ? apartments[0]
              : '',
        propertyRole: user.propertyRole || 'tenant',
      });
    }
  }, [user, form, apartments]);

  const fileRef = form.register('avatar');

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
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

    const updatedUser = {
      ...user,
      name: data.name,
      phone: data.phone,
      avatar: avatarDataUrl,
      apartment: data.apartment,
      propertyRole: data.propertyRole,
    };
    onUpdateUser(updatedUser);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been successfully updated.',
    });
    setIsSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-[560px] mx-2 sm:mx-auto overflow-auto max-h-[90vh] sm:max-h-[85vh]"
        mobileFullScreen={false}
        enhancedTouch={true}
      >
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and profile information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <Avatar className={`${isMobile ? 'h-16 w-16' : 'h-24 w-24'}`}>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-sm sm:text-base">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={`${isMobile ? 'space-y-5' : 'space-y-4'} min-w-0`}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
                      placeholder="Your full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-5' : 'md:grid-cols-2 gap-4'}`}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                        disabled
                      />
                    </FormControl>
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
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger
                          className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
                        >
                          <SelectValue placeholder="Select Apartment" />
                        </SelectTrigger>
                        <SelectContent>
                          {apartments.map(apt => (
                            <SelectItem key={apt} value={apt}>
                              {apt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
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
                  <FormLabel>Change Profile Picture</FormLabel>
                  <FormControl>
                    <Input
                      className={`w-full min-w-0 ${isMobile ? 'h-11 text-base' : ''}`}
                      type="file"
                      accept="image/*"
                      {...fileRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-6 flex-wrap'}`}>
                      <label className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                        <input
                          type="radio"
                          value="tenant"
                          checked={field.value === 'tenant'}
                          onChange={() => field.onChange('tenant')}
                          className={`${isMobile ? 'scale-110' : ''}`}
                        />
                        Tenant
                      </label>
                      <label className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                        <input
                          type="radio"
                          value="owner"
                          checked={field.value === 'owner'}
                          onChange={() => field.onChange('owner')}
                          className={`${isMobile ? 'scale-110' : ''}`}
                        />
                        Owner
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter
              className={`${isMobile ? 'flex flex-col gap-3 pt-2' : 'flex justify-end gap-3'}`}
              stackOnMobile={true}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  if (!isSaving) {
                    form.reset();
                    setOpen(false);
                  }
                }}
                className={`${isMobile ? 'w-full h-11 text-base order-2' : ''}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className={`${isMobile ? 'w-full h-11 text-base order-1' : ''}`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    Saving...
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
