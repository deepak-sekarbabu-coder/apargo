'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { User } from '@/lib/types';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

const onboardingSchema = z.object({
  apartment: z.string().min(1, 'Please select an apartment.'),
  propertyRole: z.enum(['owner', 'tenant'], {
    required_error: 'You need to select a property role.',
  }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface SelectApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave: (data: { apartment: string; propertyRole: 'owner' | 'tenant' }) => void;
}

export function SelectApartmentDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: SelectApartmentDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [apartments, setApartments] = React.useState<string[]>([]);
  const { toast } = useToast();
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  React.useEffect(() => {
    import('@/lib/firestore/apartments').then(({ getApartments }) => {
      getApartments().then(apts => setApartments(apts.map(a => a.id)));
    });
  }, []);

  const onSubmit = (data: OnboardingFormValues) => {
    setIsSaving(true);
    onSave(data);
    toast({
      title: 'Profile Setup Complete!',
      description: `Welcome to apartment ${data.apartment}, ${user.name}!`,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome, {user.name}!</DialogTitle>
          <DialogDescription>
            Please complete your profile setup. This is a one-time process.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment Number</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your apartment" />
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
            <FormField
              control={form.control}
              name="propertyRole"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What is your property role?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="owner" />
                        </FormControl>
                        <FormLabel className="font-normal">Owner</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="tenant" />
                        </FormControl>
                        <FormLabel className="font-normal">Tenant</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
