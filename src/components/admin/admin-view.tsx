import { Calendar, CreditCard, FileText, Megaphone, Users } from 'lucide-react';

import type { Category, Payment, PollOption, User } from '@/lib/core/types';
import { createStandardAdminConfig } from '@/lib/core/user-actions-config.tsx';
import type { AdminUsersTabConfig } from '@/lib/core/user-actions-config.tsx';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAdminTabState } from '@/hooks/use-admin-tab-state';

import { AdminCategoriesTab } from './categories/admin-categories-tab';
import { AdminCommunityTab } from './community/admin-community-tab';
import { AdminPaymentEventsTab } from './events/admin-payment-events-tab';
import { AdminPaymentsTab } from './payments/admin-payments-tab';
import { AdminUsersTab } from './users/admin-users-tab';

// import { AdminFileManager } from './admin-file-manager'; // Removed to resolve unused import lint error; restore when Files tab is re-enabled.

// Segregated interfaces following Interface Segregation Principle
interface AdminUsersTabProps {
  users: User[];
  config: AdminUsersTabConfig;
}

interface AdminCategoriesTabProps {
  categories: Category[];
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

interface AdminPaymentsTabProps {
  payments: Payment[];
  getUserById: (id: string) => User | undefined;
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
}

interface AdminPaymentEventsTabProps {
  payments: Payment[];
  users: User[];
  categories: Category[];
}

interface AdminCommunityTabProps {
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
}

interface AdminViewProps {
  usersTab?: AdminUsersTabProps;
  categoriesTab?: AdminCategoriesTabProps;
  paymentsTab?: AdminPaymentsTabProps;
  paymentEventsTab?: AdminPaymentEventsTabProps;
  communityTab?: AdminCommunityTabProps;
}

// Legacy props for backward compatibility (deprecated)
interface AdminViewLegacyProps {
  users: User[];
  categories: Category[];

  // User management handlers
  onAddUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;

  // Category management
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;

  // Poll management
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
  getUserById: (id: string) => User | undefined;

  // Payment management
  payments?: Payment[];
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
}

// New configuration-based props (deprecated - use segregated interfaces)
interface AdminViewConfigProps {
  users: User[];
  categories: Category[];
  config: AdminUsersTabConfig;

  // Category management (still needed for other tabs)
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;

  // Poll management
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
  getUserById: (id: string) => User | undefined;

  // Payment management
  payments?: Payment[];
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
}

export function AdminView(props: AdminViewProps | AdminViewLegacyProps | AdminViewConfigProps) {
  const { activeTab, updateTab } = useAdminTabState('users');

  // Handle legacy props for backward compatibility
  const isLegacyProps = 'onAddUser' in props && 'onUpdateUser' in props;
  const isConfigProps = 'config' in props && !isLegacyProps;

  if (isLegacyProps) {
    const legacyProps = props as AdminViewLegacyProps;
    const userConfig = createStandardAdminConfig({
      onAddUser: legacyProps.onAddUser,
      onUpdateUser: legacyProps.onUpdateUser,
      onDeleteUser: legacyProps.onDeleteUser,
      onRejectUser: legacyProps.onRejectUser,
    });

    // Convert legacy props to segregated format
    const segregatedProps: AdminViewProps = {
      usersTab: { users: legacyProps.users, config: userConfig },
      categoriesTab: {
        categories: legacyProps.categories,
        onAddCategory: legacyProps.onAddCategory,
        onUpdateCategory: legacyProps.onUpdateCategory,
        onDeleteCategory: legacyProps.onDeleteCategory,
      },
      paymentsTab: {
        payments: legacyProps.payments || [],
        getUserById: legacyProps.getUserById,
        onApprovePayment: legacyProps.onApprovePayment,
        onRejectPayment: legacyProps.onRejectPayment,
      },
      paymentEventsTab: {
        payments: legacyProps.payments || [],
        users: legacyProps.users,
        categories: legacyProps.categories,
      },
      communityTab: { onAddPoll: legacyProps.onAddPoll },
    };

    return <AdminView {...segregatedProps} />;
  }

  if (isConfigProps) {
    const configProps = props as AdminViewConfigProps;
    // Convert config props to segregated format
    const segregatedProps: AdminViewProps = {
      usersTab: { users: configProps.users, config: configProps.config },
      categoriesTab: {
        categories: configProps.categories,
        onAddCategory: configProps.onAddCategory,
        onUpdateCategory: configProps.onUpdateCategory,
        onDeleteCategory: configProps.onDeleteCategory,
      },
      paymentsTab: {
        payments: configProps.payments || [],
        getUserById: configProps.getUserById,
        onApprovePayment: configProps.onApprovePayment,
        onRejectPayment: configProps.onRejectPayment,
      },
      paymentEventsTab: {
        payments: configProps.payments || [],
        users: configProps.users,
        categories: configProps.categories,
      },
      communityTab: { onAddPoll: configProps.onAddPoll },
    };

    return <AdminView {...segregatedProps} />;
  }

  // Use segregated props
  const segregatedProps = props as AdminViewProps;

  // Extract props for each tab (only what they need)
  const usersTabProps = segregatedProps.usersTab;
  const categoriesTabProps = segregatedProps.categoriesTab;
  const paymentsTabProps = segregatedProps.paymentsTab;
  const paymentEventsTabProps = segregatedProps.paymentEventsTab;
  const communityTabProps = segregatedProps.communityTab;

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Admin Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="users" className="admin-mobile-tab">
            <Users className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">Usr</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="admin-mobile-tab">
            <FileText className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="admin-mobile-tab">
            <CreditCard className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Payments</span>
            <span className="sm:hidden">Pay</span>
          </TabsTrigger>
          <TabsTrigger value="payment-events" className="admin-mobile-tab">
            <Calendar className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Events</span>
            <span className="sm:hidden">Evt</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="admin-mobile-tab">
            <Megaphone className="w-4 h-4 md:mr-2" />
            <span className="hidden lg:inline">Community</span>
            <span className="lg:hidden">Comm</span>
          </TabsTrigger>
          {/* <TabsTrigger value="files" className="admin-mobile-tab">
            <HardDrive className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Files</span>
          </TabsTrigger> */}
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-4">
          {usersTabProps ? (
            <AdminUsersTab {...usersTabProps} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Users tab configuration not provided
            </div>
          )}
        </TabsContent>

        {/* Categories Management Tab */}
        <TabsContent value="categories" className="space-y-4">
          {categoriesTabProps ? (
            <AdminCategoriesTab {...categoriesTabProps} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Categories tab configuration not provided
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {paymentsTabProps ? (
            <AdminPaymentsTab {...paymentsTabProps} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Payments tab configuration not provided
            </div>
          )}
        </TabsContent>

        {/* Payment Events Tab */}
        <TabsContent value="payment-events" className="space-y-4">
          {paymentEventsTabProps ? (
            <AdminPaymentEventsTab {...paymentEventsTabProps} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Payment Events tab configuration not provided
            </div>
          )}
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          {communityTabProps ? (
            <AdminCommunityTab {...communityTabProps} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Community tab configuration not provided
            </div>
          )}
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
