export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'incharge'; // Authentication role (system permissions)
  propertyRole?: 'tenant' | 'owner'; // Property relationship role
  fcmToken?: string; // For push notifications
  apartment: string; // Apartment is now required
  isApproved?: boolean; // User approval status (default: false)
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  noSplit?: boolean; // Feature flag: when true, expenses in this category won't be split among apartments
  // Payment Event Configuration Fields
  isPaymentEvent?: boolean; // Identifies this category as a payment event generator
  monthlyAmount?: number; // Monthly fee amount (e.g., maintenance fee)
  dayOfMonth?: number; // Day of month to generate payment (1-28, default: 1)
  autoGenerate?: boolean; // Enable/disable automatic monthly generation
};

export type Apartment = {
  id: string;
  name: string;
  members: string[]; // User IDs
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  paidByApartment: string; // Apartment ID that paid
  owedByApartments: string[]; // Apartments that owe a share
  perApartmentShare: number; // Amount each owing apartment owes
  categoryId: string; // Category ID
  receipt?: string; // Optional: data URI for the receipt image
  paidByApartments?: string[]; // Apartments that have already paid their share back
  paid?: boolean;
};

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

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'failed' | 'cancelled';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  fromApartmentId?: string;
  toApartmentId?: string | string[]; // Can be single apartment or array for announcements
  relatedExpenseId?: string;
  // Announcement-specific fields (when type === 'announcement')
  createdBy?: string; // Admin user ID who created the announcement
  isActive?: boolean; // Whether the announcement is still active
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string; // ISO date string
  isRead: boolean | { [apartmentId: string]: boolean }; // Can be boolean or object for announcements
  isDismissed?: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // ISO date string
  status?: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  transactionId?: string;
  category?: string;
  requestedBy?: string; // User ID who requested the payment
  paidAt?: string; // ISO date string when payment was completed
};

// --- Polling Feature ---
export type PollOption = {
  id: string;
  text: string;
};

export type Poll = {
  id: string; // Firestore doc ID
  question: string;
  options: PollOption[];
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional ISO date
  votes: { [apartmentId: string]: string }; // apartmentId -> optionId
  isActive: boolean;
};

export type FaultSeverity = 'critical' | 'warning' | 'low';
export type FaultStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Fault = {
  id: string;
  images: string[]; // URLs or base64
  location: string;
  description: string;
  reportedBy: string; // User ID
  reportedAt: string; // ISO date string
  severity: FaultSeverity; // Critical, warning, or low priority
  status: FaultStatus; // Current status of the fault
  assignedTo?: string; // User ID of person assigned to fix
  estimatedCost?: number; // Estimated cost to fix
  actualCost?: number; // Actual cost after fixing
  priority: number; // 1-5 priority scale
  fixed: boolean; // Legacy field - kept for backward compatibility
  fixedAt?: string; // ISO date string
  resolvedAt?: string; // ISO date string when marked as resolved
  notes?: string; // Additional notes or updates
  updatedAt?: string; // ISO date string of last update
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional ISO date
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
};

export type View =
  | 'dashboard'
  | 'expense-analytics'
  | 'admin'
  | 'community'
  | 'faults'
  | 'ledger'
  | 'maintenance';

export type Payment = {
  id: string;
  payerId: string; // User ID who paid
  payeeId: string; // User ID to receive payment
  apartmentId?: string; // Apartment ID associated with the payment (usually payer's apartment)
  // Category of the payment: 'income' for money received, 'expense' for money spent
  category?: 'income' | 'expense';
  amount: number;
  expenseId?: string; // Linked expense (optional)
  status: PaymentStatus;
  createdAt: string; // ISO date string
  approvedBy?: string; // Admin user ID
  approvedByName?: string; // Admin user name
  receiptURL?: string; // Uploaded receipt URL
  monthYear: string; // Format: YYYY-MM
  reason?: string; // Optional reason for the payment, applicable for expenses
};

export type BalanceSheet = {
  apartmentId: string;
  monthYear: string; // Format: YYYY-MM
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
};

// Firebase Storage Configuration Types
export type FileMetadata = {
  id: string;
  originalName: string;
  fileName: string; // Stored filename with timestamp
  storagePath: string; // Full path in storage
  downloadURL: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedBy: string; // User ID
  uploadedAt: string; // ISO date string
  category: 'receipt' | 'fault' | 'avatar' | 'announcement' | 'maintenance';
  relatedId?: string; // Related expense/fault/user ID
  apartmentId?: string; // Associated apartment
};

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

// --- Maintenance Feature Types ---
export type Vendor = {
  id: string;
  name: string;
  serviceType: string; // e.g., 'elevator', 'plumbing', 'electrical'
  phone?: string;
  email?: string;
  address?: string;
  rating?: number; // 1-5
  notes?: string;
  isActive: boolean;
  lastUsedAt?: string; // ISO date
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};

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
  dueDate?: string; // Optional due date if different from scheduled
  completedDate?: string; // ISO date
  skippedDate?: string; // ISO date when task was skipped
  status: MaintenanceTaskStatus;
  costEstimate?: number;
  actualCost?: number;
  attachments?: string[]; // file metadata IDs or direct storage URLs
  notes?: string;
  recurrence?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none';
  createdBy: string; // user id
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};

export type MaintenanceBudget = {
  id: string;
  year: number; // Budget year
  totalBudget: number; // Annual allocated amount
  allocatedByCategory: { [category: string]: number }; // planned allocation
  spentByCategory: { [category: string]: number }; // actual spent
  totalSpent: number; // derived convenience field (denormalized)
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
};
