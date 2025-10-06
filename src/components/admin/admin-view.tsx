import { Calendar, CreditCard, FileText, Megaphone, Users } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import type { Category, Payment, PollOption, User } from '@/lib/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AdminCategoriesTab } from './admin-categories-tab';
import { AdminCommunityTab } from './admin-community-tab';
import { AdminPaymentEventsTab } from './admin-payment-events-tab';
import { AdminPaymentsTab } from './admin-payments-tab';
import { AdminUsersTab } from './admin-users-tab';

// import { AdminFileManager } from './admin-file-manager'; // Removed to resolve unused import lint error; restore when Files tab is re-enabled.

interface AdminViewProps {
  users: User[];
  categories: Category[];

  onAddUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;

  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
  getUserById: (id: string) => User | undefined;

  payments?: Payment[];
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
}

export function AdminView({
  users,
  categories,

  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRejectUser,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,

  onAddPoll,
  payments = [],
  onApprovePayment,
  onRejectPayment,
  getUserById,
}: AdminViewProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<string>('users');

  // Restore persisted tab on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('admin.activeTab');
      if (saved) setActiveAdminTab(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const updateActiveAdminTab = useCallback((val: string) => {
    setActiveAdminTab(val);
    try {
      sessionStorage.setItem('admin.activeTab', val);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Admin Navigation Tabs */}
      <Tabs value={activeAdminTab} onValueChange={updateActiveAdminTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="users" className="admin-mobile-tab">
            <Users className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="admin-mobile-tab">
            <FileText className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="admin-mobile-tab">
            <CreditCard className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="payment-events" className="admin-mobile-tab">
            <Calendar className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Payment Events</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="admin-mobile-tab">
            <Megaphone className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Community</span>
          </TabsTrigger>
          {/* <TabsTrigger value="files" className="admin-mobile-tab">
            <HardDrive className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Files</span>
          </TabsTrigger> */}
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <AdminUsersTab
            users={users}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onRejectUser={onRejectUser}
          />
        </TabsContent>

        {/* Categories Management Tab */}
        <TabsContent value="categories" className="space-y-4">
          <AdminCategoriesTab
            categories={categories}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <AdminPaymentsTab
            payments={payments}
            getUserById={getUserById}
            onApprovePayment={onApprovePayment}
            onRejectPayment={onRejectPayment}
          />
        </TabsContent>

        {/* Payment Events Tab */}
        <TabsContent value="payment-events" className="space-y-4">
          <AdminPaymentEventsTab payments={payments} users={users} categories={categories} />
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <AdminCommunityTab onAddPoll={onAddPoll} />
        </TabsContent>

        {/* Files Tab hidden */}
        {/*
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    File Management
                  </CardTitle>
                  <CardDescription>
                    Manage uploaded files across all categories. Delete files older than 3 months to
                    optimize storage usage.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdminFileManager />
            </CardContent>
          </Card>
        </TabsContent>
        */}
      </Tabs>
    </div>
  );
}

export default AdminView;
