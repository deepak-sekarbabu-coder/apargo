'use client';

import { useAuth } from '@/context/auth-context';

import React, { useState } from 'react';

import { MaintenanceTask, Vendor } from '@/lib/types';

import { MaintenanceTaskDialog } from '@/components/dialogs/maintenance-task-dialog';
import { VendorDialog } from '@/components/dialogs/vendor-dialog';

import { useVendors } from '@/hooks/use-maintenance-api';
import { useToast } from '@/hooks/use-toast';

import { MaintenanceDashboard } from './maintenance-dashboard';

/**
 * Enhanced Maintenance Dashboard Demo Component
 *
 * This component demonstrates the new state-managed maintenance dashboard
 * that uses client-side API calls instead of props for data management.
 *
 * Key Features:
 * - Self-managed state using custom hooks
 * - Optimistic UI updates
 * - Error handling and retry mechanisms
 * - No page reloads for CRUD operations
 * - Real-time loading states
 */
export function MaintenanceDashboardDemo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vendors } = useVendors(); // Get vendors for the task dialog

  // Dialog states for task and vendor management
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Handle task creation
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsViewOnlyMode(false);
    setShowTaskDialog(true);
  };

  // Handle task editing
  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsViewOnlyMode(false);
    setShowTaskDialog(true);
  };

  // Handle task viewing (read-only)
  const handleViewTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsViewOnlyMode(true);
    setShowTaskDialog(true);
  };

  // Handle task form submission
  const handleTaskSubmit = async (
    taskData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Close dialog
    setShowTaskDialog(false);
    setEditingTask(null);

    // Show success message
    toast({
      title: editingTask ? 'Task Updated' : 'Task Created',
      description: `Task "${taskData.title}" has been ${editingTask ? 'updated' : 'created'} successfully.`,
    });
  };

  // Handle vendor form submission
  const handleVendorSubmit = async (
    vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>
  ) => {
    // Close dialog
    setShowVendorDialog(false);
    setEditingVendor(null);

    // Show success message
    toast({
      title: editingVendor ? 'Vendor Updated' : 'Vendor Created',
      description: `Vendor "${vendorData.name}" has been ${editingVendor ? 'updated' : 'created'} successfully.`,
    });
  };

  return (
    <div className="w-full">
      {/* New State-Managed Maintenance Dashboard */}
      <MaintenanceDashboard
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onViewTask={handleViewTask}
        isAdmin={isAdmin}
      />

      {/* Task Dialog */}
      <MaintenanceTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        editingTask={editingTask}
        onSubmit={handleTaskSubmit}
        isViewOnly={isViewOnlyMode}
        vendors={vendors}
      />

      {/* Vendor Dialog */}
      <VendorDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        editingVendor={editingVendor}
        onSubmit={handleVendorSubmit}
      />

      {/* Development Info Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <h3 className="text-lg font-semibold mb-2">🔧 Development Info</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>State Management:</strong> Self-contained with custom hooks
            </p>
            <p>
              <strong>API Calls:</strong> Client-side fetch with optimistic updates
            </p>
            <p>
              <strong>Error Handling:</strong> Built-in retry mechanisms and user feedback
            </p>
            <p>
              <strong>Loading States:</strong> Skeleton UI and progress indicators
            </p>
            <p>
              <strong>Real-time Updates:</strong> No page reloads required
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceDashboardDemo;
