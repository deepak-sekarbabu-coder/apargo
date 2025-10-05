# Apargo Data Model

## Overview

This document describes the Firestore database structure for the Apargo application, including collections, documents, and their relationships.

## Database Schema

### Users Collection

```javascript
users: {
  userId: {
    id: string,               // Firebase document ID
    name: string,             // Full name
    avatar?: string,          // Profile picture URL
    email?: string,           // User email
    phone?: string,           // Phone number
    role?: 'user' | 'admin' | 'incharge', // Authentication role (system permissions)
    propertyRole?: 'tenant' | 'owner', // Property relationship role
    fcmToken?: string,        // For push notifications
    apartment: string,        // Apartment is now required
    isApproved?: boolean,     // User approval status (default: false)
  }
}
```

### Apartments Collection

```javascript
apartments: {
  apartmentId: {
    id: string,               // Apartment identifier
    name: string,             // Apartment name
    members: string[]         // Array of user IDs belonging to this apartment
  }
}
```

### Expenses Collection

```javascript
expenses: {
  expenseId: {
    id: string,               // Document ID
    description: string,      // Detailed description
    amount: number,           // Total amount
    date: string,             // ISO date string
    paidByApartment: string,  // Apartment ID that paid
    owedByApartments: string[], // Apartments that owe a share
    perApartmentShare: number, // Amount each owing apartment owes
    categoryId: string,       // Category ID
    receipt?: string,         // Optional: data URI for the receipt image
    paidByApartments?: string[], // Apartments that have already paid their share back
    paid?: boolean,           // Whether the expense is fully settled
  }
}
```

### Payments Collection

```javascript
payments: {
  paymentId: {
    payerId: string,          // User ID who paid
    payeeId: string,          // User ID to receive payment
    apartmentId?: string,     // Apartment ID associated with the payment
    category?: string,        // 'income' | 'expense' (category of the payment)
    amount: number,           // Payment amount
    expenseId?: string,       // Linked expense ID (optional)
    status: string,           // 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'cancelled'
    createdAt: string,        // ISO date string
    approvedBy?: string,      // Admin user ID who approved
    approvedByName?: string,  // Admin user name
    receiptURL?: string,      // Uploaded receipt URL
    monthYear: string,        // Format: YYYY-MM
    reason?: string,          // Optional reason for the payment
  }
}
```

### Balance Sheets Collection (Updated: replaces simple balances)

```javascript
balanceSheets: {
  balanceSheetId: {
    apartmentId: string,      // Apartment ID
    monthYear: string,        // Format: YYYY-MM
    openingBalance: number,   // Opening balance for the month
    totalIncome: number,      // Total income for the month
    totalExpenses: number,    // Total expenses for the month
    closingBalance: number,   // Closing balance (opening + income - expenses)
  }
}
```

### Categories Collection

```javascript
categories: {
  categoryId: {
    id: string,               // Document ID
    name: string,             // Category name
    icon: string,             // Icon identifier
    noSplit?: boolean,        // Feature flag: when true, expenses in this category won't be split among apartments
    // Payment Event Configuration Fields
    isPaymentEvent?: boolean, // Identifies this category as a payment event generator
    monthlyAmount?: number,   // Monthly fee amount (e.g., maintenance fee)
    dayOfMonth?: number,      // Day of month to generate payment (1-28, default: 1)
    autoGenerate?: boolean,   // Enable/disable automatic monthly generation
  }
}
```

### File Metadata Collection (Updated)

```javascript
fileMetadata: {
  fileId: {
    originalName: string,     // Original file name
    fileName: string,         // Stored filename with timestamp
    storagePath: string,      // Full path in storage
    downloadURL: string,      // Download URL
    fileSize: number,         // Size in bytes
    mimeType: string,         // MIME type
    uploadedBy: string,       // User ID who uploaded
    uploadedAt: string,       // ISO date string
    category: 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance', // File category
    relatedId?: string,       // Related expense/fault/user ID
    apartmentId?: string,     // Associated apartment ID
  }
}
```

### Maintenance Tasks Collection

```javascript
maintenanceTasks: {
  taskId: {
    title: string,            // Task title
    description?: string,     // Detailed description
    category: string,         // Task category (e.g., 'elevator', 'water_tank', 'generator')
    vendorId?: string,        // Linked vendor ID
    scheduledDate: string,    // ISO date (planned date)
    dueDate?: string,         // Optional due date if different from scheduled
    completedDate?: string,   // ISO date when completed
    skippedDate?: string,     // ISO date when task was skipped
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' | 'skipped', // Task status
    costEstimate?: number,    // Estimated cost
    actualCost?: number,      // Actual cost after completion
    attachments?: string[],   // Array of file metadata IDs or direct storage URLs
    notes?: string,           // Additional notes
    recurrence?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none', // Recurrence pattern
    createdBy: string,        // User ID who created the task
    createdAt: string,        // ISO date
    updatedAt?: string,       // ISO date
  }
}
```

### Vendors Collection

```javascript
vendors: {
  vendorId: {
    name: string,             // Vendor name
    serviceType: string,      // Service category (e.g., 'elevator', 'plumbing', 'electrical')
    phone?: string,           // Phone number
    email?: string,           // Email address
    address?: string,         // Physical address
    rating?: number,          // 1-5 rating
    notes?: string,           // Additional notes
    isActive: boolean,        // Whether vendor is currently active
    lastUsedAt?: string,      // ISO date when last used
    createdAt: string,        // ISO date
    updatedAt?: string,       // ISO date
  }
}
```

### Maintenance Budgets Collection

```javascript
maintenanceBudgets: {
  budgetId: {
    year: number,                         // Budget year
    totalBudget: number,                  // Annual allocated amount
    allocatedByCategory: { [category: string]: number }, // planned allocation by category
    spentByCategory: { [category: string]: number },     // actual spent by category
    totalSpent: number,                   // Total amount spent (derived field)
    createdAt: string,                    // ISO date
    updatedAt?: string,                   // ISO date
  }
}
```

### Polls Collection

```javascript
polls: {
  pollId: {
    id: string,               // Firestore doc ID
    question: string,         // Poll question
    options: array,           // Array of PollOption objects
    createdBy: string,        // Admin user ID
    createdAt: string,        // ISO date
    expiresAt?: string,       // Optional ISO date
    votes: { [apartmentId: string]: string }, // apartmentId -> optionId
    isActive: boolean,        // Whether poll is active
  }
}

// PollOption Type:
{
  id: string,
  text: string,
}
```

### Notifications Collection (Used for announcements and notifications)

```javascript
notifications: {
  notificationId: {
    id: string,               // Document ID
    type: 'payment_request' | 'payment_received' | 'payment_confirmed' | 'reminder' | 'announcement' | 'poll', // Notification type
    title: string,            // Notification title
    message: string,          // Notification message
    amount?: number,          // Amount for payment-related notifications
    currency?: string,        // Currency code
    fromApartmentId?: string, // Source apartment ID
    toApartmentId?: string | string[], // Target apartment ID or array for announcements
    relatedExpenseId?: string, // Related expense ID
    // Announcement-specific fields (when type === 'announcement')
    createdBy?: string,       // Admin user ID who created the announcement
    isActive?: boolean,       // Whether the announcement is still active
    priority?: 'low' | 'medium' | 'high', // Priority level
    expiresAt?: string,       // ISO date for expiry
    isRead: boolean | { [apartmentId: string]: boolean }, // Can be boolean or object for announcements
    isDismissed?: boolean,    // Whether notification is dismissed
    createdAt: string,        // ISO date string
    dueDate?: string,         // ISO date string for payment due dates
    status?: string,          // Payment status
    paymentMethod?: string,   // Payment method type
    transactionId?: string,   // Transaction ID
    category?: string,        // Category name
    requestedBy?: string,     // User ID who requested payment
    paidAt?: string,          // ISO date string when payment was completed
  }
}
```

### Announcements Collection (Alternative approach sometimes used)

```javascript
announcements: {
  announcementId: {
    id: string,               // Document ID
    title: string,            // Announcement title
    message: string,          // Announcement content
    createdBy: string,        // Admin user ID
    createdAt: string,        // ISO date
    expiresAt?: string,       // Optional ISO date
    isActive: boolean,        // Whether announcement is active
    priority: 'low' | 'medium' | 'high', // Priority level
  }
}
```

### Faults Collection

```javascript
faults: {
  faultId: {
    id: string,               // Document ID
    images: string[],         // URLs or base64
    location: string,         // Location
    description: string,      // Detailed description
    reportedBy: string,       // User ID
    reportedAt: string,       // ISO date string
    severity: 'critical' | 'warning' | 'low', // Critical, warning, or low priority
    status: 'open' | 'in_progress' | 'resolved' | 'closed', // Current status of the fault
    assignedTo?: string,      // User ID of person assigned to fix
    estimatedCost?: number,   // Estimated cost to fix
    actualCost?: number,      // Actual cost after fixing
    priority: number,         // 1-5 priority scale
    fixed: boolean,           // Legacy field - kept for backward compatibility
    fixedAt?: string,         // ISO date string
    resolvedAt?: string,      // ISO date string when marked as resolved
    notes?: string,           // Additional notes or updates
    updatedAt?: string,       // ISO date string of last update
  }
}
```

## Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ EXPENSES : "creates"
    APARTMENTS ||--o{ USERS : "contains"
    APARTMENTS ||--o{ EXPENSES : "pays"
    EXPENSES ||--o{ PAYMENTS : "generates"
    APARTMENTS ||--o{ BALANCESHEETS : "has"
    USERS ||--o{ MAINTENANCE_TASKS : "assigns"
    VENDORS ||--o{ MAINTENANCE_TASKS : "provides"
    USERS ||--o{ POLLS : "creates"
    USERS ||--o{ NOTIFICATIONS : "creates"
    CATEGORIES ||--o{ EXPENSES : "classifies"
    USERS ||--o{ FAULTS : "reports"
    APARTMENTS ||--o{ FAULTS : "has"

    USERS {
        string id
        string name
        string email
        string phone
        string role
        string propertyRole
        string apartment
        string fcmToken
        boolean isApproved
        string avatar
    }

    APARTMENTS {
        string id
        string name
        array members
    }

    EXPENSES {
        string id
        string description
        number amount
        string date
        string paidByApartment
        array owedByApartments
        number perApartmentShare
        string categoryId
        string receipt
        array paidByApartments
        boolean paid
    }

    PAYMENTS {
        string id
        string payerId
        string payeeId
        string apartmentId
        string category
        number amount
        string expenseId
        string status
        string createdAt
        string approvedBy
        string approvedByName
        string receiptURL
        string monthYear
        string reason
    }

    BALANCESHEETS {
        string apartmentId
        string monthYear
        number openingBalance
        number totalIncome
        number totalExpenses
        number closingBalance
    }

    MAINTENANCE_TASKS {
        string title
        string category
        string vendorId
        string scheduledDate
        string status
        string createdBy
        string createdAt
    }

    VENDORS {
        string name
        string serviceType
        boolean isActive
        string createdAt
    }

    CATEGORIES {
        string id
        string name
        string icon
        boolean noSplit
        boolean isPaymentEvent
        number monthlyAmount
        number dayOfMonth
        boolean autoGenerate
    }

    POLLS {
        string id
        string question
        array options
        string createdBy
        string createdAt
        string expiresAt
        object votes
        boolean isActive
    }

    NOTIFICATIONS {
        string id
        string type
        string title
        string message
        number amount
        string currency
        string fromApartmentId
        string toApartmentId
        string relatedExpenseId
        string createdBy
        boolean isActive
        string priority
        string expiresAt
        string isRead
        boolean isDismissed
        string createdAt
        string dueDate
        string status
        string paymentMethod
        string transactionId
        string category
        string requestedBy
        string paidAt
    }

    FAULTS {
        string id
        string location
        string description
        string reportedBy
        string reportedAt
        string severity
        string status
        string assignedTo
        number estimatedCost
        number actualCost
        number priority
        boolean fixed
        string fixedAt
        string resolvedAt
        string notes
        string updatedAt
    }
}
```

## Business Logic Constraints

### Expense Division Rules

1. Every expense automatically divides across all apartments with the payer excluded
2. The per-apartment share is calculated as: `amount / (total number of apartments - 1)` (excluding the payer)
3. Only apartments in `owedByApartments` array owe a share
4. Apartments in `paidByApartments` array are those who have paid their share back
5. Expenses with `noSplit: true` in their category are not divided among apartments

### Balance Sheet Calculation Rules

1. Monthly balance sheets are calculated for each apartment
2. Balance sheet ID format: `${apartmentId}_${monthYear}` (e.g., "A1_2025-09")
3. Balance calculation: `closingBalance = openingBalance + totalIncome - totalExpenses`
4. Payer receives income equal to unpaid shares (others' contributions)
5. Owed apartments increase their totalExpenses by their share amount
6. Balance sheets automatically update when expenses or payments change

### Role System

1. Users have dual roles: authentication role and property role
2. Authentication roles: 'user', 'admin', 'incharge'
3. Property roles: 'tenant', 'owner'
4. Onboarding is required if either role is missing
5. User approval status must be true for access (isApproved: true)

### Payment Tracking

1. Payments link payers to payees for specific amounts
2. Status tracking: 'pending', 'approved', 'rejected', 'paid', 'failed', 'cancelled'
3. Monthly aggregation with monthYear field for reporting
4. Payments can be linked to expenses for tracking purposes

### Maintenance Task Management

1. Tasks can be recurring with configurable patterns (monthly, quarterly, etc.)
2. Automatic creation of recurring tasks when completed or skipped
3. Status tracking with automatic overdue detection
4. Budget integration tracking spent vs allocated amounts

### File Management

1. All file metadata stored in fileMetadata collection
2. Files organized by category (receipt, fault, avatar, announcement, maintenance)
3. Enhanced validation with file size and MIME type restrictions
4. Automatic cleanup for old files based on age

### Data Integrity

1. Balance sheet updates are processed in transaction-like operations
2. When expenses are added/updated/deleted, balance sheets are automatically updated
3. When payments are added/updated/deleted, balance sheets are automatically updated
4. Proper denormalization with automatic consistency maintenance between related collections
