# Firestore Database Components Documentation

## Overview

This document provides comprehensive documentation for all Firestore database components used in the Apargo application. The application uses Google Cloud Firestore as its primary NoSQL database, providing real-time data synchronization, scalable storage, and robust querying capabilities.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Collection Schemas](#collection-schemas)
3. [Indexes Configuration](#indexes-configuration)
4. [Data Access Layer](#data-access-layer)
5. [Client-Side Operations](#client-side-operations)
6. [Server-Side Operations](#server-side-operations)
7. [Security Rules](#security-rules)
8. [Performance Optimizations](#performance-optimizations)

## Database Architecture

### Connection Configuration

The application maintains two separate Firebase connections:

#### Client-Side Connection (`src/lib/firebase.ts`)

```typescript
// Configuration for client-side operations
const firebaseConfig = {
  apiKey: 'AIzaSyA7g7daznFO-dDWYv8-jT08DDZlJSFT1lE',
  authDomain: 'unicorndev-b532a.firebaseapp.com',
  projectId: 'unicorndev-b532a',
  storageBucket: 'unicorndev-b532a.firebasestorage.app',
  messagingSenderId: '1047490636656',
  appId: '1:1047490636656:web:851d9f253f1c7da6057db5',
};

// Services: db, auth, messaging
```

#### Server-Side Connection (`src/lib/firebase-admin.ts`)

```typescript
// Firebase Admin SDK for server-side operations
// Uses service account credentials for elevated permissions
// Supports both individual environment variables and JSON configuration
```

### Core Design Principles

1. **Real-time Data Synchronization**: Uses Firestore's `onSnapshot` listeners for live updates
2. **Optimized Queries**: Server-side filtering with composite indexes
3. **Denormalized Data**: Balance sheets and aggregations for performance
4. **Role-based Access**: Admin vs user operations with proper authorization
5. **Transaction Consistency**: Critical operations use transactions or sequential writes

## Collection Schemas

### 1. Users Collection (`users`)

**Purpose**: Store user profiles, authentication roles, and apartment assignments

```typescript
type User = {
  id: string; // Firestore document ID
  name: string; // Display name
  avatar?: string; // Profile image URL
  email?: string; // Email address
  phone?: string; // Phone number
  role?: 'user' | 'admin' | 'incharge'; // System permission level
  propertyRole?: 'tenant' | 'owner'; // Property relationship
  fcmToken?: string; // Push notification token
  apartment: string; // Required apartment assignment
  isApproved?: boolean; // Admin approval status
};
```

**Key Features**:

- Dual role system (authentication role + property role)
- FCM token storage for push notifications
- Admin approval workflow
- Apartment-based access control

### 2. Apartments Collection (`apartments`)

**Purpose**: Define apartment units and their members

```typescript
type Apartment = {
  id: string; // Apartment identifier (e.g., 'G1', 'F1', 'T1')
  name: string; // Display name (e.g., 'Apartment G1')
  members: string[]; // Array of User IDs residing in apartment
};
```

**Standard Apartments**: G1, F1, F2, S1, S2, T1, T2 (7 total units)

### 3. Categories Collection (`categories`)

**Purpose**: Expense categorization with splitting rules and payment event configuration

```typescript
type Category = {
  id: string; // Category identifier
  name: string; // Display name
  icon: string; // Emoji icon for UI
  noSplit?: boolean; // If true, expense isn't split among apartments

  // Payment Event Configuration
  isPaymentEvent?: boolean; // Enables automatic payment generation
  monthlyAmount?: number; // Monthly fee amount
  dayOfMonth?: number; // Day to generate payment (1-28)
  autoGenerate?: boolean; // Enable automatic generation
};
```

**Default Categories**:

- Utilities 🏠 (split), Cleaning 🧹 (no split), Maintenance 🔧 (split)
- CCTV 📹, Electricity ⚡, Supplies 📦, Repairs 🔧
- Water Tank 💧, Security 🔒, Other ❓

### 4. Expenses Collection (`expenses`)

**Purpose**: Shared expense management with automatic splitting logic

```typescript
type Expense = {
  id: string; // Expense identifier
  description: string; // Expense description
  amount: number; // Total amount
  date: string; // ISO date string
  paidByApartment: string; // Apartment that paid initially
  owedByApartments: string[]; // Apartments that owe their share
  perApartmentShare: number; // Amount each owing apartment owes
  categoryId: string; // Category reference
  receipt?: string; // Receipt image (data URI)
  paidByApartments?: string[]; // Apartments that have paid back
  paid?: boolean;
};
```

**Expense Splitting Logic**:

1. Total amount divided by the total number of active apartments (or filtered by category rules)
2. Paying apartment excluded from owing calculation
3. Real-time balance tracking through denormalized balance sheets

### 5. Payments Collection (`payments`)

**Purpose**: Payment tracking, approvals, and financial ledger

```typescript
type Payment = {
  id: string; // Payment identifier
  payerId: string; // User who made payment
  payeeId: string; // User receiving payment
  apartmentId?: string; // Associated apartment
  category?: 'income' | 'expense'; // Payment direction
  amount: number; // Payment amount
  expenseId?: string; // Linked expense (if applicable)
  status: PaymentStatus; // Payment state
  createdAt: string; // Creation timestamp
  approvedBy?: string; // Admin who approved
  approvedByName?: string; // Admin name
  receiptURL?: string; // Receipt file URL
  monthYear: string; // Format: YYYY-MM
  reason?: string; // Payment description
};

type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'cancelled';
```

### 6. Balance Sheets Collection (`balanceSheets`)

**Purpose**: Denormalized monthly financial summaries per apartment

```typescript
type BalanceSheet = {
  apartmentId: string; // Apartment reference
  monthYear: string; // Format: YYYY-MM
  openingBalance: number; // Starting balance
  totalIncome: number; // Income from payments received
  totalExpenses: number; // Expenses owed/paid
  closingBalance: number; // Calculated: opening + income - expenses
};
```

**Document ID Pattern**: `{apartmentId}_{monthYear}` (e.g., `T1_2024-08`)

### 7. Notifications Collection (`notifications`)

**Purpose**: System notifications, announcements, and payment alerts

```typescript
type Notification = {
  id: string; // Notification ID
  type: NotificationType; // Notification category
  title: string; // Notification title
  message: string; // Notification content
  amount?: number; // Associated amount
  currency?: string; // Currency symbol
  fromApartmentId?: string; // Source apartment
  toApartmentId?: string | string[]; // Target apartment(s)
  relatedExpenseId?: string; // Linked expense

  // Announcement-specific fields
  createdBy?: string; // Admin creator
  isActive?: boolean; // Active status
  priority?: 'low' | 'medium' | 'high'; // Priority level
  expiresAt?: string; // Expiration date

  // Status fields
  isRead: boolean | { [apartmentId: string]: boolean }; // Read status
  isDismissed?: boolean; // Dismissed flag
  createdAt: string; // Creation timestamp
  dueDate?: string; // Due date
  status?: PaymentStatus; // Payment status
  paymentMethod?: PaymentMethodType; // Payment method
  transactionId?: string; // Transaction reference
  category?: string; // Category
  requestedBy?: string; // Requester
  paidAt?: string; // Payment timestamp
};

type NotificationType =
  | 'payment_request'
  | 'payment_received'
  | 'payment_confirmed'
  | 'reminder'
  | 'announcement'
  | 'poll';
```

### 8. Polls Collection (`polls`)

**Purpose**: Community voting and decision-making system

```typescript
type Poll = {
  id: string; // Poll identifier
  question: string; // Poll question
  options: PollOption[]; // Available choices
  createdBy: string; // Admin creator
  createdAt: string; // Creation timestamp
  expiresAt?: string; // Optional expiration
  votes: { [apartmentId: string]: string }; // apartmentId -> optionId
  isActive: boolean; // Active status
};

type PollOption = {
  id: string; // Option identifier
  text: string; // Option description
};
```

### 9. Faults Collection (`faults`)

**Purpose**: Maintenance fault reporting and tracking

```typescript
type Fault = {
  id: string; // Fault identifier
  images: string[]; // Fault images (URLs/base64)
  location: string; // Fault location
  description: string; // Fault description
  reportedBy: string; // Reporter user ID
  reportedAt: string; // Report timestamp
  severity: FaultSeverity; // Priority level
  status: FaultStatus; // Current status
  assignedTo?: string; // Assigned user ID
  estimatedCost?: number; // Cost estimate
  actualCost?: number; // Actual cost
  priority: number; // 1-5 priority scale
  fixed: boolean; // Legacy compatibility field
  fixedAt?: string; // Fix timestamp
  resolvedAt?: string; // Resolution timestamp
  notes?: string; // Additional notes
  updatedAt?: string; // Last update timestamp
};

type FaultSeverity = 'critical' | 'warning' | 'low';
type FaultStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
```

### 10. File Metadata Collection (`fileMetadata`)

**Purpose**: File upload tracking and storage management

```typescript
type FileMetadata = {
  id: string; // File identifier
  originalName: string; // Original filename
  fileName: string; // Stored filename with timestamp
  storagePath: string; // Full storage path
  downloadURL: string; // Public download URL
  fileSize: number; // File size in bytes
  mimeType: string; // File MIME type
  uploadedBy: string; // Uploader user ID
  uploadedAt: string; // Upload timestamp
  category: FileCategory; // File category
  relatedId?: string; // Related entity ID
  apartmentId?: string; // Associated apartment
};

type FileCategory = 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance';
```

### 11. Maintenance Tasks Collection (`maintenanceTasks`)

**Purpose**: Maintenance scheduling and task management

```typescript
type MaintenanceTask = {
  id: string; // Task identifier
  title: string; // Task title
  description?: string; // Task description
  category: string; // Task category
  vendorId?: string; // Assigned vendor
  scheduledDate: string; // Planned date
  dueDate?: string; // Due date (if different)
  completedDate?: string; // Completion date
  skippedDate?: string; // Skip date
  status: MaintenanceTaskStatus; // Current status
  costEstimate?: number; // Estimated cost
  actualCost?: number; // Actual cost
  attachments?: string[]; // File attachments
  notes?: string; // Task notes
  recurrence?: RecurrenceType; // Recurrence pattern
  createdBy: string; // Creator user ID
  createdAt: string; // Creation timestamp
  updatedAt?: string; // Update timestamp
};

type MaintenanceTaskStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'skipped';
type RecurrenceType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
```

### 12. Vendors Collection (`vendors`)

**Purpose**: Service provider directory and management

```typescript
type Vendor = {
  id: string; // Vendor identifier
  name: string; // Vendor name
  serviceType: string; // Service category
  phone?: string; // Contact phone
  email?: string; // Contact email
  address?: string; // Vendor address
  rating?: number; // 1-5 rating
  notes?: string; // Additional notes
  isActive: boolean; // Active status
  lastUsedAt?: string; // Last usage timestamp
  createdAt: string; // Creation timestamp
  updatedAt?: string; // Update timestamp
};
```

### 13. Maintenance Budgets Collection (`maintenanceBudgets`)

**Purpose**: Annual maintenance budget tracking

```typescript
type MaintenanceBudget = {
  id: string; // Budget identifier
  year: number; // Budget year
  totalBudget: number; // Annual allocated amount
  allocatedByCategory: { [category: string]: number }; // Planned allocation
  spentByCategory: { [category: string]: number }; // Actual spending
  totalSpent: number; // Total spent (denormalized)
  createdAt: string; // Creation timestamp
  updatedAt?: string; // Update timestamp
};
```

## Indexes Configuration

The application uses composite indexes for optimal query performance:

### File Operations Indexes

```json
{
  "collectionGroup": "fileMetadata",
  "fields": [
    { "fieldPath": "category", "order": "ASC" },
    { "fieldPath": "uploadedAt", "order": "DESC" }
  ]
}
```

### Financial Indexes

```json
{
  "collectionGroup": "payments",
  "fields": [
    { "fieldPath": "monthYear", "order": "ASC" },
    { "fieldPath": "category", "order": "ASC" },
    { "fieldPath": "apartmentId", "order": "ASC" }
  ]
}
```

### Expense Tracking Indexes

```json
{
  "collectionGroup": "expenses",
  "fields": [
    { "fieldPath": "owedByApartments", "arrayConfig": "CONTAINS" },
    { "fieldPath": "date", "order": "DESC" }
  ]
}
```

### Maintenance Indexes

```json
{
  "collectionGroup": "maintenanceTasks",
  "fields": [
    { "fieldPath": "status", "order": "ASC" },
    { "fieldPath": "scheduledDate", "order": "ASC" }
  ]
}
```

## Data Access Layer

### Primary Access File: `src/lib/firestore.ts`

The main data access layer provides over 60 functions organized by collection:

#### Apartment Operations

- `getApartments()` - Fetch all apartments
- `subscribeToApartments()` - Real-time apartment updates

#### User Management

- `getUsers(apartment?)` - Fetch users (optionally filtered)
- `getUserByEmail(email)` - Find user by email
- `addUser()`, `updateUser()`, `deleteUser()` - CRUD operations
- `approveUser()` - Admin approval workflow
- `subscribeToUsers()` - Real-time user updates

#### Category Operations

- `getCategories()` - Fetch all categories
- `addCategory()`, `updateCategory()`, `deleteCategory()` - CRUD operations
- `subscribeToCategories()` - Real-time category updates

#### Expense Management

- `getExpenses(apartment?)` - Server-side filtered expense retrieval
- `addExpense()` - Create expense with automatic balance sheet updates
- `updateExpense()` - Update expense with delta recalculation
- `deleteExpense()` - Remove expense and adjust balances
- `subscribeToRelevantExpenses()` - Efficient real-time updates for specific apartments

#### Payment Processing

- `getPayments()`, `addPayment()`, `updatePayment()`, `deletePayment()`
- `generatePaymentEvents()` - Automatic monthly payment generation
- `subscribeToPayments()` - Real-time payment tracking

#### Balance Sheet Management

- `getBalanceSheets()` - Retrieve financial summaries
- `addBalanceSheet()`, `updateBalanceSheet()` - Balance operations
- `subscribeToBalanceSheets()` - Real-time balance updates

#### Community Features

- `getPolls()`, `addPoll()`, `voteOnPoll()`, `closePoll()`, `deletePoll()`
- `getActiveAnnouncements()`, `deleteAnnouncement()`
- `listenToActiveAnnouncements()` - Real-time announcements

#### Maintenance System

- `getMaintenanceTasks()` - Flexible task retrieval with status filtering
- `getUpcomingMaintenanceTasks()` - Optimized dashboard queries
- `getCompletedMaintenanceTasks()` - Paginated completed tasks
- `addMaintenanceTask()`, `updateMaintenanceTask()`, `deleteMaintenanceTask()`
- `applyTaskCostToBudget()` - Budget integration

#### Vendor Management

- `getVendors()`, `addVendor()`, `updateVendor()`, `deleteVendor()`
- `subscribeToVendors()` - Real-time vendor updates

#### File Operations

- `getFileMetadata()`, `addFileMetadata()`, `updateFileMetadata()`, `deleteFileMetadata()`
- `getFileMetadataByCategory()`, `getFileMetadataByAge()` - Filtered retrieval
- `subscribeToFileMetadata()` - Real-time file tracking

### Server-Side Operations: `src/lib/firestore-admin.ts`

Provides admin-level database operations using Firebase Admin SDK:

- `testFirestoreConnection()` - Health check function
- Enhanced security for admin operations
- Server-side data validation and processing

## Client-Side Operations

### Real-time Subscriptions

The application extensively uses Firestore's real-time capabilities:

```typescript
// Example: Real-time expense tracking
export const subscribeToRelevantExpenses = (
  callback: (expenses: Expense[]) => void,
  apartment: string
) => {
  // Two server-side queries merged client-side
  const paidByQuery = query(collection(db, 'expenses'), where('paidByApartment', '==', apartment));
  const owedByQuery = query(
    collection(db, 'expenses'),
    where('owedByApartments', 'array-contains', apartment)
  );

  // Merge results from both listeners
  // Return combined unsubscribe function
};
```

### Query Optimization

- Server-side filtering reduces client-side data processing
- Composite indexes for complex queries
- Pagination for large datasets (maintenance tasks, payments)
- Selective field fetching where applicable

## Server-Side Operations

### Firebase Admin SDK Configuration

```typescript
// Supports multiple credential sources
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // ... other fields
};

// Graceful initialization with build-time detection
const adminApp = initializeApp({
  credential: cert(serviceAccount),
});
```

### Environment Variable Support

- Individual credentials: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- JSON configuration: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Build-time detection for static generation

## Security Rules

**Note**: The security rules are defined in `firebase/firestore.rules` and should include:

1. **User Authentication**: All operations require authenticated users
2. **Role-based Access**: Admin operations restricted to admin users
3. **Data Ownership**: Users can only modify their own data
4. **Apartment Isolation**: Users see only relevant apartment data
5. **Read/Write Permissions**: Granular permissions per collection

## Performance Optimizations

### 1. Denormalized Balance Sheets

Instead of calculating balances on-demand, the system maintains pre-computed balance sheets:

```typescript
// Automatic balance updates on expense changes
export const computeExpenseDeltas = (expense: Expense) => {
  // Calculate impact on each apartment's balance
  // Apply deltas to balance sheet documents
};
```

### 2. Efficient Querying

- **Server-side Filtering**: Reduce client-side data processing
- **Composite Indexes**: Support complex multi-field queries
- **Array-contains Queries**: Efficient apartment-based filtering
- **Pagination**: Limit large result sets

### 3. Real-time Optimizations

- **Selective Subscriptions**: Only subscribe to relevant data
- **Client-side Merging**: Combine multiple server queries
- **Unsubscribe Management**: Proper cleanup to prevent memory leaks

### 4. Caching Strategy

- **React Context**: Global state for frequently accessed data
- **React Query**: Client-side data fetching and caching
- **Conditional Real-time**: Only use `onSnapshot` when necessary

### 5. Write Optimization

- **Batch Operations**: Group related writes
- **Transaction Safety**: Ensure consistency for critical operations
- **Delta Calculations**: Minimize balance sheet update overhead

## Best Practices

### 1. Data Modeling

- **Denormalization**: Balance between normalization and query performance
- **Consistent Naming**: Use clear, descriptive field names
- **Type Safety**: Leverage TypeScript for schema validation

### 2. Query Design

- **Index-aware Queries**: Design queries that utilize existing indexes
- **Limit Result Sets**: Always use appropriate limits
- **Field Selection**: Fetch only required fields when possible

### 3. Real-time Usage

- **Selective Subscriptions**: Only subscribe to data that needs real-time updates
- **Proper Cleanup**: Always unsubscribe from listeners
- **Error Handling**: Graceful degradation for connection issues

### 4. Security

- **Input Validation**: Validate all data before writes
- **Authorization Checks**: Verify user permissions
- **Sensitive Data**: Never store sensitive information in client-accessible documents

### 5. Maintenance

- **Index Monitoring**: Monitor index usage and performance
- **Data Cleanup**: Implement retention policies for old data
- **Backup Strategy**: Regular database backups and recovery procedures

---

## Related Documentation

- [Data Models & Types](../tutorial/07_data_models___types_.md) - TypeScript type definitions
- [API Reference](../api/API_REFERENCE.md) - API endpoint documentation
- [Firebase Storage Implementation](../implementation/FIREBASE_STORAGE_IMPLEMENTATION_SUMMARY.md) - File storage system
- [Enhanced Storage Testing](../testing/ENHANCED_STORAGE_TESTING.md) - Database testing strategies

---

_This documentation is maintained as part of the Apargo development documentation. For updates or questions, refer to the main README or contact the development team._
