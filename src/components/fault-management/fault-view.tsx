'use client';

import { useAuth } from '@/context/auth-context';
import { LayoutDashboard, Wrench } from 'lucide-react';

import React, { useCallback, useEffect, useState } from 'react';

import type { Fault, FaultSeverity, FaultStatus, User } from '@/lib/core/types';
import { deleteFault, getFaults, updateFault } from '@/lib/firestore/faults';
import { getUsers } from '@/lib/firestore/users';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useToast } from '@/hooks/use-toast';

import { FaultDashboard } from './fault-dashboard/fault-dashboard';
import { FaultManagement } from './management/fault-management';

export function FaultView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [faults, setFaults] = useState<Fault[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchFaults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both faults and users in parallel
      const [allFaults, allUsers] = await Promise.all([getFaults(), getUsers()]);

      // Transform legacy faults to new format if needed
      const transformedFaults = allFaults.map(fault => ({
        ...fault,
        // Set default values for new fields if they don't exist
        severity: fault.severity || ('warning' as FaultSeverity),
        status: fault.status || ((fault.fixed ? 'resolved' : 'open') as FaultStatus),
        priority: fault.priority || 3,
        resolvedAt: fault.resolvedAt || fault.fixedAt,
      }));

      setFaults(transformedFaults);
      setUsers(allUsers);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  const handleUpdateFault = async (id: string, updates: Partial<Fault>) => {
    try {
      await updateFault(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setFaults(prev =>
        prev.map(fault =>
          fault.id === id ? { ...fault, ...updates, updatedAt: new Date().toISOString() } : fault
        )
      );

      toast({
        title: 'Fault Updated',
        description: 'The fault has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating fault:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update fault. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFault = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only administrators can delete faults.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteFault(id);
      setFaults(prev => prev.filter(fault => fault.id !== id));

      toast({
        title: 'Fault Deleted',
        description: 'The fault has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting fault:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete fault. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkFixed = async (id: string) => {
    const updates = {
      fixed: true,
      status: 'resolved' as FaultStatus,
      fixedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    };

    await handleUpdateFault(id, updates);
  };

  const handleUpdateStatus = async (id: string, status: FaultStatus) => {
    const updates: Partial<Fault> = { status };

    if (status === 'resolved' || status === 'closed') {
      updates.fixed = true;
      updates.resolvedAt = new Date().toISOString();
      if (!faults.find(f => f.id === id)?.fixedAt) {
        updates.fixedAt = new Date().toISOString();
      }
    } else {
      updates.fixed = false;
      updates.resolvedAt = undefined;
    }

    await handleUpdateFault(id, updates);
  };

  const handleUpdateSeverity = async (id: string, severity: FaultSeverity) => {
    await handleUpdateFault(id, { severity });
  };

  const handleFaultReported = () => {
    // Refresh the fault list when a new fault is reported
    fetchFaults();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Faults</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="text-sm flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="text-sm flex items-center gap-1.5">
            <Wrench className="h-4 w-4" />
            <span>Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <FaultDashboard
            faults={faults}
            users={users}
            onUpdateStatus={handleUpdateStatus}
            onUpdateSeverity={handleUpdateSeverity}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="management" className="space-y-4 mt-6">
          <FaultManagement
            faults={faults}
            users={users}
            onUpdateFault={handleUpdateFault}
            onDeleteFault={handleDeleteFault}
            onMarkFixed={handleMarkFixed}
            onFaultReported={handleFaultReported}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
