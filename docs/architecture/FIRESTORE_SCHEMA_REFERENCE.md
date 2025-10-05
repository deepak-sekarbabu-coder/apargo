# Firestore Database Schema Quick Reference

## Collections Overview

| Collection             | Purpose                        | Documents      | Key Fields                                                                     |
| ---------------------- | ------------------------------ | -------------- | ------------------------------------------------------------------------------ |
| **users**              | User profiles & authentication | ~14 users      | `name`, `email`, `role`, `propertyRole`, `apartment`, `isApproved`, `fcmToken` |
| **apartments**         | Apartment units                | 7 units        | `id`, `name`, `members[]`                                                      |
| **categories**         | Expense categorization         | ~10 categories | `name`, `icon`, `noSplit`, `isPaymentEvent`, `monthlyAmount`, `dayOfMonth`     |
| **expenses**           | Shared expenses                | Dynamic        | `amount`, `paidByApartment`, `owedByApartments[]`, `receipt`                   |
| **payments**           | Payment transactions           | Dynamic        | `payerId`, `payeeId`, `amount`, `status`, `monthYear`, `receiptURL`            |
| **balanceSheets**      | Monthly financial summaries    | Per apt/month  | `apartmentId`, `monthYear`, `totalIncome`, `totalExpenses`                     |
| **notifications**      | System notifications           | Dynamic        | `type`, `title`, `message`, `toApartmentId`, `priority`                        |
| **polls**              | Community polls                | Dynamic        | `question`, `options[]`, `votes{}`, `isActive`, `expiresAt`                    |
| **announcements**      | Community announcements        | Dynamic        | `title`, `message`, `createdBy`, `priority`, `isActive`, `expiresAt`           |
| **faults**             | Maintenance fault reports      | Dynamic        | `description`, `status`, `severity`, `reportedBy`, `assignedTo`, `priority`    |
| **fileMetadata**       | File upload tracking           | Dynamic        | `fileName`, `downloadURL`, `category`, `uploadedBy`, `relatedId`               |
| **maintenanceTasks**   | Maintenance scheduling         | Dynamic        | `title`, `status`, `scheduledDate`, `vendorId`, `recurrence`                   |
| **vendors**            | Service providers              | Dynamic        | `name`, `serviceType`, `phone`, `email`, `rating`, `isActive`                  |
| **maintenanceBudgets** | Annual budget tracking         | Per year       | `year`, `totalBudget`, `spentByCategory{}`, `allocatedByCategory{}`            |

## Standard Data Patterns

### Document IDs

- **Auto-generated**: Most collections use Firestore auto-generated IDs
- **Composite**: `balanceSheets` uses `{apartmentId}_{monthYear}` pattern
- **Semantic**: `apartments` uses semantic IDs (G1, F1, F2, S1, S2, T1, T2)

### Common Fields

- **Timestamps**: `createdAt`, `updatedAt` (ISO date strings)
- **User References**: `createdBy`, `reportedBy`, `uploadedBy` (User IDs)
- **Status Fields**: `isActive`, `isApproved`, `status` (boolean or enum)
- **Apartment Links**: `apartmentId`, `apartment` (apartment references)

### Date Formats

- **ISO Strings**: `2024-08-24T10:30:00.000Z` for timestamps
- **Date Only**: `2024-08-24` for scheduled dates
- **Month-Year**: `2024-08` for financial periods

## Key Relationships

```
apartments (1) ←→ (many) users
apartments (1) ←→ (many) expenses
apartments (1) ←→ (many) payments
apartments (1) ←→ (many) balanceSheets

users (1) ←→ (many) expenses (via paidByApartment)
users (1) ←→ (many) payments (via payerId/payeeId)
users (1) ←→ (many) faults (via reportedBy)
users (1) ←→ (many) fileMetadata (via uploadedBy)

categories (1) ←→ (many) expenses (via categoryId)
categories (1) ←→ (many) payments (for payment events)

vendors (1) ←→ (many) maintenanceTasks (via vendorId)
```

## Critical Indexes

### High-Traffic Queries

```javascript
// Expense tracking by apartment
{ "paidByApartment": "ASC", "date": "DESC" }
{ "owedByApartments": "CONTAINS", "date": "DESC" }

// Payment tracking by apartment/month
{ "apartmentId": "ASC", "monthYear": "ASC" }
{ "monthYear": "ASC", "category": "ASC" }
{ "payerId": "ASC", "status": "ASC" }
{ "status": "ASC", "createdAt": "DESC" }

// Balance sheet lookups
{ "apartmentId": "ASC", "monthYear": "ASC" }

// Fault management
{ "status": "ASC", "reportedAt": "DESC" }
{ "assignedTo": "ASC", "status": "ASC" }
{ "severity": "ASC", "priority": "DESC" }
{ "reportedBy": "ASC", "reportedAt": "DESC" }

// Maintenance task management
{ "status": "ASC", "scheduledDate": "ASC" }
{ "vendorId": "ASC", "scheduledDate": "ASC" }
{ "category": "ASC", "status": "ASC" }
{ "completedDate": "DESC" }
{ "recurrence": "ASC", "scheduledDate": "ASC" }

// File management
{ "category": "ASC", "uploadedAt": "DESC" }
{ "uploadedBy": "ASC", "uploadedAt": "DESC" }
{ "relatedId": "ASC", "category": "ASC" }

// Vendor management
{ "serviceType": "ASC", "isActive": "ASC" }
{ "rating": "DESC", "isActive": "ASC" }
{ "lastUsedAt": "DESC" }

// Community features
{ "isActive": "ASC", "createdAt": "DESC" }
{ "expiresAt": "ASC", "isActive": "ASC" }
{ "priority": "DESC", "createdAt": "DESC" }

// Notifications and announcements
{ "toApartmentId": "CONTAINS", "createdAt": "DESC" }
{ "type": "ASC", "isRead": "ASC" }
{ "priority": "DESC", "isActive": "ASC" }
```

## Access Patterns

### Real-time Subscriptions

- **Dashboard**: expenses, payments, balanceSheets for current apartment
- **Admin Panel**: all collections for management
- **Community**: announcements, polls for all apartments
- **Maintenance**: tasks, vendors for scheduling

### Batch Operations

- **Monthly Payments**: Generate payments for all apartments
- **Balance Updates**: Update balance sheets on expense/payment changes
- **Recurring Tasks**: Create new maintenance tasks from completed ones

### Query Optimizations

- **Server-side Filtering**: Reduce client-side data processing
- **Pagination**: Maintenance tasks, payment history
- **Selective Fields**: Minimize data transfer for lists
- **Composite Queries**: Merge multiple server queries client-side

## Security Considerations

### Access Control

- **Authentication Required**: All operations require valid user session
- **Role-based Access**: Admin operations restricted to admin users
- **Apartment Isolation**: Users see only relevant apartment data
- **Data Ownership**: Users can modify only their own records

### Sensitive Data

- **Email/Phone**: Optional fields, user-controlled
- **Financial Data**: Restricted to apartment members
- **Admin Functions**: Category management, user approval, payment approval

## Performance Notes

### Read Optimization

- **Denormalized Balances**: Pre-computed financial summaries
- **Selective Subscriptions**: Only real-time where needed
- **Index Coverage**: All queries have supporting indexes

### Write Optimization

- **Delta Updates**: Balance sheets use incremental updates
- **Batch Writes**: Group related operations
- **Async Processing**: Non-critical updates handled asynchronously

### Storage Efficiency

- **Optional Fields**: Use optional rather than null values
- **Compact Arrays**: Apartment lists, vote tracking
- **Reference IDs**: Link documents by ID rather than embedding

---

For detailed documentation, see [FIRESTORE_DATABASE_COMPONENTS.md](FIRESTORE_DATABASE_COMPONENTS.md)
