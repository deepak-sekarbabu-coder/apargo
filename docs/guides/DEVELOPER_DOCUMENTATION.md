# Apargo Developer Documentation

Welcome, developer! This guide provides a technical overview of the Apargo application to help you get started with the codebase quickly.

## 1. Tech Stack

This project is a modern web application built with the following technologies:

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: ShadCN UI (Radix UI primitives)
- **State Management**: React Context API + local state
- **Backend & Services**:
  - Authentication: Firebase Authentication 11.10.0
  - Database: Firestore (Firebase)
  - File Storage: Firebase Storage with enhanced validation
  - Push Notifications: Firebase Cloud Messaging (FCM)
  - Admin SDK: Firebase Admin 12.7.0
- **Form Handling**: React Hook Form 7.62.0 with Zod validation
- **Data Visualization**: Recharts 2.15.1
- **Date Handling**: date-fns 3.6.0
- **Icons**: Lucide React 0.536.0
- **Testing**: Jest 29.7.0 with Testing Library
- **Build Tools**: Turbopack (Next.js dev server)
- **Code Quality**: ESLint, Prettier, TypeScript
- **Deployment**: Netlify with Next.js plugin
- **Data Management**: TanStack Query for client-side caching and state management
- **Logging**: loglevel for client-side logging with different log levels
- **PDF Generation**: jsPDF with jsPDF Autotable for PDF export functionality
- **HTTP Client**: Axios for HTTP requests

## 2. Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation and Running the App

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run export` - Export static build
- `npm run netlify-build` - Clean and build for Netlify deployment
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run Jest tests
- `npm run test:payment-category` - Run specific payment category tests
- `npm run test:payment-events` - Run payment events tests
- `npm run test:payment-scheduler` - Run payment scheduler tests
- `npm run insert-apartments` - Initialize apartment data
- `npm run insert-categories` - Initialize category data
- `npm run insert-users` - Initialize user data
- `npm run debug-netlify` - Debug Netlify deployment
- `npm run clean` - Clean build artifacts
- `npm run analyze` - Analyze bundle size
- `npm run optimize` - Optimize build assets

## 3. Project Structure

The codebase is organized into the following key directories:

- `src/app/`: Next.js App Router pages, layouts, API routes
  - `(auth)/`: Authentication pages (login)
  - `(dashboard)/`: Main dashboard pages (faults, etc.)
  - `api/`: API endpoints for all backend operations
    - `admin/`: Admin-specific APIs (files, storage stats)
    - `announcements/`: Announcement management
    - `auth/`: Authentication/session management
    - `debug/`: Debugging tools and utilities
    - `expenses/`: Expense CRUD operations
    - `fix-notifications/`: Notification repair utilities
    - `health/`: Health check endpoints
    - `maintenance/`: Maintenance tasks and vendors
    - `notification-debug/`: Notification debugging
    - `payment-events/`: Payment event system
    - `payments/`: Payment processing
    - `quick-fix-user/`: User data repair utilities
    - `storage/`: File upload and management
    - `test/`: Testing utilities
    - `test-fcm/`: FCM testing endpoints
    - `test-notification/`: Notification testing
- `src/components/`: Reusable React components
  - `admin/`: Admin panel components (user management, announcements, polls, file manager)
  - `analytics/`: Analytics dashboard components
  - `community/`: Community features (polls, announcements)
  - `dashboard/`: Main dashboard components
  - `dialogs/`: Modal dialogs for CRUD operations
  - `expense-analytics/`: Expense analysis and reporting
  - `expenses/`: Expense management components
  - `fault-reporting/`: Fault reporting system
  - `icons/`: Custom icon components
  - `layout/`: Layout and navigation components
  - `ledger/`: Payment ledger and transaction history
  - `maintenance/`: Maintenance dashboard and vendor management
  - `payment-events/`: Payment event components
  - `ui/`: ShadCN UI components (Button, Card, Dialog, etc.)
- `src/context/`: React Contexts
  - `auth-context.tsx`: Global authentication state
  - `maintenance-context.tsx`: Maintenance data context
  - `theme-context.tsx`: Theme management
- `src/hooks/`: Custom React hooks
  - `use-analytics-data.ts`: Analytics data management
  - `use-file-upload.ts`: File upload handling
  - `use-maintenance-api.ts`: Maintenance API operations
  - `use-toast.ts`: Toast notifications
- `src/lib/`: Core utilities and logic
  - `firestore.ts`: Centralized Firestore database operations and balance sheet management
  - `types.ts`: TypeScript type definitions
  - `storage-enhanced.ts`: Enhanced Firebase Storage service
  - `auth.ts`: Authentication utilities
  - `auth-utils.ts`: Authentication state management utilities
  - `firebase.ts`: Firebase client configuration
  - `firebase-admin.ts`: Firebase admin SDK
  - `push-notifications.ts`: FCM push notification logic
  - `utils.ts`: General utility functions
  - `logger.ts`: Client-side logging with loglevel
  - `expense-utils.ts`: Expense division and calculation logic
  - `payments.ts`: Payment status computation and balance calculations
  - `maintenance-utils.ts`: Maintenance task recurrence and scheduling logic
- `public/`: Static assets, favicon, service workers (FCM)
- `docs/`: Comprehensive documentation
  - `features/`: Feature-specific documentation
  - `guides/`: User and developer guides
  - `implementation/`: Implementation summaries
  - `roles/`: Authentication and role documentation
  - `testing/`: Testing documentation
- `tests/`: Test files and utilities
- `scripts/`: Database initialization scripts
- `.netlify/`: Netlify functions and configuration
- `.github/`: GitHub workflows and Copilot instructions

## 4. Key Concepts

### State Management

- Global State: Authentication state managed via React Context (`AuthContext`).
- Local State: App data (users, expenses, categories) managed in the main app component and passed via props.

### Authentication and Onboarding

- Firebase Authentication for login (email/password, Google Sign-In)
- Onboarding flow triggers if roles or apartment assignment are missing
- Session management via Next.js API routes with server-side cookies
- Dual role system: authentication role (user/admin/incharge) and property role (tenant/owner)

### Backend & Data Flow

- Firestore for all data (users, expenses, categories, announcements, polls, maintenance tasks, vendors)
- All DB logic centralized in `src/lib/firestore.ts` with automatic balance sheet updates
- Firebase Storage for file uploads with enhanced validation and metadata tracking
- FCM for push notifications
- API routes in `src/app/api/` for server-side operations
- Authentication middleware for protected endpoints
- Automatic balance sheet calculations that update when expenses or payments change

### Expense Division System

- Dynamically auto-divides expenses among all active apartments
- Payer excluded from what they owe
- Payment status tracked per apartment
- Outstanding balances displayed in red at the top of the dashboard
- Automatic balance sheet updates with opening/closing balances per apartment per month

### Balance Calculation System

- Real-time balance sheet updates in `src/lib/firestore.ts`
- Per-month calculations for each apartment (opening balance + income - expenses = closing balance)
- Automatic updates when expenses are added, updated, or deleted
- Per-apartment tracking with income/expense deltas computed and applied

### Notifications

- Push notifications via FCM
- Service worker in `public/firebase-messaging-sw.js`
- Client logic in `src/lib/push-notifications.ts`

### Styling

- ShadCN UI components with Radix UI primitives
- Tailwind CSS 3.4.1 with custom configuration
- Utility functions for class merging in `src/lib/utils.ts`
- Mobile-first responsive design
- Dark mode support via theme context
- Custom component variants with class-variance-authority

### API Architecture

- RESTful API endpoints in `src/app/api/`
- Authentication middleware for protected routes
- Comprehensive error handling and validation
- Key endpoints:
  - `/api/expenses` - Expense CRUD operations with automatic balance sheet updates
  - `/api/announcements` - Admin announcements
  - `/api/payment-events` - Recurring payment management
  - `/api/maintenance/tasks` - Maintenance task management with recurrence
  - `/api/maintenance/vendors` - Vendor directory
  - `/api/payments` - Payment processing and balance updates
  - `/api/storage/upload` - File upload with validation
  - `/api/admin/*` - Admin-only operations

### File Management

- Firebase Storage integration with enhanced validation
- File size limits (2MB) and MIME type restrictions
- Metadata tracking and admin management interface
- Organized storage structure by category
- Automatic file cleanup and optimization

### Maintenance System

- Recurring task management with scheduling
- Vendor directory with service types and ratings
- Budget tracking with per-category allocation
- Task status management (scheduled, in_progress, completed, etc.)
- Automatic creation of recurring tasks when completed or skipped

## 5. Technical Improvements

- Modular component-based architecture
- Centralized Firestore logic with automatic balance sheet updates
- Dual-role system (auth + property roles)
- Dialog-driven UI flows with ShadCN UI
- Payment gateway integration with multiple methods
- Comprehensive fault reporting system
- Advanced analytics with data visualization
- Maintenance management with vendor directory and budget tracking
- Payment events system with recurring automation
- Enhanced file storage with validation and metadata
- Real-time notifications with priority levels
- Community features (polls and announcements)
- Mobile-responsive design with Tailwind CSS
- TypeScript for type safety throughout
- Jest testing framework
- Netlify deployment with optimized builds
- Balance sheet calculation and automatic updates per apartment per month
- Comprehensive logging with loglevel
- Data integrity with automatic transaction-like operations in Firestore

## 6. Future Enhancements

- Additional payment methods and gateway integrations
- Advanced analytics with machine learning insights
- Native mobile app development
- Multi-language internationalization support
- Enhanced push notifications with rich media
- Performance optimization and caching strategies
- Comprehensive security audits and hardening
- Automated backup and disaster recovery
- Integration with external maintenance service providers
- Advanced reporting and export capabilities
- Real-time collaboration features
- IoT device integration for automated monitoring

Happy coding!
