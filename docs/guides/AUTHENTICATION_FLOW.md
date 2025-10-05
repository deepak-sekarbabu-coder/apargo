# Authentication Flow Documentation

## Overview

This document describes the complete authentication flow for Apargo, including first-time and existing users, role-based redirection and onboarding for multi-apartment complexes. The system implements a dual role system with authentication roles and property roles, with automatic session management and secure server-side validation.

## User Authentication Flow

### 1. First-Time User Login (Email or Google)

When a user logs in for the first time:

1. **Firebase Authentication**: User authenticates via Firebase Auth (email/password or Google Sign-In)
2. **User Lookup**: Check if user exists in Firestore by email
3. **User Creation**: If user doesn't exist in Firestore:
   - Create new user with default `role: 'user'`
   - Set `propertyRole: undefined` (triggers onboarding)
   - Set `isApproved: false` (user approval status)
   - Save user data including name, email, avatar from Firebase Auth
4. **Session Creation**: Create Firebase session cookie for server-side authentication
5. **Redirection**: Redirect to `/dashboard`
6. **Onboarding**: Dashboard detects missing `apartment` or `propertyRole` and shows onboarding dialog
7. **Profile Completion**: User selects apartment and property role (tenant/owner)
8. **Dashboard Access**: User can now access full application features

### 2. Existing User Login

When an existing user logs in:

1. **Firebase Authentication**: User authenticates via Firebase Auth
2. **User Retrieval**: Fetch existing user data from Firestore by email
3. **Approval Check**: Verify user account is approved (`isApproved: true`)
4. **Session Creation**: Create Firebase session cookie
5. **Redirection**: Redirect to `/dashboard`
6. **Dashboard Access**: User immediately accesses dashboard with their role permissions

## Role System

### Authentication Roles (`role` field)

- **`user`**: Default role for regular users (assigned to all new users)
- **`admin`**: Administrative privileges (can manage users, approve announcements, manage maintenance, etc.)
- **`incharge`**: Special role with additional permissions (can delete polls, manage certain admin functions)

### Property Roles (`propertyRole` field)

- **`tenant`**: Rents the apartment
- **`owner`**: Owns the apartment
- **`undefined`**: Not yet assigned (triggers onboarding flow)

### Approval Status (`isApproved` field)

- **`true`**: User account is approved and can access the application
- **`false`**: User account requires approval before accessing application features

## Code Implementation

### AuthContext (`src/context/auth-context.tsx`)

The main authentication logic is handled in the `AuthContext`:

```typescript
// When Firebase auth state changes
onAuthStateChanged(auth, async firebaseUser => {
  if (firebaseUser && firebaseUser.email) {
    try {
      let appUser: User | null = null;
      let shouldCreateUser = false;

      try {
        appUser = await getUserByEmail(firebaseUser.email);
        // If we successfully queried and user doesn't exist, we should create one
        if (!appUser) {
          shouldCreateUser = true;
        }
      } catch (queryErr) {
        // Handle different types of errors appropriately
        const msg = (queryErr as Error)?.message || '';
        if (
          msg.includes('INTERNAL ASSERTION') ||
          msg.includes('transient') ||
          msg.includes('temporary')
        ) {
          // For transient errors, don't create user immediately - let it retry on next auth event
          log.warn(
            'Transient Firestore error during user lookup, skipping user creation to prevent duplicates:',
            msg
          );
          setUser(null);
          setLoading(false);
          return; // Exit early without creating user
        } else {
          // For other errors, log and assume user doesn't exist (safer than creating duplicates)
          log.error('Error querying user by email, will create new user if needed:', queryErr);
          shouldCreateUser = true;
        }
      }

      // Only create user if we're certain they don't exist
      if (shouldCreateUser) {
        log.info('Creating new user for email:', firebaseUser.email);
        const newUser: Omit<User, 'id'> = {
          name: firebaseUser.displayName || 'New User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || undefined,
          role: 'user', // Default role
          propertyRole: undefined, // Triggers onboarding
          apartment: '',
        };
        appUser = await addUser(newUser);
        log.info('Successfully created new user with ID:', appUser.id);
      }

      setUser(appUser);
      try {
        await setSessionCookie(firebaseUser);
      } catch (sessionError) {
        // Only log error if critical
        const errorMessage = (sessionError as Error).message;
        if (errorMessage.includes('auth/') || errorMessage.includes('permission')) {
          throw sessionError;
        }
      }
      router.replace('/dashboard');
    } catch (error) {
      log.error('Authentication error:', error);
      await handleAuthError(error, firebaseUser);
      setUser(null);
    }
  } else {
    setUser(null);
    await clearSessionCookie();
  }
  setLoading(false);
});
```

### Onboarding Flow (`src/components/apargo-app.tsx`)

The main app component handles onboarding:

```typescript
// Show onboarding dialog if user lacks apartment or property role
React.useEffect(() => {
  if (user && (!user.apartment || !user.propertyRole)) {
    setShowApartmentDialog(true);
  }
}, [user]);
```

### Session Management (`src/app/api/auth/session/route.ts`)

Server-side session management:

- Creates secure HTTP-only session cookies
- Handles session verification for protected routes
- Provides development fallback for local testing
- Implements proper session cleanup on logout

## Security Features

1. **HTTP-Only Cookies**: Session cookies are HTTP-only and secure
2. **Server-Side Verification**: Dashboard page verifies session server-side
3. **Role-Based Access**: Different features available based on user role
4. **Automatic Cleanup**: Invalid sessions are automatically cleared
5. **User Approval**: Accounts must be approved before accessing application
6. **Persistent Storage**: Uses browser local persistence for persistent login

## Data Validation & Error Handling

The authentication system implements robust error handling:

- **Transient Error Handling**: Prevents duplicate user creation during network issues
- **Session Verification**: Validates session cookie on each dashboard access
- **User Approval Check**: Ensures users are approved before full access
- **Graceful Degradation**: Continues operation when non-critical errors occur

## Development vs Production

### Development Mode

- Fallback session creation if Firebase Admin SDK fails
- Additional logging for debugging
- Less strict security settings for local development
- Error reporting for debugging authentication flow

### Production Mode

- Full Firebase Admin SDK integration
- Secure cookie settings
- Proper error handling and user feedback
- Enhanced security measures

## User Experience

### New User Journey

1. Click "Sign in with Google" or enter email/password
2. Automatic account creation with default permissions and `isApproved: false`
3. Seamless redirect to dashboard
4. One-time onboarding to select apartment and role
5. Account approval required for full access
6. Full access to application features after approval

### Returning User Journey

1. Click "Sign in"
2. Automatic authentication and session restoration
3. Direct access to dashboard with existing permissions
4. No additional setup required (if already onboarded and approved)

## Error Handling

The system handles various error scenarios:

- Invalid authentication tokens
- Network connectivity issues
- Firebase service unavailability
- Session cookie creation failures
- User data corruption
- Transient Firestore errors
- Unapproved accounts attempting to access restricted features

All errors are logged and users receive appropriate feedback messages.

## Testing the Flow

1. **New User Test**:
   - Sign up with new email/Google account
   - Should create user with role 'user' and `isApproved: false`
   - Should redirect to dashboard
   - Should show onboarding dialog

2. **Existing User Test**:
   - Sign in with existing account
   - Should find user in Firestore
   - Should redirect to dashboard
   - Should show main app (no onboarding if complete)

3. **Approval Flow Test**:
   - New user should have limited access until approved
   - Approved user should have full access

4. **Error Handling Test**:
   - Try invalid credentials
   - Should show error message
   - Should not redirect
   - Should maintain login form state

## Troubleshooting

If authentication is still not working:

1. **Check Browser Console**: Look for error messages during login
2. **Check Network Tab**: Verify API calls are succeeding
3. **Check Firestore**: Ensure user documents exist with correct email field
4. **Check Firebase Auth**: Verify users are being created in Firebase Auth
5. **Check Session Cookies**: Verify session cookies are being set
6. **Verify User Approval**: Ensure user has `isApproved: true`
7. **Check Firebase Admin SDK**: Confirm it's properly configured
