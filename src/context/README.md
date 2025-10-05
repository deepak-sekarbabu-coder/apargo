# Apargo – Context Directory

This directory contains all React context providers for global and shared state management in the Apargo app. Contexts are used to manage authentication, theming, and maintenance state across the application.

## Structure Overview

- **auth-context.tsx**: Provides authentication state and user role management (user, admin, incharge, tenant, owner). Central to login, onboarding, and access control.
- **maintenance-context.tsx**: Manages maintenance-related state, including vendor info, recurring tasks, and budget tracking.
- **theme-context.tsx**: Handles theme switching (light/dark) and persists user theme preferences.

## Conventions

- All context providers are implemented as React Contexts with hooks for easy consumption.
- Contexts are initialized at the top level of the app (see `src/app/layout.tsx`).
- Use context for global/shared state only; prefer local state for feature-specific data.
- TypeScript is used for type safety and context value definitions.

## Example Usage

```tsx
import { useAuth } from '../context/auth-context';

const { user, login, logout } = useAuth();
```

## Best Practices

- Keep context values minimal—avoid storing large or deeply nested objects.
- Use context only for state that must be shared across many components.
- Document context value shape and update patterns in code comments.

## See Also

- [React Context API Documentation](https://react.dev/reference/react/createContext)
- [Apargo App Directory README](../app/README.md)

Follow centralized, typed, and minimal context patterns for maintainability and scalability.
