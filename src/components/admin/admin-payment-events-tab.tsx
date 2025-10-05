import { PlusCircle } from 'lucide-react';

import React, { useState } from 'react';

import type { Category, Payment, User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';

import { PaymentEventHistory } from '../payment-events/payment-event-history';
import { usePaymentEvents } from './use-payment-events';

interface AdminPaymentEventsTabProps {
  payments: Payment[];
  users: User[];
  categories: Category[]; // Added categories prop
}

export function AdminPaymentEventsTab({ payments, users, categories }: AdminPaymentEventsTabProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const { paymentEventsHistoryData, handleLoadMoreMonths } = usePaymentEvents(payments);

  return (
    <div className="space-y-4">
      {/* Payment Events Overview Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Payment Events Management</CardTitle>
              <CardDescription>
                Monitor and manage monthly payment events for maintenance fees.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  setGenerationMessage('Generating payment events...');
                  try {
                    // Using the generate endpoint which will check for duplicates on the backend
                    // Using absolute URL to ensure request goes to the same origin as the frontend
                    const response = await fetch(
                      `${window.location.origin}/api/payment-events/generate`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        // Ensure credentials (HttpOnly session cookie) are included
                        credentials: 'include',
                        body: JSON.stringify({
                          monthYear: new Date().toISOString().slice(0, 7),
                        }),
                      }
                    );
                    const result = await response.json();

                    if (result.success) {
                      setGenerationMessage('Finalizing...');
                      // Check if payment events already existed
                      if (result.hasExistingEvents) {
                        // Payment events already existed - no new events created
                        const duplicateMessage = `Payment events for ${result.monthYear} already exist. No new events were generated.`;
                        toast({
                          title: 'Payment Events Already Exist',
                          description: duplicateMessage,
                          variant: 'destructive',
                        });
                      } else {
                        toast({
                          title: 'Payment Events Generated',
                          description: `Successfully generated ${result.eventsCreated} payment events for ${result.monthYear}`,
                        });
                      }
                    } else {
                      setGenerationMessage('Failed to generate.');
                      const errorMessage = result.error || 'Failed to generate payment events';
                      toast({
                        title: 'Generation Failed',
                        description: errorMessage,
                        variant: 'destructive',
                      });
                    }
                  } catch (error) {
                    setGenerationMessage('Error occurred.');
                    const errorMessage = 'Failed to generate payment events';
                    toast({
                      title: 'Error',
                      description: errorMessage,
                      variant: 'destructive',
                    });
                    console.error('Error generating payment events:', error);
                  } finally {
                    // Slight delay so user sees completion state
                    setTimeout(() => {
                      setGenerating(false);
                      setGenerationMessage(null);
                    }, 600);
                  }
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {generating ? 'Generating...' : 'Generate Payment Events'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {/** Loading dialog for generation */}
        <Dialog
          open={generating}
          onOpenChange={open => {
            // Only allow closing the dialog if we're not in the middle of generation
            if (!generating && !open) {
              setGenerating(false);
              setGenerationMessage(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generating Monthly Payment Events</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 py-2">
              <Spinner className="w-6 h-6 text-primary" />
              <p className="text-sm text-muted-foreground">
                {generationMessage || 'Processing...'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This may take a few seconds. Please do not close the window.
            </p>
          </DialogContent>
        </Dialog>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Current Month</h4>
              <p className="text-2xl font-bold text-blue-600">
                {new Date().toISOString().slice(0, 7)}
              </p>
              <p className="text-sm text-blue-700">Active payment events</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900">Configured Categories</h4>
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(cat => cat.isPaymentEvent && cat.autoGenerate).length}
              </p>
              <p className="text-sm text-green-700">Auto-generating payment events</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900">Total Monthly Amount</h4>
              <p className="text-2xl font-bold text-orange-600">
                ₹
                {categories
                  .filter(cat => cat.isPaymentEvent && cat.autoGenerate && cat.monthlyAmount)
                  .reduce((sum, cat) => sum + (cat.monthlyAmount || 0), 0)}
              </p>
              <p className="text-sm text-orange-700">Per apartment per month</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <PaymentEventHistory
        currentUser={{
          id: users.length > 0 ? users[0].id : 'admin',
          apartment: users.length > 0 ? users[0].apartment : '',
          role: 'admin',
        }}
        users={users}
        historyData={paymentEventsHistoryData}
        // Loading state: treat as loaded immediately since derived locally; could add flag if payments still loading upstream
        loading={false}
        error={null}
        onLoadMore={handleLoadMoreMonths}
        loadingMore={false}
      />
    </div>
  );
}
