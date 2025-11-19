/**
 * Tests demonstrating Open/Closed Principle implementation for user actions.
 * Shows that new user actions can be added without modifying existing code.
 */
import type { User } from '../src/lib/core/types';
import {
  createChangeRoleAction,
  createSuspendAction,
  registerUserAction,
  userActionRegistry,
} from '../src/lib/core/user-actions-config.tsx';

describe('Open/Closed Principle - User Actions Configuration', () => {
  const mockUser: User = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    apartment: 'apt1',
    role: 'user',
    isApproved: true,
  };

  describe('Registry Extensibility', () => {
    it('should allow registering new user actions without modifying existing code', () => {
      const initialActionCount = userActionRegistry.getAll().length;

      // Register a new action (suspend user)
      const suspendHandler = jest.fn();
      const suspendAction = createSuspendAction(suspendHandler);

      registerUserAction(suspendAction);

      // Verify the action was registered
      expect(userActionRegistry.getAll().length).toBeGreaterThan(initialActionCount);

      const retrievedAction = userActionRegistry.get('suspend');
      expect(retrievedAction).toBeDefined();
      expect(retrievedAction?.id).toBe('suspend');
    });

    it('should allow conditional actions based on user state', () => {
      const suspendAction = createSuspendAction(jest.fn());

      // Action should be available for approved users
      expect(suspendAction.condition?.(mockUser)).toBe(true);

      // Action should not be available for suspended users
      const suspendedUser = { ...mockUser, isSuspended: true };
      expect(suspendAction.condition?.(suspendedUser)).toBe(false);

      // Action should not be available for unapproved users
      const unapprovedUser = { ...mockUser, isApproved: false };
      expect(suspendAction.condition?.(unapprovedUser)).toBe(false);
    });

    it('should support different action priorities and grouping', () => {
      const suspendAction = createSuspendAction(jest.fn());
      const changeRoleAction = createChangeRoleAction(jest.fn());

      // Verify different priorities
      expect(suspendAction.priority).toBe(75);
      expect(changeRoleAction.priority).toBe(85);

      // Verify different groups
      expect(suspendAction.group).toBe('secondary');
      expect(changeRoleAction.group).toBe('secondary');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing actions and behavior', () => {
      // Verify standard actions are still available
      const approveAction = userActionRegistry.get('approve');
      const rejectAction = userActionRegistry.get('reject');
      const editAction = userActionRegistry.get('edit');
      const deleteAction = userActionRegistry.get('delete');

      expect(approveAction).toBeDefined();
      expect(rejectAction).toBeDefined();
      expect(editAction).toBeDefined();
      expect(deleteAction).toBeDefined();

      // Verify conditions work as expected
      expect(approveAction?.condition?.(mockUser)).toBe(false); // Already approved
      expect(rejectAction?.condition?.({ ...mockUser, isApproved: false })).toBe(true); // Can reject pending
      expect(editAction?.condition?.(mockUser)).toBe(true); // Can edit approved
      expect(deleteAction?.condition?.(mockUser)).toBe(true); // Can delete approved
    });
  });

  describe('Configuration Creation', () => {
    it('should create configurations with custom actions', () => {
      const mockHandlers = {
        onAddUser: jest.fn(),
        onUpdateUser: jest.fn(),
        onDeleteUser: jest.fn(),
        onRejectUser: jest.fn(),
      };

      const suspendAction = createSuspendAction(jest.fn());
      const changeRoleAction = createChangeRoleAction(jest.fn());

      const config = userActionRegistry.createConfig(
        ['approve', 'reject', 'edit', 'delete'], // Standard actions
        {}, // No overrides
        { onAddUser: mockHandlers.onAddUser } // Custom config
      );

      // Add custom actions
      config.actions.push(suspendAction, changeRoleAction);

      // Verify configuration
      expect(config.actions.length).toBeGreaterThanOrEqual(6); // At least standard + custom
      expect(config.onAddUser).toBe(mockHandlers.onAddUser);

      // Verify action ordering by priority
      const actionIds = config.actions.map(a => a.id);
      expect(actionIds).toContain('approve');
      expect(actionIds).toContain('suspend');
      expect(actionIds).toContain('change-role');
    });
  });

  describe('Real-world Extension Scenario', () => {
    it('should demonstrate adding a "Reset Password" action', () => {
      // Define a new action for resetting passwords
      const resetPasswordAction = {
        id: 'reset-password',
        label: 'Reset Password',
        variant: 'outline' as const,
        icon: () => null, // Simplified for testing
        handler: jest.fn(),
        condition: (user: User) => !!user.isApproved && user.email !== undefined,
        priority: 60,
        group: 'secondary' as const,
        confirm: {
          title: 'Reset Password?',
          description: 'This will send a password reset email to the user.',
          actionLabel: 'Send Reset Email',
        },
      };

      // Register the new action
      registerUserAction(resetPasswordAction);

      // Verify it was registered
      const registeredAction = userActionRegistry.get('reset-password');
      expect(registeredAction).toBeDefined();
      expect(registeredAction?.label).toBe('Reset Password');

      // Test conditions
      expect(registeredAction?.condition?.(mockUser)).toBe(true);
      expect(registeredAction?.condition?.({ ...mockUser, isApproved: false })).toBe(false);
      expect(registeredAction?.condition?.({ ...mockUser, email: undefined })).toBe(false);
    });

    it('should demonstrate adding a "View Activity Log" action', () => {
      // Define a view activity action
      const viewActivityAction = {
        id: 'view-activity',
        label: 'View Activity',
        variant: 'ghost' as const,
        icon: () => null, // Simplified for testing
        handler: (user: User) => {
          // Would navigate to activity log page
          console.log(`Viewing activity for ${user.name}`);
        },
        condition: (user: User) => !!user.isApproved,
        priority: 50,
        group: 'secondary' as const,
      };

      // Register the action
      registerUserAction(viewActivityAction);

      // Verify registration and functionality
      const action = userActionRegistry.get('view-activity');
      expect(action).toBeDefined();

      // Test the handler
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      action?.handler(mockUser);
      expect(consoleSpy).toHaveBeenCalledWith('Viewing activity for John Doe');
      consoleSpy.mockRestore();
    });
  });
});
