/**
 * FIRESTORE MODULE INDEX
 *
 * ⚠️  Interface Segregation Principle (ISP) Violation:
 * This index file exports all functions from all modules, forcing clients to depend
 * on functionality they don't use. For better ISP compliance, prefer direct imports:
 *
 * ✅ Good: import { getUsers } from '@/lib/firestore/users'
 * ❌ Bad:  import { getUsers } from '@/lib/firestore'
 *
 * Direct imports ensure clients only depend on the specific functionality they need.
 */

// ===== APARTMENTS =====
export { getApartments, subscribeToApartments } from './apartments';

// ===== USERS =====
export {
  getUsers,
  getAllUsers,
  getUser,
  getUserByEmail,
  addUser,
  approveUser,
  updateUser,
  deleteUser,
  subscribeToUsers,
  subscribeToAllUsers,
} from './users';

// ===== CATEGORIES =====
export { getCategories, addCategory, updateCategory, deleteCategory, subscribeToCategories } from './categories';

// ===== EXPENSES AND BALANCE SHEETS =====
export {
  getExpenses,
  subscribeToExpenses,
  subscribeToRelevantExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBalanceSheets,
  addBalanceSheet,
  updateBalanceSheet,
  deleteBalanceSheet,
  subscribeToBalanceSheets,
  applyDeltasToBalanceSheets,
} from './expenses';

// ===== FILE METADATA =====
export {
  getFileMetadata,
  getFileMetadataByCategory,
  getFileMetadataByUploader,
  getFileMetadataByAge,
  getAllFileMetadata,
  addFileMetadata,
  updateFileMetadata,
  deleteFileMetadata,
  subscribeToFileMetadata,
} from './file-metadata';

// ===== VENDORS =====
export { getVendors, addVendor, updateVendor, deleteVendor, subscribeToVendors } from './vendors';

// ===== MAINTENANCE BUDGETS =====
export {
  getMaintenanceBudget,
  addMaintenanceBudget,
  updateMaintenanceBudget,
  subscribeToMaintenanceBudget,
} from './maintenance-budgets';

// ===== MAINTENANCE TASKS =====
export {
  getMaintenanceTasks,
  getUpcomingMaintenanceTasks,
  getCompletedMaintenanceTasks,
  getMaintenanceTasksCount,
  addMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  subscribeToMaintenanceTasks,
  applyTaskCostToBudget,
} from './maintenance-tasks';

// ===== POLLS =====
export {
  getPolls,
  listenToPolls,
  addPoll,
  voteOnPoll,
  getPollResults,
  closePoll,
  deletePoll,
} from './polls';

// ===== ANNOUNCEMENTS =====
export {
  getActiveAnnouncements,
  listenToActiveAnnouncements,
  deleteAnnouncement,
} from './announcements';

// ===== FAULTS =====
export { getFaults, addFault, updateFault, deleteFault } from './faults';

// ===== PAYMENTS =====
export {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
  subscribeToPayments,
  generatePaymentEvents,
  generateAllPaymentEvents,
} from './payments';

// ===== SHARED UTILITIES =====
export { computeExpenseDeltas, calculateDeltaChanges } from '../firestore-utils';
