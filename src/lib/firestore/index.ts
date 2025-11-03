// Apartments
export { getApartments, subscribeToApartments } from './apartments';

// Users
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

// Categories
export { getCategories, addCategory, updateCategory, deleteCategory, subscribeToCategories } from './categories';

// Expenses and Balance Sheets
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

// File Metadata
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

// Vendors
export { getVendors, addVendor, updateVendor, deleteVendor, subscribeToVendors } from './vendors';

// Maintenance Budgets
export {
  getMaintenanceBudget,
  addMaintenanceBudget,
  updateMaintenanceBudget,
  subscribeToMaintenanceBudget,
} from './maintenance-budgets';

// Maintenance Tasks
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

// Polls
export {
  getPolls,
  listenToPolls,
  addPoll,
  voteOnPoll,
  getPollResults,
  closePoll,
  deletePoll,
} from './polls';

// Announcements
export {
  getActiveAnnouncements,
  listenToActiveAnnouncements,
  deleteAnnouncement,
} from './announcements';

// Faults
export { getFaults, addFault, updateFault, deleteFault } from './faults';

// Payments
export {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
  subscribeToPayments,
  generatePaymentEvents,
  generateAllPaymentEvents,
} from './payments';

// Shared utilities (if needed externally)
export { computeExpenseDeltas, calculateDeltaChanges } from '../firestore-utils';
