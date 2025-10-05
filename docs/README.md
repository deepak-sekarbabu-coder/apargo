# Project Documentation - Apargo

This `docs/` folder contains comprehensive project documentation for developers and maintainers. The documentation is organized into logical sections for easy navigation and maintenance.

## Quick Start

- **New developers**: Start with [`guides/DEVELOPER_DOCUMENTATION.md`](guides/DEVELOPER_DOCUMENTATION.md)
- **Users**: See the User Guide section in [`architecture/blueprint.md`](architecture/blueprint.md)
- **Testing**: Check [`testing/TESTS_GUIDE.md`](testing/TESTS_GUIDE.md)
- **Deployment**: Refer to [`deployment/NETLIFY_DEPLOYMENT.md`](deployment/NETLIFY_DEPLOYMENT.md)

## Documentation Structure

### Documentation Standards

- [`TEMPLATE.md`](TEMPLATE.md) - Documentation template and formatting standards

### Core Documentation

- [`api/`](api/) - API references and component documentation
  - [`API_REFERENCE.md`](api/API_REFERENCE.md) - Complete API endpoint documentation with authentication, error handling, and all current endpoints
  - [`COMPONENT_REFERENCE.md`](api/COMPONENT_REFERENCE.md) - Comprehensive UI component reference with all 100+ components

- [`architecture/`](architecture/) - System design and architectural decisions
  - [`blueprint.md`](architecture/blueprint.md) - Complete architecture blueprint and user guide
  - [`FIRESTORE_DATABASE_COMPONENTS.md`](architecture/FIRESTORE_DATABASE_COMPONENTS.md) - Comprehensive Firestore database documentation
  - [`FIRESTORE_SCHEMA_REFERENCE.md`](architecture/FIRESTORE_SCHEMA_REFERENCE.md) - Quick reference for database schema
  - [`DATA_MODELS_REFERENCE.md`](architecture/DATA_MODELS_REFERENCE.md) - Comprehensive data models and TypeScript types reference

### Development Resources

- [`guides/`](guides/) - Essential guides for developers and users
  - [`DEVELOPER_DOCUMENTATION.md`](guides/DEVELOPER_DOCUMENTATION.md) - Comprehensive developer setup and workflow
  - [`AUTHENTICATION_FLOW.md`](guides/AUTHENTICATION_FLOW.md) - Authentication system guide
  - [`ROLE_STRUCTURE.md`](guides/ROLE_STRUCTURE.md) - User roles and permissions

- [`features/`](features/) - Feature specifications and behavioral documentation
  - [`EXPENSE_DIVISION_FEATURE.md`](features/EXPENSE_DIVISION_FEATURE.md) - Expense splitting logic
  - [`ANNOUNCEMENTS_FEATURE.md`](features/ANNOUNCEMENTS_FEATURE.md) - Community announcements system
  - [`MAINTENANCE_FEATURE.md`](features/MAINTENANCE_FEATURE.md) - Maintenance task management
  - [`MAINTENANCE_VENDOR_FLOW.md`](features/MAINTENANCE_VENDOR_FLOW.md) - Seamless vendor creation & highlight flow
  - [`ADMIN_TAB_PERSISTENCE.md`](features/ADMIN_TAB_PERSISTENCE.md) - Persisted admin tab selection across actions
  - [`ADMIN_ANNOUNCEMENT_POLL_MANAGEMENT.md`](features/ADMIN_ANNOUNCEMENT_POLL_MANAGEMENT.md) - Admin management features
  - [`CATEGORY_NO_SPLIT_FEATURE_FLAG.md`](features/CATEGORY_NO_SPLIT_FEATURE_FLAG.md) - Feature flag documentation
  - [`POLL_DELETION_PERMISSIONS.md`](features/POLL_DELETION_PERMISSIONS.md) - Poll management permissions
  - [`FAULT_MANAGEMENT_SYSTEM.md`](features/FAULT_MANAGEMENT_SYSTEM.md) - Comprehensive fault reporting and management
  - [`PAYMENT_EVENTS_SYSTEM.md`](features/PAYMENT_EVENTS_SYSTEM.md) - Automated payment event generation and management
  - [`ENHANCED_STORAGE_SYSTEM.md`](features/ENHANCED_STORAGE_SYSTEM.md) - File upload and storage management
  - [`MOBILE_RESPONSIVENESS_UX.md`](features/MOBILE_RESPONSIVENESS_UX.md) - Mobile optimization and UX improvements
  - [`LEDGER_PAYMENTS_FILTERING.md`](features/LEDGER_PAYMENTS_FILTERING.md) - Ledger payments filtering

### Operations & Deployment

- [`deployment/`](deployment/) - Deployment guides and infrastructure setup
  - [`NETLIFY_DEPLOYMENT.md`](deployment/NETLIFY_DEPLOYMENT.md) - Main deployment guide
  - [`NETLIFY_TROUBLESHOOTING.md`](deployment/NETLIFY_TROUBLESHOOTING.md) - Common deployment issues
  - [`HYDRATION_MISMATCH.md`](deployment/HYDRATION_MISMATCH.md) - SSR hydration troubleshooting
  - [`DEPLOYMENT_CHECKLIST_FIREBASE_FIX.md`](deployment/DEPLOYMENT_CHECKLIST_FIREBASE_FIX.md) - Firebase deployment checklist
  - [`NETLIFY_DEPLOYMENT_CHECKLIST.md`](deployment/NETLIFY_DEPLOYMENT_CHECKLIST.md) - Netlify deployment checklist
  - [`NETLIFY_ENV_SETUP.md`](deployment/NETLIFY_ENV_SETUP.md) - Environment variable setup
  - [`NETLIFY_FIREBASE_FIX.md`](deployment/NETLIFY_FIREBASE_FIX.md) - Netlify-Firebase integration fixes
  - [`NETLIFY_STORAGE_MANAGEMENT.md`](deployment/NETLIFY_STORAGE_MANAGEMENT.md) - Storage management guide
  - [`EXPENSES_SERVER_FILTERING.md`](deployment/EXPENSES_SERVER_FILTERING.md) - Server-side filtering setup

- [`troubleshooting/`](troubleshooting/) - Problem-solving guides and issue resolution
  - [`PAYMENT_STATUS_FIX_SUMMARY.md`](troubleshooting/PAYMENT_STATUS_FIX_SUMMARY.md) - Payment status issue fixes
  - [`PAYMENT_STATUS_TROUBLESHOOTING.md`](troubleshooting/PAYMENT_STATUS_TROUBLESHOOTING.md) - Payment troubleshooting guide
  - [`HYDRATION_MISMATCH.md`](troubleshooting/HYDRATION_MISMATCH.md) - Dashboard hydration mismatch analysis & fix
  - [`PUSH_NOTIFICATIONS.md`](troubleshooting/PUSH_NOTIFICATIONS.md) - Push notifications & service worker troubleshooting (missing /firebase-messaging-sw.js 500 fix)
  - [`FIRESTORE_UNEXPECTED_STATE.md`](troubleshooting/FIRESTORE_UNEXPECTED_STATE.md) - Firestore INTERNAL ASSERTION failure analysis & mitigations

### Technical Implementation

- [`implementation/`](implementation/) - Technical implementation details and UX improvements
  - [`FIREBASE_STORAGE_IMPLEMENTATION_SUMMARY.md`](implementation/FIREBASE_STORAGE_IMPLEMENTATION_SUMMARY.md) - Storage system implementation
  - [`MAINTENANCE_DASHBOARD_UX_REDESIGN.md`](implementation/MAINTENANCE_DASHBOARD_UX_REDESIGN.md) - Dashboard redesign details
  - [`SCHEDULER_SETUP.md`](implementation/SCHEDULER_SETUP.md) - Payment scheduler configuration
  - [`ADMIN_MOBILE_UX_IMPROVEMENTS.md`](implementation/ADMIN_MOBILE_UX_IMPROVEMENTS.md) - Mobile UX enhancements
  - [`MAINTENANCE_DASHBOARD_PAGINATION.md`](implementation/MAINTENANCE_DASHBOARD_PAGINATION.md) - Pagination implementation
  - [`MAINTENANCE_DASHBOARD_REFACTORING.md`](implementation/MAINTENANCE_DASHBOARD_REFACTORING.md) - Dashboard refactoring notes
  - [`MAINTENANCE_SKIP_FEATURE.md`](implementation/MAINTENANCE_SKIP_FEATURE.md) - Skip functionality implementation
  - [`MAINTENANCE_VENDOR_DIRECTORY_REDESIGN.md`](implementation/MAINTENANCE_VENDOR_DIRECTORY_REDESIGN.md) - Vendor directory redesign
  - [`ADMIN_MOBILE_SPACING_IMPROVEMENTS.md`](implementation/ADMIN_MOBILE_SPACING_IMPROVEMENTS.md) - Mobile spacing improvements
  - [`MOBILE_TOUCH_SCROLLING_FIX.md`](implementation/MOBILE_TOUCH_SCROLLING_FIX.md) - Touch scrolling fixes
  - [`DEBOUNCED_FILTERING.md`](implementation/DEBOUNCED_FILTERING.md) - Unified debounced filtering for mobile performance

- [`testing/`](testing/) - Testing strategies and documentation
  - [`TESTS_GUIDE.md`](testing/TESTS_GUIDE.md) - Testing conventions and execution guide
  - [`ENHANCED_STORAGE_TESTING.md`](testing/ENHANCED_STORAGE_TESTING.md) - Storage system testing

## Documentation Guidelines

- **Before adding new documentation**: Read [`TEMPLATE.md`](TEMPLATE.md) for consistent formatting standards
- **Linking**: Always link related documents using relative paths
- **Organization**: Place documents in the most appropriate category based on their primary purpose
- **Updates**: Keep this README updated when adding new documentation files
- **Standards**: Follow the template structure for consistency across all documentation

## Contributing

When adding new documentation:

1. Follow the structure outlined above
2. Use the [`TEMPLATE.md`](TEMPLATE.md) format for consistency
3. Add appropriate links to this README
4. Ensure proper categorization based on the document's primary audience and purpose
5. Update the "Last Updated" field in your documents
6. Include code examples and troubleshooting information where applicable
