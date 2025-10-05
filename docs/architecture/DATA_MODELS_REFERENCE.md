# Data Models Reference

## Overview

This document provides a comprehensive reference for all data models used in the Apargo application. All models are defined in TypeScript and stored in Firestore collections with corresponding client-side types.

## Core Data Models

### User Model

**Collection**: `users`  
**TypeScript Type**: `User`

```typescript
export type User = {
  id: string; // Unique user identifier
  name: string; // Display name
  avatar?: string; // Profile image URL (optional)
  email?: string; // Email address (optional)
  phone?: string; // Phone number (optional)
  role?: 'user' | 'admin' | 'incharge'; // System role for permissions
  propertyRole?: 'tenant' | 'owner'; // Property relationship role
  fcmToken?: string; // Firebase Cloud Messaging token
  apartment: string; // Associated apartment ID (required)
  isApproved?: boolean; // Admin approval status (default: false)
};
```

**Key Features**:

- Dual role system: `role` for system permissions, `propertyRole` for property relationship
- Optional approval workflow via `isApproved`
- FCM token integration for push notifications
- Required apartment association

### Apartment Model

**Collection**: `apartments`  
**TypeScript Type**: `Apartment`

```typescript
export type Apartment = {
  id: string; // Semantic apartment ID (e.g., "A1", "B2")
  name: string; // Display name (e.g., "Apartment A1")
  members: string[]; // Array of user IDs
};
```

### Category Model

**Collection**: `categories`  
**TypeScript Type**: `Category`

```typescript
export type Category = {
  id: string;
  name: string;
  icon: string;
  noSplit?: boolean; // Feature flag: skip expense splitting
  // Payment Event Configuration
  isPaymentEvent?: boolean; // Enable automatic payment generation
  monthlyAmount?: number; // Monthly fee amount
  dayOfMonth?: number; // Day of month to generate (1-28, default: 1)
  autoGenerate?: boolean; // Enable/disable automatic generation
};
```

**Key Features**:

- Expense splitting control via `noSplit`
- Payment event automation configuration
- Icon-based visual representation

### Expense Model

**Collection**: `expenses`  
**TypeScript Type**: `Expense`

```typescript
export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  paidByApartment: string; // Apartment ID that paid
  owedByApartments: string[]; // Apartments that owe a share
  perApartmentShare: number; // Amount each owing apartment owes
  categoryId: string; // Category reference
  receipt?: string; // Receipt image (data URI or URL)
  paidByApartments?: string[]; // Apartments that have paid back
  paid?: boolean;
};
```

### Payment Model

**Collection**: `payments`  
**TypeScript Type**: `Payment`

```typescript
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'cancelled';

export type Payment = {
  id: string;
  payerId: string; // User ID who paid
  payeeId: string; // User ID to receive payment
  apartmentId?: string; // Associated apartment
  category?: 'income' | 'expense'; // Payment direction
  amount: number;
  expenseId?: string; // Linked expense (optional)
  status: PaymentStatus;
  createdAt: string; // ISO date string
  approvedBy?: string; // Admin user ID
  approvedByName?: string; // Admin name for reference
  receiptURL?: string; // Uploaded receipt URL
  monthYear: string; // Format: YYYY-MM
  reason?: string; // Payment description
};
```

## Community Features

### Poll Model

**Collection**: `polls`  
**TypeScript Type**: `Poll`

```typescript
export type PollOption = {
  id: string;
  text: string;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional expiration date
  votes: { [apartmentId: string]: string }; // apartmentId -> optionId
  isActive: boolean;
};
```

### Announcement Model

**Collection**: `announcements`  
**TypeScript Type**: `Announcement`

```typescript
export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional expiration date
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
};
```

### Notification Model

**Collection**: `notifications`  
**TypeScript Type**: `Notification`

```typescript
export type NotificationType =
  | 'payment_request'
  | 'payment_received'
  | 'payment_confirmed'
  | 'reminder'
  | 'announcement'
  | 'poll';

export type PaymentMethodType =
  | 'googlepay'
  | 'phonepay'
  | 'upi'
  | 'card'
  | 'cash'
  | 'bank_transfer';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  fromApartmentId?: string;
  toApartmentId?: string | string[]; // Single or array for broadcasts
  relatedExpenseId?: string;
  // Announcement-specific fields
  createdBy?: string;
  isActive?: boolean;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  isRead: boolean | { [apartmentId: string]: boolean };
  isDismissed?: boolean;
  createdAt: string;
  dueDate?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  transactionId?: string;
  category?: string;
  requestedBy?: string;
  paidAt?: string;
};
```

## Fault Management

### Fault Model

**Collection**: `faults`  
**TypeScript Type**: `Fault`

```typescript
export type FaultSeverity = 'critical' | 'warning' | 'low';
export type FaultStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Fault = {
  id: string;
  images: string[]; // URLs or base64 encoded images
  location: string; // Detailed location description
  description: string;
  reportedBy: string; // User ID of reporter
  reportedAt: string; // ISO date string
  severity: FaultSeverity;
  status: FaultStatus;
  assignedTo?: string; // User ID of assigned person
  estimatedCost?: number; // Estimated repair cost
  actualCost?: number; // Actual repair cost
  priority: number; // 1-5 priority scale
  fixed: boolean; // Legacy field (backward compatibility)
  fixedAt?: string; // ISO date when marked as fixed
  resolvedAt?: string; // ISO date when resolved
  notes?: string; // Additional notes and updates
  updatedAt?: string; // Last update timestamp
};
```

## Maintenance System

### Vendor Model

**Collection**: `vendors`  
**TypeScript Type**: `Vendor`

```typescript
export type Vendor = {
  id: string;
  name: string;
  serviceType: string; // e.g., 'elevator', 'plumbing', 'electrical'
  phone?: string;
  email?: string;
  address?: string;
  rating?: number; // 1-5 star rating
  notes?: string;
  isActive: boolean;
  lastUsedAt?: string; // ISO date of last assignment
  createdAt: string;
  updatedAt?: string;
};
```

### Maintenance Task Model

**Collection**: `maintenanceTasks`  
**TypeScript Type**: `MaintenanceTask`

```typescript
export type MaintenanceTaskStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'skipped';

export type MaintenanceTask = {
  id: string;
  title: string;
  description?: string;
  category: string; // elevator, water_tank, generator, common_area, other
  vendorId?: string; // Linked vendor
  scheduledDate: string; // ISO date (planned date)
  dueDate?: string; // Optional due date if different
  completedDate?: string; // ISO date when completed
  skippedDate?: string; // ISO date when skipped
  status: MaintenanceTaskStatus;
  costEstimate?: number;
  actualCost?: number;
  attachments?: string[]; // File metadata IDs or storage URLs
  notes?: string;
  recurrence?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
  createdBy: string; // User ID
  createdAt: string;
  updatedAt?: string;
};
```

### Maintenance Budget Model

**Collection**: `maintenanceBudgets`  
**TypeScript Type**: `MaintenanceBudget`

```typescript
export type MaintenanceBudget = {
  id: string;
  year: number; // Budget year
  totalBudget: number; // Annual allocated amount
  allocatedByCategory: { [category: string]: number }; // Planned allocation
  spentByCategory: { [category: string]: number }; // Actual spent
  totalSpent: number; // Derived convenience field (denormalized)
  createdAt: string;
  updatedAt?: string;
};
```

## File Storage

### File Metadata Model

**Collection**: `fileMetadata`  
**TypeScript Type**: `FileMetadata`

```typescript
export type FileMetadata = {
  id: string;
  originalName: string; // Original filename
  fileName: string; // Stored filename with timestamp
  storagePath: string; // Full path in Firebase Storage
  downloadURL: string; // Public download URL
  fileSize: number; // Size in bytes
  mimeType: string; // MIME type
  uploadedBy: string; // User ID who uploaded
  uploadedAt: string; // ISO date string
  category: 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance';
  relatedId?: string; // Related entity ID
  apartmentId?: string; // Associated apartment
};
```

### Storage Configuration Types

```typescript
export type StorageConfig = {
  maxFileSize: number; // 2MB in bytes
  allowedMimeTypes: string[];
  bucket: string;
  baseUploadPath: string;
};

export type FileValidationResult = {
  isValid: boolean;
  error?: string;
  warnings?: string[];
};

export type FileUploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  fileName: string;
};

export type StorageStats = {
  totalFiles: number;
  totalSize: number; // in bytes
  categoryCounts: { [category: string]: number };
  oldFileCount: number; // files older than 3 months
  oldFileSize: number; // total size of old files
};
```

## Financial Models

### Balance Sheet Model

**Collection**: `balanceSheets`  
**TypeScript Type**: `BalanceSheet`

```typescript
export type BalanceSheet = {
  apartmentId: string;
  monthYear: string; // Format: YYYY-MM
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
};
```

## UI and Application Types

### View Type

```typescript
export type View =
  | 'dashboard'
  | 'expense-analytics'
  | 'admin'
  | 'community'
  | 'faults'
  | 'ledger'
  | 'maintenance';
```

## Data Patterns and Conventions

### Date Handling

- **ISO Strings**: All timestamps use ISO date strings (e.g., `2024-08-24T10:30:00.000Z`)
- **Date Only**: Scheduled dates use date-only format (e.g., `2024-08-24`)
- **Month-Year**: Financial periods use YYYY-MM format (e.g., `2024-08`)

### ID Patterns

- **Auto-generated**: Most collections use Firestore auto-generated document IDs
- **Semantic**: Apartments use human-readable IDs (A1, B2, etc.)
- **Composite**: Balance sheets use `{apartmentId}_{monthYear}` pattern

### Optional Fields

- Fields marked with `?` are optional and may not be present in all documents
- Use optional chaining (`?.`) when accessing optional fields in code
- Default values should be handled in application logic, not database

### Reference Patterns

- **User References**: Store user IDs as strings, resolve to full user objects in queries
- **Apartment References**: Use apartment ID strings for consistency
- **File References**: Link files via metadata IDs or direct storage URLs

### Status Enums

- Use union types for status fields to ensure type safety
- Common status patterns: pending → in_progress → completed
- Include transition validation in business logic

## Indexing Strategy

All collections should have appropriate indexes for common query patterns:

1. **Single-field indexes** on frequently queried fields (status, apartmentId, createdAt)
2. **Composite indexes** for complex queries (apartmentId + monthYear, status + scheduledDate)
3. **Array-contains indexes** for array fields (owedByApartments, members)
4. **Ordering indexes** for sorted results (createdAt DESC, priority DESC)

## Migration Considerations

When updating data models:

1. Add new optional fields to maintain backward compatibility
2. Use feature flags for breaking changes
3. Implement gradual migration scripts for data transformation
4. Maintain legacy fields during transition periods
5. Document all breaking changes in migration guides
