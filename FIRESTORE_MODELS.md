# Firestore Data Models Documentation

This document explains the Firestore data models used in the Apargo project, their structure, and how they relate to each other.

## Table of Contents

- [Overview](#overview)
- [Core Models](#core-models)
- [Data Collections](#data-collections)
- [Model Relationships Diagram](#model-relationships-diagram)
- [Detailed Model Descriptions](#detailed-model-descriptions)
- [Enumerations & Union Types](#enumerations--union-types)
- [File Storage Models](#file-storage-models)
- [Query Patterns](#query-patterns)

---

## Overview

Apargo is a property management application that uses **Firestore** (Google Cloud's NoSQL database) to store and manage apartment-related data. The system is built around the concept of **apartments** with **members** (users) who share **expenses**, make **payments**, and manage **maintenance**.

### Key Principles

- **Apartment-centric**: All data revolves around apartments and their members
- **No enforced foreign keys**: Relationships are maintained through string IDs (apartment IDs, user IDs, category IDs, etc.)
- **Type-safe**: Models are defined as TypeScript types in `src/lib/core/types.ts`
- **Real-time capable**: Most collections support real-time listeners (subscriptions)
- **Audit-friendly**: Most documents include `createdAt` and `updatedAt` timestamps

---

## Core Models

### 1. **Apartment**

The primary entity representing a shared living space (house, flat, etc.).

```typescript
type Apartment = {
  id: string; // Firestore doc ID
  name: string; // Apartment name/address
  members: string[]; // Array of User IDs
};
```

**Relationships:**

- ✅ `members` → References multiple `User` documents
- ✅ Referenced by: Expenses, Payments, BalanceSheets, Notifications, MaintenanceTasks, MaintenanceBudgets

**Collection Path:** `apartments/{apartmentId}`

---

### 2. **User**

Represents a member of an apartment with authentication and system roles.

```typescript
type User = {
  id: string;
  name: string;
  avatar?: string; // URL or data URI
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'incharge'; // System-level permissions
  propertyRole?: 'tenant' | 'owner'; // Property relationship
  fcmToken?: string; // Firebase Cloud Messaging token for push notifications
  apartment: string; // Associated Apartment ID (required)
  isApproved?: boolean; // Admin approval status (default: false)
  isSuspended?: boolean; // Account suspension status
};
```

**Relationships:**

- ✅ `apartment` → References single `Apartment` document
- ✅ Referenced by: Expenses (paidByApartment, owedByApartments), Payments (payerId, payeeId), all audit fields (createdBy, reportedBy, etc.)

**Collection Path:** `apartments/{apartmentId}/users/{userId}`

**Key Roles:**

- `admin`: Full system access
- `incharge`: Elevated permissions for apartment management
- `user`: Standard permissions

---

### 3. **Category**

Defines expense categories and can be configured as automatic payment events.

```typescript
type Category = {
  id: string;
  name: string; // e.g., 'Maintenance', 'Utilities'
  icon: string; // Icon identifier/emoji
  noSplit?: boolean; // If true, expenses aren't split among apartments
  // Payment Event Configuration
  isPaymentEvent?: boolean; // Marks this as auto-payment generator
  monthlyAmount?: number; // Monthly fee amount
  dayOfMonth?: number; // Day to generate (1-28, default: 1)
  autoGenerate?: boolean; // Enable/disable automatic generation
};
```

**Relationships:**

- ✅ Referenced by: Expenses (categoryId), Payments (category field)

**Collection Path:** `apartments/{apartmentId}/categories/{categoryId}`

**Special Feature:** When `isPaymentEvent=true`, the system automatically generates `Payment` records on the specified day.

---

### 4. **Expense**

Represents a shared expense between apartments.

```typescript
type Expense = {
  id: string;
  description: string;
  amount: number; // Total expense amount
  date: string; // ISO date string
  paidByApartment: string; // Apartment ID that paid
  owedByApartments: string[]; // Apartment IDs that owe a share
  perApartmentShare: number; // Amount each owing apartment owes
  categoryId: string; // Category ID
  receipt?: string; // Data URI for receipt image
  paidByApartments?: string[]; // Apartments that have paid their share back
  paid?: boolean; // Completion flag
};
```

**Relationships:**

- ✅ `paidByApartment` → References `Apartment`
- ✅ `owedByApartments` → References array of `Apartment` IDs
- ✅ `categoryId` → References `Category`
- ✅ Referenced by: Payments (expenseId), Notifications (relatedExpenseId), BalanceSheets

**Collection Path:** `apartments/{apartmentId}/expenses/{expenseId}`

**Workflow:**

1. Apartment A pays full expense (paidByApartment = A)
2. Other apartments owe shares (owedByApartments = [B, C])
3. When other apartments pay back, their IDs are added to `paidByApartments`
4. When all have paid, `paid` becomes true

---

### 5. **Payment**

Represents money transferred between apartments or payment of an expense share.

```typescript
type Payment = {
  id: string;
  payerId: string; // User ID who paid
  payeeId: string; // User ID to receive payment
  apartmentId?: string; // Associated Apartment ID
  category?: 'income' | 'expense'; // Income (received) or Expense (spent)
  amount: number;
  expenseId?: string; // Linked Expense (optional)
  status: PaymentStatus; // pending | approved | rejected | paid | failed | cancelled
  createdAt: string; // ISO date string
  approvedBy?: string; // Admin User ID who approved
  approvedByName?: string; // Admin name (cached)
  receiptURL?: string; // Uploaded receipt URL
  monthYear: string; // Format: YYYY-MM (for grouping)
  reason?: string; // Optional reason description
};
```

**Relationships:**

- ✅ `payerId` → References `User`
- ✅ `payeeId` → References `User`
- ✅ `apartmentId` → References `Apartment` (optional)
- ✅ `expenseId` → References `Expense` (optional)
- ✅ `approvedBy` → References `User` (optional)

**Collection Path:** `apartments/{apartmentId}/payments/{paymentId}`

**Status Lifecycle:**

- **pending** → Created but awaiting approval
- **approved** → Approved by admin, ready to mark as paid
- **paid** → Marked as completed
- **rejected** → Declined by admin
- **failed** / **cancelled** → Failed or cancelled payment

---

### 6. **BalanceSheet**

Monthly summary of financial activity for an apartment.

```typescript
type BalanceSheet = {
  apartmentId: string;
  monthYear: string; // Format: YYYY-MM
  openingBalance: number; // Balance at month start
  totalIncome: number; // Total money received
  totalExpenses: number; // Total money spent
  closingBalance: number; // Balance at month end
};
```

**Relationships:**

- ✅ `apartmentId` → References `Apartment`
- ✅ Calculated from: Expenses, Payments

**Collection Path:** `apartments/{apartmentId}/balanceSheets/{balanceSheetId}`

**Calculation:**

```
closingBalance = openingBalance + totalIncome - totalExpenses
```

---

## Notification Models

Notifications use a **discriminated union** pattern with different structures for different notification types.

### Base Notification (Common Fields)

```typescript
interface BaseNotification {
  id: string;
  type: NotificationType; // 'payment_request' | 'payment_received' | ...
  title: string;
  message: string;
  createdAt: string; // ISO date string
  isRead?: boolean | { [apartmentId: string]: boolean };
  dueDate?: string;
  amount?: number;
  currency?: string;
}
```

---

### 7. **Payment Notification** (Discriminated Type)

For payment-related events.

```typescript
interface PaymentNotification extends BaseNotification {
  type: 'payment_request' | 'payment_received' | 'payment_confirmed';
  amount: number;
  currency?: string;
  fromApartmentId: string;
  toApartmentId: string | string[];
  relatedExpenseId?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  transactionId?: string;
  category?: string;
  requestedBy?: string; // User ID
  paidAt?: string; // ISO date
}
```

**Collection Path:** `apartments/{apartmentId}/notifications/{notificationId}`

---

### 8. **Announcement Notification** (Discriminated Type)

For admin announcements to apartments.

```typescript
interface AnnouncementNotification extends BaseNotification {
  type: 'announcement';
  createdBy: string; // Admin User ID (required)
  isActive: boolean; // Required for announcements
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string; // ISO date
  toApartmentId: string | string[];
  isRead: { [apartmentId: string]: boolean }; // Object mapping (required for announcements)
  isDismissed?: boolean;
}
```

**Collection Path:** `apartments/{apartmentId}/notifications/{notificationId}`

---

### 9. **Poll Notification** (Discriminated Type)

For community polls.

```typescript
interface PollNotification extends BaseNotification {
  type: 'poll';
  relatedExpenseId?: string;
  fromApartmentId?: string;
  toApartmentId?: string | string[];
}
```

---

### 10. **Reminder Notification** (Discriminated Type)

For payment reminders.

```typescript
interface ReminderNotification extends BaseNotification {
  type: 'reminder';
  dueDate?: string;
  relatedExpenseId?: string;
  fromApartmentId?: string;
  toApartmentId?: string | string[];
  amount?: number;
  currency?: string;
}
```

---

### 11. **Poll**

Community voting/polling feature.

```typescript
type Poll = {
  id: string;
  question: string;
  options: PollOption[]; // Array of { id, text }
  createdBy: string; // Admin User ID
  createdAt: string; // ISO date
  expiresAt?: string; // ISO date (optional expiration)
  votes: { [apartmentId: string]: string }; // apartmentId -> selected optionId
  isActive: boolean;
};

type PollOption = {
  id: string;
  text: string;
};
```

**Relationships:**

- ✅ `createdBy` → References `User`
- ✅ `votes` → Maps Apartment IDs to option selections

**Collection Path:** `apartments/{apartmentId}/polls/{pollId}`

---

## Fault Management Models

### 12. **Fault**

Reports and tracking of building faults/maintenance issues.

```typescript
type Fault = {
  id: string;
  images: string[]; // URLs or base64 encoded
  location: string; // Where the fault is located
  description: string; // Fault details
  reportedBy: string; // User ID who reported
  reportedAt: string; // ISO date string
  severity: FaultSeverity; // 'critical' | 'warning' | 'low'
  status: FaultStatus; // 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string; // User ID assigned to fix (optional)
  estimatedCost?: number;
  actualCost?: number;
  priority: number; // 1-5 scale
  fixed: boolean; // Legacy field (backward compatibility)
  fixedAt?: string; // ISO date when marked fixed
  resolvedAt?: string; // ISO date when resolved
  notes?: string; // Updates/progress notes
  updatedAt?: string; // ISO date of last update
};
```

**Relationships:**

- ✅ `reportedBy` → References `User`
- ✅ `assignedTo` → References `User` (optional)
- ✅ `images` → Can reference `FileMetadata` or be direct URLs

**Collection Path:** `apartments/{apartmentId}/faults/{faultId}`

**Status Workflow:**

```
open → in_progress → resolved → closed
              ↓
             (fixed/fixedAt timestamps)
```

---

### 13. **Announcement**

Admin announcements (legacy, use AnnouncementNotification instead).

```typescript
type Announcement = {
  id: string;
  title: string;
  message: string;
  createdBy: string; // Admin User ID
  createdAt: string; // ISO date
  expiresAt?: string; // ISO date
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
};
```

**Collection Path:** `announcements/{announcementId}` (global collection)

---

## Maintenance Management Models

### 14. **Vendor**

Third-party service providers for maintenance.

```typescript
type Vendor = {
  id: string;
  name: string;
  serviceType: string; // e.g., 'elevator', 'plumbing', 'electrical'
  phone?: string;
  email?: string;
  address?: string;
  rating?: number; // 1-5 star rating
  notes?: string;
  isActive: boolean; // Can be deactivated
  lastUsedAt?: string; // ISO date of last usage
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};
```

**Relationships:**

- ✅ Referenced by: MaintenanceTask (vendorId)

**Collection Path:** `apartments/{apartmentId}/vendors/{vendorId}`

---

### 15. **MaintenanceTask**

Scheduled maintenance work.

```typescript
type MaintenanceTask = {
  id: string;
  title: string;
  description?: string;
  category: string; // 'elevator', 'water_tank', 'generator', 'common_area', 'other'
  vendorId?: string; // Linked Vendor ID (optional)
  scheduledDate: string; // ISO date (planned date)
  dueDate?: string; // Optional due date if different
  completedDate?: string; // ISO date when completed
  skippedDate?: string; // ISO date if skipped
  status: MaintenanceTaskStatus; // 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' | 'skipped'
  costEstimate?: number;
  actualCost?: number;
  attachments?: string[]; // File metadata IDs or storage URLs
  notes?: string;
  recurrence?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
  createdBy: string; // User ID who created
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};
```

**Relationships:**

- ✅ `vendorId` → References `Vendor` (optional)
- ✅ `attachments` → Can reference `FileMetadata`
- ✅ `createdBy` → References `User`

**Collection Path:** `apartments/{apartmentId}/maintenanceTasks/{taskId}`

**Recurrence Pattern:** Recurring tasks can be automatically regenerated based on the `recurrence` field.

---

### 16. **MaintenanceBudget**

Annual budget allocation for maintenance.

```typescript
type MaintenanceBudget = {
  id: string;
  year: number; // Budget year (e.g., 2024)
  totalBudget: number; // Annual allocated amount
  allocatedByCategory: { [category: string]: number }; // Planned allocation per category
  spentByCategory: { [category: string]: number }; // Actual spent per category
  totalSpent: number; // Derived: sum of spentByCategory
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};
```

**Relationships:**

- ✅ Calculated from: MaintenanceTask actualCost values

**Collection Path:** `apartments/{apartmentId}/maintenanceBudgets/{budgetId}`

---

## File Storage Models

### 17. **FileMetadata**

Metadata for files stored in Firebase Storage.

```typescript
type FileMetadata = {
  id: string;
  originalName: string; // Original filename from upload
  fileName: string; // Stored filename with timestamp
  storagePath: string; // Full path in Firebase Storage
  downloadURL: string; // Public download URL
  fileSize: number; // in bytes
  mimeType: string;
  uploadedBy: string; // User ID
  uploadedAt: string; // ISO date string
  category: 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance';
  relatedId?: string; // Related document ID (expense/fault/user)
  apartmentId?: string; // Associated apartment
};
```

**Relationships:**

- ✅ `uploadedBy` → References `User`
- ✅ `apartmentId` → References `Apartment` (optional)
- ✅ `relatedId` → References document by category (Expense, Fault, User, etc.)

**Collection Path:** `apartments/{apartmentId}/fileMetadata/{fileId}`

**File Categories:**

- **receipt**: Expense receipts
- **fault**: Fault/maintenance images
- **avatar**: User profile pictures
- **announcement**: Announcement media
- **maintenance**: Maintenance task attachments

---

### 18. **Storage Configuration Types**

```typescript
type FileValidationResult = {
  isValid: boolean;
  error?: string;
  warnings?: string[];
};

type FileUploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  fileName: string;
};

type StorageStats = {
  totalFiles: number;
  totalSize: number; // in bytes
  categoryCounts: { [category: string]: number };
  oldFileCount: number; // files older than 3 months
  oldFileSize: number; // total size of old files in bytes
};

type StorageConfig = {
  maxFileSize: number; // e.g., 2MB in bytes
  allowedMimeTypes: string[];
  bucket: string;
  baseUploadPath: string;
};
```

---

## Model Relationships Diagram

```
┌─────────────────────────────────────────────────────┐
│              APARTMENT (Root Entity)                 │
│  - id, name, members[]                              │
└────────┬──────────────────────────────────────────┬─┘
         │                                          │
         ├─────────────────┬─────────────────┐      │
         │                 │                 │      │
    ┌────▼────┐    ┌───────▼────────┐   ┌──▼──┐    │
    │  USER    │    │   CATEGORY     │   │FILE │    │
    │  (member)│    │ (for expenses) │   │META │    │
    └────┬─────┘    └────┬───────────┘   └──┬──┘    │
         │                │                  │      │
         │                ├─ isPaymentEvent │      │
         │                │ └─ auto-generates      │
         │                │    PAYMENT monthly    │
         │                │                       │
         │  ┌──────────────▼──────────────┐        │
         │  │      EXPENSE                │        │
         │  │ - paidByApartment (ref)     │        │
         │  │ - owedByApartments[] (refs) │        │
         │  │ - categoryId (ref)          │        │
         │  │ - receipt (FileMetadata)    │        │
         │  └──────────────┬──────────────┘        │
         │                 │                       │
         │                 │ ┌─ expenseId ────┐   │
         │  ┌──────────────▼──────────────┐   │   │
         │  │      PAYMENT                │   │   │
         │  │ - payerId → USER            │   │   │
         │  │ - payeeId → USER            │   │   │
         │  │ - expenseId (optional) ─────┘   │   │
         │  │ - receiptURL (FileMetadata)     │   │
         │  └──────────────┬──────────────┘   │   │
         │                 │                       │
         │                 └── Monthly aggregation  │
         │                                          │
         │  ┌──────────────────────────────┐       │
         │  │   BALANCE SHEET              │       │
         │  │ - apartmentId (ref)          │       │
         │  │ - monthYear (YYYY-MM)        │       │
         │  │ - openingBalance             │       │
         │  │ - totalIncome (from Payments)│       │
         │  │ - totalExpenses (from Exp)   │       │
         │  │ - closingBalance             │       │
         │  └──────────────────────────────┘       │
         │                                          │
    ┌────▼────────────────────────────────────┐    │
    │    NOTIFICATIONS (Discriminated)         │    │
    │  - PaymentNotification                  │    │
    │  - AnnouncementNotification (by User)   │    │
    │  - PollNotification                     │    │
    │  - ReminderNotification                 │    │
    └─────────────────┬──────────────────────┘    │
                      │                            │
    ┌─────────────────┴──────────────────┐        │
    │                                    │        │
┌───▼───────┐              ┌────────────▼──┐     │
│   POLL    │              │ ANNOUNCEMENT   │     │
│ - options │              │ (legacy)       │     │
│ - votes   │              └────────────────┘     │
└───────────┘                                     │
                                                  │
    ┌───────────────────────────────────────┐    │
    │    FAULT MANAGEMENT                   │    │
    │                                       │    │
    │  ┌──────────────────────────────┐    │    │
    │  │  FAULT                       │    │    │
    │  │ - reportedBy → USER          │    │    │
    │  │ - assignedTo → USER          │    │    │
    │  │ - images[] (FileMetadata)    │    │    │
    │  │ - status (workflow)          │    │    │
    │  └──────────────────────────────┘    │    │
    │                                       │    │
    └───────────────────────────────────────┘    │
                                                  │
    ┌───────────────────────────────────────┐    │
    │    MAINTENANCE MANAGEMENT             │    │
    │                                       │    │
    │  ┌──────────────────────────────┐    │    │
    │  │  VENDOR                      │    │    │
    │  │ - name, serviceType          │    │    │
    │  │ - rating, isActive           │    │    │
    │  └──────────────┬───────────────┘    │    │
    │                 │                     │    │
    │     ┌───────────┴──────────────┐     │    │
    │     │                          │     │    │
    │  ┌──▼────────────────────┐     │     │    │
    │  │ MAINTENANCE TASK      │     │     │    │
    │  │ - vendorId ───────────┘     │     │    │
    │  │ - category, status          │     │    │
    │  │ - scheduledDate, dueDate    │     │    │
    │  │ - recurrence                │     │    │
    │  │ - attachments (FileMetadata)│     │    │
    │  └──┬───────────────────────┬──┘     │    │
    │     │                       │        │    │
    │  ┌──▼──────────────────────▼──┐     │    │
    │  │ MAINTENANCE BUDGET         │     │    │
    │  │ - year, totalBudget        │     │    │
    │  │ - allocatedByCategory      │     │    │
    │  │ - spentByCategory (sum)    │     │    │
    │  └──────────────────────────┘     │    │
    │                                     │    │
    └───────────────────────────────────────┘    │
                                                  │
                                       └──────────┘
```

---

## Enumerations & Union Types

### PaymentStatus

```typescript
type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'cancelled';
```

**Workflow:** `pending` → `approved` → `paid` (alternative: `rejected`)

---

### NotificationType

```typescript
type NotificationType =
  | 'payment_request' // When payment is requested
  | 'payment_received' // When payment is received
  | 'payment_confirmed' // When payment is confirmed by admin
  | 'reminder' // Payment due reminder
  | 'announcement' // Admin announcement
  | 'poll'; // Community poll
```

---

### PaymentMethodType

```typescript
type PaymentMethodType = 'googlepay' | 'phonepay' | 'upi' | 'card' | 'cash' | 'bank_transfer';
```

---

### FaultSeverity

```typescript
type FaultSeverity = 'critical' | 'warning' | 'low';
```

---

### FaultStatus

```typescript
type FaultStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
```

---

### MaintenanceTaskStatus

```typescript
type MaintenanceTaskStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'skipped';
```

---

### View (Application Routes)

```typescript
type View =
  | 'dashboard'
  | 'expense-analytics'
  | 'admin'
  | 'community'
  | 'faults'
  | 'ledger'
  | 'maintenance';
```

---

## Query Patterns

### Common Query Patterns by Collection

#### Apartments

```typescript
getApartments(); // Get all apartments user has access to
subscribeToApartments(); // Real-time listener
```

#### Users

```typescript
getUsers(apartmentId); // Get apartment members
getAllUsers(); // Get all system users
getUser(userId); // Get specific user
getUserByEmail(email); // Look up by email
subscribeToUsers(); // Real-time listener
```

#### Categories

```typescript
getCategories(apartmentId);
subscribeToCategories(apartmentId);
// PaymentEvent categories auto-generate payments monthly
```

#### Expenses

```typescript
getExpenses(apartmentId); // All expenses
subscribeToExpenses(apartmentId); // Real-time
subscribeToRelevantExpenses(apartmentId); // Filter by ownership/liability

// Expense queries are typically grouped by:
// - Date range
// - Category
// - paidByApartment vs owedByApartments
```

#### Payments

```typescript
getPayments(apartmentId);
subscribeToPayments(apartmentId);
generatePaymentEvents(categoryId, monthYear); // Auto-generates from PaymentEvent categories
generateAllPaymentEvents(monthYear); // Generate for all categories

// Payment queries typically filtered by:
// - Status (pending, approved, paid)
// - monthYear (for grouping)
// - payerId or payeeId
```

#### Balance Sheets

```typescript
getBalanceSheets(apartmentId);
subscribeToBalanceSheets(apartmentId);

// Calculations:
// totalIncome = sum of Payment records where category='income'
// totalExpenses = sum of Expense records + share-back payments
// closingBalance = openingBalance + totalIncome - totalExpenses
```

#### Notifications

```typescript
getActiveAnnouncements(apartmentId);
listenToActiveAnnouncements(apartmentId);
deleteAnnouncement(announcementId);

// Types are discriminated by 'type' field:
// - payment_*: Payment-related
// - announcement: Admin announcements
// - poll: Community polls
// - reminder: Due date reminders
```

#### Polls

```typescript
getPolls(apartmentId);
listenToPolls(apartmentId);
voteOnPoll(pollId, apartmentId, optionId);
getPollResults(pollId);
closePoll(pollId);

// Votes stored as:
// votes = { [apartmentId]: optionId }
```

#### Faults

```typescript
getFaults(apartmentId);
// Filters can be:
// - status (open, in_progress, resolved, closed)
// - severity (critical, warning, low)
// - assignedTo (User ID)
// - reportedAt (date range)
```

#### Maintenance

```typescript
// Tasks
getMaintenanceTasks(apartmentId);
getUpcomingMaintenanceTasks(apartmentId);
getCompletedMaintenanceTasks(apartmentId);
subscribeToMaintenanceTasks(apartmentId);

// Budgets
getMaintenanceBudget(apartmentId, year);
subscribeToMaintenanceBudget(apartmentId, year);

// Vendors
getVendors(apartmentId);
subscribeToVendors(apartmentId);
```

#### Files

```typescript
getFileMetadata(apartmentId, fileId);
getFileMetadataByCategory(apartmentId, category);
getFileMetadataByUploader(apartmentId, userId);
getFileMetadataByAge(apartmentId, daysOld);
subscribeToFileMetadata(apartmentId);
```

---

## Key Design Decisions

1. **Apartment as Root**: All collections (except global Announcements) are nested under apartments for multi-tenancy
2. **String IDs for Relationships**: Foreign keys are stored as string IDs, relationships managed in application logic
3. **Denormalization**: Some fields like `approvedByName`, `totalSpent` are denormalized for performance
4. **Timestamps**: `createdAt` and `updatedAt` on all models for audit trails
5. **Discriminated Unions**: Notifications use TypeScript discriminated unions for type safety
6. **Real-time Subscriptions**: Most models support real-time listeners via Firestore listeners
7. **Monthly Aggregation**: Payments and BalanceSheets use `YYYY-MM` format for grouping
8. **Recurrence Support**: MaintenanceTasks can be recurring (monthly, quarterly, etc.)
9. **File Metadata Separation**: Actual files in Cloud Storage, metadata in Firestore for querying

---

## Data Validation

- **TypeScript strict mode** ensures type safety at compile time
- **Firestore security rules** (if configured) validate at database level
- **Custom validation functions** in application logic
- **No Zod schemas used** - validation through TypeScript types

---

## Access Patterns

### By Apartment ID

- Almost all queries filtered by apartment (multi-tenancy)
- User permissions checked via custom claims in Firebase Auth

### By Date/Month

- Payments grouped by `monthYear` (YYYY-MM)
- Balance sheets calculated per month
- Expenses and tasks filtered by date ranges

### By Status

- Payments by status (pending, approved, paid)
- Faults by status (open, in_progress, resolved, closed)
- MaintenanceTasks by status (scheduled, in_progress, completed, etc.)

### By User/Apartment Reference

- Notifications by recipient apartment
- Faults by reportedBy/assignedTo user
- Payments by payerId/payeeId
- Files by uploadedBy user

---

## Summary

The Apargo Firestore schema is designed around **apartments as the central entity** with **modular, feature-specific collections** (expenses, payments, maintenance, faults, etc.). Each feature maintains its own collection with references to shared entities (Apartment, User, Category). The design emphasizes **real-time data synchronization**, **audit trails**, and **flexible querying** while keeping the database normalized where it matters most.
