import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { RouteGuard } from '@/components/core/route-guard';
import { useAuth } from '@/context/auth-context';

// Mock the hooks
jest.mock('@/context/auth-context');
jest.mock('next/navigation');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('RouteGuard Component', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    propertyRole: undefined,
    apartment: 'A101',
  };

  const mockAdminUser = {
    ...mockUser,
    role: 'admin' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { getByText } = render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render children while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { queryByText } = render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to /login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      // Wait for effect to run and router.replace to be called
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });

    it('should not render children when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { queryByText } = render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { getByText } = render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      render(
        <RouteGuard>
          <div>Protected Content</div>
        </RouteGuard>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access', () => {
    it('should render children when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { getByText } = render(
        <RouteGuard requiredRole="admin">
          <div>Admin Content</div>
        </RouteGuard>
      );

      expect(getByText('Admin Content')).toBeInTheDocument();
    });

    it('should redirect when user does not have required role', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      render(
        <RouteGuard requiredRole="admin">
          <div>Admin Content</div>
        </RouteGuard>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });

    it('should not render children when user does not have required role', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loginWithGoogle: jest.fn(),
        updateUser: jest.fn(),
      });

      const { queryByText } = render(
        <RouteGuard requiredRole="admin">
          <div>Admin Content</div>
        </RouteGuard>
      );

      expect(queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
});
