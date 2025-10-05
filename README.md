# Apargo

Apargo is a modern web application for managing shared apartment expenses, user roles, notifications, and community engagement in a multi-apartment complex.

Features:

- Advanced expense division (auto-split, payer excluded, per-apartment payment tracking)
- Outstanding balance tracking (dashboard top, red highlight)
- Dual role system (auth role: user/admin/incharge, propertyRole: tenant/owner) with onboarding trigger if missing
- Admin panel for user/category/expense/announcement/poll management
- Push notifications (FCM, browser opt-in, token saved to user profile)
- Analytics dashboard with expense insights and reporting
- CSV export for expenses and payment data
- Fault reporting flows with image upload and severity tracking
- Payment gateway integration with multiple payment methods
- Maintenance dashboard with vendor management and task scheduling
- Payment events system with automatic recurring payments
- Firebase Storage integration for file management
- Community features with polling and announcements
- Real-time notifications system with priority levels

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/unicornproperties/deploys)

---

## Project Structure

```text
/ ├── src/
│   ├── app/           # Next.js App Router: pages, layouts, API routes
│   ├── components/    # Reusable UI and feature components (dialogs, lists, admin, analytics, etc.)
│   │   └── ui/        # ShadCN UI components (Button, Card, Dialog, etc.)
│   ├── context/       # React Contexts (e.g., AuthContext for global auth state)
│   ├── hooks/         # Custom React hooks (e.g., use-toast, use-apartments)
│   ├── lib/           # Firestore logic, type definitions, utilities, backend logic
│
├── public/            # Static assets, favicon, service workers (FCM)
├── docs/              # User and developer documentation (see below)
├── .netlify/          # Netlify functions and config
├── .github/           # Copilot and workflow instructions
├── package.json       # Project dependencies and scripts
├── tailwind.config.ts # Tailwind CSS config
├── netlify.toml       # Netlify deployment config
```

**Key files:**

- `src/lib/firestore.ts`: Centralized Firestore CRUD logic (users, expenses, categories, announcements, polls, maintenance, payments, faults, vendors)
- `src/context/auth-context.tsx`: Global authentication state and onboarding logic
- `src/lib/types.ts`: TypeScript types for all core entities and roles (User, Expense, Maintenance, Payment, Fault, Vendor, etc.)
- `src/lib/expense-utils.ts`: Expense division and per-apartment payment tracking logic
- `src/lib/storage-enhanced.ts`: Enhanced Firebase Storage service with validation and metadata
- `src/components/outstanding-balance.tsx`: Outstanding balance display (dashboard)
- `src/components/expense-item.tsx`: Expense display and payment status
- `src/components/dialogs/`: Dialogs for add/edit flows (ShadCN UI)
- `src/lib/push-notifications.ts` & `public/firebase-messaging-sw.js`: FCM push notification logic
- `src/components/admin/`: Admin panel features (announcements, polls, file management, user management)
- `src/components/analytics/`: Analytics dashboard with expense insights
- `src/components/payment-events/`: Payment events system and history
- `src/components/maintenance/`: Maintenance dashboard, vendor management, and task scheduling
- `src/components/fault-reporting/`: Fault reporting system with image upload
- `src/app/api/`: Next.js API routes for all backend operations
- `src/lib/payments.ts`: Payment status computation and balance calculations
- `src/lib/maintenance-utils.ts`: Maintenance task recurrence and scheduling logic

---

## Architecture & Data Flow

- **Frontend**: Next.js 15.5.4 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI, Radix UI. All UI logic is component-driven and uses dialogs for add/edit flows.
- **State Management**:
  - **Global**: Authentication state via React Context (`AuthContext`). Onboarding triggers if roles missing.
  - **Local**: App data (users, expenses, categories) managed in main app component, passed via props.
- **Backend**: Firebase (Firestore for data, Auth for login, FCM for notifications). All DB logic in `src/lib/firestore.ts`.
- **Expense Division**: Every expense is auto-divided among all apartments, payer excluded. Payment status tracked per apartment. See [`docs/features/EXPENSE_DIVISION_FEATURE.md`](docs/features/EXPENSE_DIVISION_FEATURE.md).
- **Roles**: Dual roles per user: `role` (user/admin/incharge) and `propertyRole` (tenant/owner). Onboarding required if missing. See [`docs/roles/ROLE_STRUCTURE.md`](docs/roles/ROLE_STRUCTURE.md).
- **Notifications**: Push notifications via FCM, setup in `public/firebase-messaging-sw.js` and `src/lib/push-notifications.ts`.
- **Admin Panel**: Admins manage users, categories, expenses, announcements, polls, and maintenance tasks.
- **Payment Integration**: Payment gateway logic with support for multiple payment methods (UPI, cards, bank transfers).
- **Fault Reporting**: Comprehensive fault reporting with image upload, severity tracking, and status management.
- **Analytics**: Analytics logic in `src/components/analytics/` with expense insights and reporting.
- **CSV Export**: Dashboard supports expense and payment data export.
- **Maintenance System**: Complete maintenance management with vendor directory, task scheduling, and budget tracking.
- **Payment Events**: Automated recurring payment system for maintenance fees and other regular expenses.
- **Storage Management**: Firebase Storage integration with file validation, metadata tracking, and admin management.
- **Balance Calculations**: Real-time balance sheet updates with opening/closing balances per apartment per month, automatically updated when expenses/change payments are made.

---

## Developer Workflow

- **Install dependencies**: `npm install`
- **Environment setup**: Copy `.env.example` to `.env.local` and fill Firebase config
- **Dev server**: `npm run dev` (Turbopack, [http://localhost:3000](http://localhost:3000))
- **Build for production**: `npm run build`
- **Build for Netlify**: `npm run netlify-build`
- **Lint/Format**: `npm run lint`, `npm run format`, `npm run lint:fix`
- **Type checking**: `npm run typecheck`
- **Testing**: `npm test` for Jest tests, `npm run test:payment-category` for specific payment tests
- **Database setup**: Use `npm run insert-apartments`, `npm run insert-categories`, `npm run insert-users` for initial data
- **Debugging**: Use `npm run debug-netlify` and test scripts to isolate and resolve issues
- **Clean build**: `npm run clean` to remove build artifacts
- **Contribution**: Fork, branch, follow code style (TypeScript, Prettier, ESLint), add/update tests, document changes, submit PR

### Desktop PageUp/PageDown & Mouse Scroll Fix

Dialogs previously locked body scroll on all devices which disabled Page Up / Page Down keys and mouse wheel scrolling on desktops/laptops. As of latest update, scroll locking is applied only on mobile viewports (<768px). Desktop users retain native keyboard and wheel scrolling even when a dialog is open. To revert to old behavior globally, adjust the conditional in `src/components/ui/dialog.tsx` where `preventScroll && isMobile` is checked.

---

## Integration Points

- **Firebase**: All backend logic (auth, DB, notifications) via Firebase SDKs. See `src/lib/firebase.ts` (client), `firebase-admin.ts` (server).
- **Netlify**: Deployment via Netlify; see `.netlify/` and `netlify.toml`.
- **CSV Export**: Expense data export logic in dashboard
- **Payment Gateways**: See `src/components/payment-gateways.tsx` and related docs
- **Fault Reporting**: Dedicated flows and components

---

## Documentation & References

- [Developer Documentation](docs/guides/DEVELOPER_DOCUMENTATION.md): Technical overview, setup, architecture
- [API Reference](docs/api/API_REFERENCE.md): Complete API endpoint documentation
- [Component Reference](docs/api/COMPONENT_REFERENCE.md): Overview of all 99+ React components
- [Payment Events Scheduler](docs/api/PAYMENT_EVENTS_SCHEDULER.md): Automated payment event generation and scheduling
- [Authentication Flow](docs/guides/AUTHENTICATION_FLOW.md): Auth system, onboarding, session management
- [Role Structure](docs/guides/ROLE_STRUCTURE.md): User roles, permissions, onboarding logic
- [Expense Division](docs/features/EXPENSE_DIVISION_FEATURE.md): Expense logic, payment tracking, outstanding balances
- [Announcements Feature](docs/features/ANNOUNCEMENTS_FEATURE.md): Admin announcements and notification system
- [Maintenance Feature](docs/features/MAINTENANCE_FEATURE.md): Maintenance management and vendor directory
- [Firebase Storage Implementation](docs/implementation/FIREBASE_STORAGE_IMPLEMENTATION_SUMMARY.md): File upload and storage system
- [Netlify Deployment](docs/deployment/NETLIFY_DEPLOYMENT.md): Deployment and environment setup
- [Blueprint](docs/architecture/blueprint.md): UI/UX guidelines and design patterns

---

## FAQ & Troubleshooting

- For common issues, see [`docs/deployment/NETLIFY_TROUBLESHOOTING.md`](docs/deployment/NETLIFY_TROUBLESHOOTING.md) and in-app help dialogs
- If you encounter authentication or deployment issues, check browser console and Netlify logs
- For more, see `.github/copilot-instructions.md` and `/docs` for AI/developer guidance

### UI Note: Theme Switcher on Login

The light/dark theme switcher is available on the login page (top-right). Users can select their preferred theme before signing in. The choice is persisted via `localStorage` under the `theme` key and applied globally by `ThemeProvider`.

---

## Contribution Guidelines

We welcome contributions! To get started:

1. **Fork** the repository and create a new feature branch
2. **Follow the code style**: TypeScript, Prettier, ESLint enforced
3. **Add or update tests** as needed (see test scripts in project root)
4. **Document your changes** in relevant markdown files in `/docs`
5. **Submit a pull request** with a clear description of your changes
6. For major changes, **open an issue** first to discuss your proposal

---
