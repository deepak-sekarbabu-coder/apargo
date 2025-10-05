# Role Structure Documentation

## Overview

The application uses a dual-role system to separate authentication permissions from property relationships.

## Role Types

### 1. Authentication Roles (`role` field)

- `user`: Default role for regular users
- `admin`: Administrative privileges (can manage all users, approve announcements, etc.)
- `incharge`: Special role with additional permissions (can delete polls, manage certain admin functions)

### 2. Property Roles (`propertyRole` field)

- `tenant`: Rents the apartment
- `owner`: Owns the apartment
- `undefined`: Not yet assigned (triggers onboarding flow)

## User Flow

- On first login, user authenticates via Firebase Auth
- System creates user with `role: 'user'` and `propertyRole: undefined`
- User is prompted to select apartment and property role (tenant/owner)
- User can now access the full application

## Role Management

- Only admins can change authentication roles (user ↔ admin)
- Property role can be updated through user management interface
- Apartment assignment can be changed by admins or during onboarding

## UI Changes

- Edit User Dialog shows both "System Role" and "Property Role" fields
- Add User Dialog includes both role types
- User table displays both roles with different badge styles

## Technical Implementation

### Type Definition

```typescript
export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'incharge'; // Authentication role
  propertyRole?: 'tenant' | 'owner'; // Property relationship
  fcmToken?: string;
  apartment: string;
  isApproved?: boolean;
};
```

### Permission Checks

- Admin features: `user.role === 'admin'`
- Property-specific logic: `user.propertyRole === 'owner'` or `user.propertyRole === 'tenant'`
- Onboarding trigger: `!user.apartment || !user.propertyRole`

## Benefits

- Clear separation of authentication permissions and property relationships
- Flexible management for admins
- Improved user experience
- Scalable for future role additions
