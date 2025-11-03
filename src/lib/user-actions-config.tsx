import { Check, Pencil, Trash2, X } from 'lucide-react';

import React from 'react';

import type { User } from './types';

/**
 * Configuration system for user management actions.
 * Follows Open/Closed Principle - new actions can be added without modifying existing code.
 */

export interface UserAction {
  id: string;
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ComponentType<{ className?: string }>;
  handler: (user: User) => void | Promise<void>;
  condition?: (user: User) => boolean; // When to show this action
  confirm?: {
    title: string;
    description: React.ReactNode | ((user: User) => React.ReactNode);
    actionLabel: string;
    actionVariant?: 'default' | 'destructive';
  };
  priority?: number; // For ordering actions (higher = more important)
  group?: 'primary' | 'secondary' | 'danger'; // For visual grouping
}

export interface AdminUsersTabConfig {
  actions: UserAction[];
  canAddUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  onAddUser?: (userData: Omit<User, 'id'>) => void;
}

/**
 * Registry for predefined user actions.
 * Allows reuse of common actions across different admin interfaces.
 */
export class UserActionRegistry {
  private actions = new Map<string, UserAction>();

  /**
   * Register a user action
   */
  register(action: UserAction): void {
    this.actions.set(action.id, action);
  }

  /**
   * Get a registered action by ID
   */
  get(id: string): UserAction | undefined {
    return this.actions.get(id);
  }

  /**
   * Get all registered actions
   */
  getAll(): UserAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Create a filtered configuration based on user permissions/conditions
   */
  createConfig(
    actionIds: string[],
    overrides: Partial<Record<string, Partial<UserAction>>> = {},
    globalConfig: Partial<AdminUsersTabConfig> = {}
  ): AdminUsersTabConfig {
    const actions = actionIds
      .map(id => {
        const baseAction = this.actions.get(id);
        const override = overrides[id];
        return baseAction ? { ...baseAction, ...override } : null;
      })
      .filter((action): action is UserAction => action !== null)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Higher priority first

    return {
      actions,
      canAddUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      searchPlaceholder: 'Search users...',
      emptyStateMessage: 'Add users to get started with user management',
      ...globalConfig,
    };
  }
}

// Global registry instance
export const userActionRegistry = new UserActionRegistry();

/**
 * Predefined user actions
 */

// Approve user action
userActionRegistry.register({
  id: 'approve',
  label: 'Approve',
  variant: 'default',
  icon: Check,
  handler: user => {
    // This will be overridden by the parent component
    console.warn('Approve handler not implemented');
  },
  condition: user => !user.isApproved,
  priority: 100,
  group: 'primary',
  confirm: {
    title: 'Approve User?',
    description: (user: User) => (
      <>
        This will approve <strong>{user.name || 'this user'}</strong>'s application and grant them
        access to the system.
      </>
    ),
    actionLabel: 'Approve User',
  },
});

// Reject user action
userActionRegistry.register({
  id: 'reject',
  label: 'Reject',
  variant: 'destructive',
  icon: X,
  handler: user => {
    console.warn('Reject handler not implemented');
  },
  condition: user => !user.isApproved,
  priority: 90,
  group: 'danger',
  confirm: {
    title: 'Reject Application?',
    description: (user: User) => (
      <>
        This will permanently reject <strong>{user.name || 'this user'}</strong>'s application and
        remove their data.
      </>
    ),
    actionLabel: 'Reject Application',
    actionVariant: 'destructive',
  },
});

// Edit user action
userActionRegistry.register({
  id: 'edit',
  label: 'Edit',
  variant: 'outline',
  icon: Pencil,
  handler: user => {
    console.warn('Edit handler not implemented');
  },
  condition: user => !!user.isApproved,
  priority: 80,
  group: 'secondary',
});

// Delete user action
userActionRegistry.register({
  id: 'delete',
  label: 'Delete',
  variant: 'ghost',
  icon: Trash2,
  handler: user => {
    console.warn('Delete handler not implemented');
  },
  condition: user => !!user.isApproved,
  priority: 70,
  group: 'danger',
  confirm: {
    title: 'Delete User?',
    description: (user: User) => (
      <>
        This will permanently delete <strong>{user.name || 'this user'}</strong>'s account and all
        associated data.
      </>
    ),
    actionLabel: 'Delete User',
    actionVariant: 'destructive',
  },
});

/**
 * Example: Suspend user action (demonstrates extensibility)
 */
export const createSuspendAction = (
  onSuspend: (user: User) => void | Promise<void>
): UserAction => ({
  id: 'suspend',
  label: 'Suspend',
  variant: 'outline',
  icon: X,
  handler: onSuspend,
  condition: user => !!user.isApproved && !user.isSuspended,
  priority: 75,
  group: 'secondary',
  confirm: {
    title: 'Suspend User?',
    description: (user: User) => (
      <>
        This will temporarily suspend <strong>{user.name || 'this user'}</strong>'s access to the
        system.
      </>
    ),
    actionLabel: 'Suspend User',
  },
});

/**
 * Example: Change role action (demonstrates extensibility)
 */
export const createChangeRoleAction = (
  onChangeRole: (user: User, newRole: string) => void | Promise<void>
): UserAction => ({
  id: 'change-role',
  label: 'Change Role',
  variant: 'outline',
  handler: user => {
    // This would typically open a role selection dialog
    const newRole = prompt('Enter new role:', user.role || 'user');
    if (newRole && newRole !== user.role) {
      onChangeRole(user, newRole);
    }
  },
  condition: user => !!user.isApproved,
  priority: 85,
  group: 'secondary',
});

/**
 * Helper function to create a standard admin configuration
 */
export const createStandardAdminConfig = (
  handlers: {
    onAddUser: (userData: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onRejectUser: (userId: string) => void;
  },
  customActions: UserAction[] = []
): AdminUsersTabConfig => {
  const config = userActionRegistry.createConfig(['approve', 'reject', 'edit', 'delete'], {
    approve: { handler: user => handlers.onUpdateUser({ ...user, isApproved: true }) },
    reject: { handler: user => handlers.onRejectUser(user.id) },
    edit: { handler: handlers.onUpdateUser },
    delete: { handler: user => handlers.onDeleteUser(user.id) },
  });

  // Add any custom actions
  config.actions.push(...customActions);

  // Set the add user handler
  config.onAddUser = handlers.onAddUser;

  return config;
};

/**
 * Helper function to register new actions globally
 */
export const registerUserAction = (action: UserAction): void => {
  userActionRegistry.register(action);
};
