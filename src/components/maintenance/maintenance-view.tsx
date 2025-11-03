'use client';

import { useAuth } from '@/context/auth-context';
import { MaintenanceProvider, useMaintenance } from '@/context/maintenance-context';
import { LayoutDashboard, Store } from 'lucide-react';

import React, { useCallback, useEffect, useState } from 'react';

import { deleteVendor } from '@/lib/firestore/vendors';
import { MaintenanceTask, Vendor } from '@/lib/types';

import { MaintenanceTaskDialog } from '@/components/dialogs/maintenance-task-dialog';
import { VendorDialog } from '@/components/dialogs/vendor-dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { toast } from '@/hooks/use-toast';

// Removed useToast import (toast not used)

import { MaintenanceDashboard } from './maintenance-dashboard';
import { VendorList } from './vendor-list';

function MaintenanceViewContent() {
  const { user } = useAuth();
  // Removed unused "tasks" variable (handlers referencing it were unused) to satisfy lint
  const { vendors, loading, createTask, editTask, createVendor, editVendor } = useMaintenance();

  const [activeTab, setActiveTab] = useState('dashboard');
  // Restore previously active tab (persist across re-mounts / navigations)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('maintenance.activeTab');
      if (saved === 'dashboard' || saved === 'vendors') {
        setActiveTab(saved);
      }
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }, []);

  const updateActiveTab = useCallback((val: string) => {
    setActiveTab(val);
    try {
      sessionStorage.setItem('maintenance.activeTab', val);
    } catch {
      // ignore
    }
  }, []);
  const [highlightedVendorId, setHighlightedVendorId] = useState<string | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsViewOnlyMode(false);
    setShowTaskDialog(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsViewOnlyMode(false);
    setShowTaskDialog(true);
  };

  const handleViewTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsViewOnlyMode(true);
    setShowTaskDialog(true);
  };

  // Removed unused handlers (handleDeleteTask, handleUpdateStatus) that weren't passed to children

  const handleTaskSubmit = async (
    taskData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (editingTask) {
      await editTask(editingTask.id, taskData);
    } else {
      await createTask({
        ...taskData,
        createdBy: user.id,
      });
    }
  };

  const handleCreateVendor = () => {
    setEditingVendor(null);
    updateActiveTab('vendors'); // Ensure vendors tab is active
    setShowVendorDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    updateActiveTab('vendors'); // Ensure vendors tab is active
    setShowVendorDialog(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!isAdmin) return; // Authorization check
    try {
      await deleteVendor(vendor.id);
      // Visual feedback handled by VendorList component toast
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVendorSubmit = async (
    vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>
  ) => {
    // Always keep user on Vendors tab for a seamless experience
    updateActiveTab('vendors');
    if (editingVendor) {
      await editVendor(editingVendor.id, vendorData);
      setHighlightedVendorId(editingVendor.id);
    } else {
      const created = await createVendor(vendorData);
      setHighlightedVendorId(created.id);
    }
    // Note: dialog close & toast are handled inside VendorDialog
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={updateActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="text-sm flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="text-sm flex items-center gap-1.5">
            <Store className="h-4 w-4" />
            <span>Vendors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <MaintenanceDashboard
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            onViewTask={handleViewTask}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4 mt-6">
          <VendorList
            vendors={vendors}
            onAdd={handleCreateVendor}
            onEdit={handleEditVendor}
            onDelete={handleDeleteVendor}
            highlightVendorId={highlightedVendorId}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <MaintenanceTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        onSubmit={handleTaskSubmit}
        vendors={vendors}
        editingTask={editingTask}
        isViewOnly={isViewOnlyMode}
      />

      {/* Vendor Dialog */}
      <VendorDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        onSubmit={handleVendorSubmit}
        editingVendor={editingVendor}
      />
    </div>
  );
}

export function MaintenanceView() {
  const currentYear = new Date().getFullYear();

  return (
    <MaintenanceProvider year={currentYear}>
      <MaintenanceViewContent />
    </MaintenanceProvider>
  );
}

export default MaintenanceView;
