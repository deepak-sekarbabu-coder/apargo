import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import {
  createRecurringTaskFromCompleted,
  createRecurringTaskFromSkipped,
  shouldCreateRecurringTask,
  shouldCreateRecurringTaskOnSkip,
} from './maintenance-utils';
import { computeApprovedExpensePaymentDeltas } from './payments';
import type {
  Apartment,
  BalanceSheet,
  Category,
  Expense,
  Fault,
  FileMetadata,
  MaintenanceBudget,
  MaintenanceTask,
  Notification,
  Payment,
  Poll,
  User,
  Vendor,
} from './types';

// Helper: derive monthYear (YYYY-MM) from ISO date or now
const getMonthYearFromDate = (isoDate?: string) => {
  const d = isoDate ? new Date(isoDate) : new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

// Helper: deterministic balance sheet doc id per apartment+month
const getBalanceDocId = (apartmentId: string, monthYear: string) => `${apartmentId}_${monthYear}`;

// Compute per-apartment deltas from an expense for the monthYear derived from expense.date
// Notes:
// - Only unpaid owed apartments (those not present in paidByApartments) should contribute to deltas.
// - Owing apartments increase their totalExpenses (they owe money).
// - The paying apartment increases its totalIncome by the sum of unpaid shares.
export const computeExpenseDeltas = (expense: Expense) => {
  const monthYear = getMonthYearFromDate(expense.date);
  const deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};

  const payer = expense.paidByApartment;
  const perShare = Number(expense.perApartmentShare) || 0;
  const owed = expense.owedByApartments || [];
  const paidByApartments = expense.paidByApartments || [];

  // Determine which owed apartments still haven't paid their share
  const unpaidOwed = owed.filter(aid => !paidByApartments.includes(aid));

  // Each unpaid owing apartment should have their expenses increased by their share
  unpaidOwed.forEach(aid => {
    deltas[aid] = deltas[aid] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
    deltas[aid].totalExpensesDelta += perShare;
  });

  // Payer receives income equal to the total unpaid shares (others' contributions)
  const totalIncoming = unpaidOwed.length * perShare;
  deltas[payer] = deltas[payer] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
  deltas[payer].totalIncomeDelta += totalIncoming;

  return { monthYear, deltas };
};

// Apply deltas (positive or negative) to balanceSheets documents using updateDoc/addDoc
const applyDeltasToBalanceSheets = async (
  deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>,
  monthYear: string
) => {
  const ops: Promise<unknown>[] = [];

  Object.entries(deltas).forEach(([apartmentId, delta]) => {
    const docId = getBalanceDocId(apartmentId, monthYear);
    const sheetDoc = doc(db, 'balanceSheets', docId);

    // Try to update existing doc; if fails because doc doesn't exist, create it with initial values.
    const updatePayload: Partial<BalanceSheet> = {};
    if (delta.totalIncomeDelta) updatePayload.totalIncome = delta.totalIncomeDelta;
    if (delta.totalExpensesDelta) updatePayload.totalExpenses = delta.totalExpensesDelta;

    // Use transaction-like approach: read then set with merged values.
    const op = getDoc(sheetDoc).then(async snap => {
      if (snap.exists()) {
        const data = snap.data() as Partial<BalanceSheet> | undefined;
        const newTotalIncome = ((data?.totalIncome as number) || 0) + (delta.totalIncomeDelta || 0);
        const newTotalExpenses =
          ((data?.totalExpenses as number) || 0) + (delta.totalExpensesDelta || 0);
        const opening = (data?.openingBalance as number) || 0;
        const updated: Partial<BalanceSheet> = {
          totalIncome: newTotalIncome,
          totalExpenses: newTotalExpenses,
          openingBalance: opening,
          // Recompute closing from canonical values to avoid drift when only one side updates
          closingBalance: opening + newTotalIncome - newTotalExpenses,
        };
        return updateDoc(sheetDoc, removeUndefined(updated));
      }

      // Create new sheet doc with deterministic id
      // For new sheets, we need to check the previous month's closing balance
      let openingBalance = 0;

      // Get the previous month
      const [year, month] = monthYear.split('-').map(Number);
      const prevDate = new Date(year, month - 1, 1); // month is 0-indexed in Date
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevMonthYear = `${prevYear}-${prevMonth}`;
      const prevDocId = getBalanceDocId(apartmentId, prevMonthYear);
      const prevSheetDoc = doc(db, 'balanceSheets', prevDocId);

      try {
        const prevSnap = await getDoc(prevSheetDoc);
        if (prevSnap.exists()) {
          const prevData = prevSnap.data() as BalanceSheet;
          openingBalance = prevData.closingBalance;
        }
      } catch (err) {
        console.warn(`Could not fetch previous month balance sheet for continuity check: ${err}`);
      }

      const newSheet: BalanceSheet = {
        apartmentId,
        monthYear,
        openingBalance,
        totalIncome: delta.totalIncomeDelta || 0,
        totalExpenses: delta.totalExpensesDelta || 0,
        closingBalance:
          openingBalance + (delta.totalIncomeDelta || 0) - (delta.totalExpensesDelta || 0),
      };
      // Use set via addDoc with provided id by writing to doc reference
      return setDoc(sheetDoc, newSheet);
    });

    ops.push(op);
  });

  await Promise.all(ops);
};

const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  Object.keys(obj).forEach(
    key =>
      (obj as Record<string, unknown>)[key] === undefined &&
      delete (obj as Record<string, unknown>)[key]
  );
  return obj;
};

// --- Apartments ---
export const getApartments = async (): Promise<Apartment[]> => {
  // Only fetch needed fields for dashboard
  const apartmentsQuery = query(collection(db, 'apartments'));
  const apartmentSnapshot = await getDocs(apartmentsQuery);
  return apartmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
};

export const subscribeToApartments = (callback: (apartments: Apartment[]) => void) => {
  // Use real-time listener only if UI requires live updates
  const apartmentsQuery = query(collection(db, 'apartments'));
  return onSnapshot(apartmentsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const apartments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
    callback(apartments);
  });
};

// --- Users ---
export const getUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'), where('isApproved', '==', true));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment)); // Composite index: apartment
  }
  // Only fetch needed fields for user list
  usersQuery = query(usersQuery); // Add .select() if using Firestore Lite
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getAllUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment)); // Composite index: apartment
  }
  // Only fetch needed fields for user list
  usersQuery = query(usersQuery); // Add .select() if using Firestore Lite
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getUser = async (id: string): Promise<User | null> => {
  const userDoc = doc(db, 'users', id);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return { id: userSnapshot.id, ...userSnapshot.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('email', '==', email)); // Index: email
  try {
    const userSnapshot = await getDocs(q);
    if (userSnapshot.empty) {
      return null;
    }
    const doc = userSnapshot.docs[0];
    const userData = { id: doc.id, ...doc.data() } as User;
    return userData;
  } catch (error) {
    console.error('Error querying user by email:', error);
    throw error;
  }
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const usersCol = collection(db, 'users');
  const cleanUser = removeUndefined({ ...user, isApproved: false });
  const docRef = await addDoc(usersCol, cleanUser);
  return { id: docRef.id, ...cleanUser } as User;
};

export const approveUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await updateDoc(userDoc, { isApproved: true });
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  const cleanUser = removeUndefined(user) as Partial<User>;
  await updateDoc(userDoc, cleanUser);
};

export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await deleteDoc(userDoc);
};

export const subscribeToUsers = (callback: (users: User[]) => void, apartment?: string) => {
  let usersQuery = query(collection(db, 'users'), where('isApproved', '==', true));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  return onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  });
};

export const subscribeToAllUsers = (callback: (users: User[]) => void, apartment?: string) => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  return onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  });
};

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, 'categories');
  // Only fetch needed fields for category list
  const categorySnapshot = await getDocs(categoriesCol);
  return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesCol = collection(db, 'categories');
  const cleanCategory = removeUndefined(category);
  const docRef = await addDoc(categoriesCol, cleanCategory);
  return { id: docRef.id, ...cleanCategory } as Category;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  const cleanCategory = removeUndefined(category) as Partial<Category>;
  await updateDoc(categoryDoc, cleanCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  await deleteDoc(categoryDoc);
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const categoriesQuery = query(collection(db, 'categories'));
  return onSnapshot(categoriesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
    callback(categories);
  });
};

// --- Expenses ---
export const getExpenses = async (apartment?: string): Promise<Expense[]> => {
  // If apartment not provided, return recent expenses (existing behavior)
  if (!apartment) {
    let expensesQuery = query(collection(db, 'expenses'));
    // Only fetch needed fields for dashboard
    expensesQuery = query(expensesQuery); // Add .select() if using Firestore Lite
    // Limit results for dashboard
    expensesQuery = query(expensesQuery /* e.g. */ /* limit(20) */);
    const expenseSnapshot = await getDocs(expensesQuery);
    return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
  }

  // When apartment is provided, perform server-side queries for relevance.
  // Firestore doesn't support OR across different fields in a single query (except in newer SDKs with 'in'/'array-contains-any').
  // We'll run two queries in parallel and merge results client-side (this avoids downloading the entire collection).
  const paidByQuery = query(collection(db, 'expenses'), where('paidByApartment', '==', apartment));
  const owedByQuery = query(
    collection(db, 'expenses'),
    where('owedByApartments', 'array-contains', apartment)
  );

  const [paidSnap, owedSnap] = await Promise.all([getDocs(paidByQuery), getDocs(owedByQuery)]);
  const paid = paidSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
  const owed = owedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);

  // Merge unique expenses by id
  const mergedById = new Map<string, Expense>();
  paid.concat(owed).forEach(e => mergedById.set(e.id as string, e));
  return Array.from(mergedById.values());
};

export const subscribeToExpenses = (
  callback: (expenses: Expense[]) => void,
  apartment?: string
) => {
  let expensesQuery = query(collection(db, 'expenses'));
  if (apartment) {
    expensesQuery = query(expensesQuery, where('paidByApartment', '==', apartment));
  }
  // Only use real-time listener if UI requires live updates
  return onSnapshot(expensesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
    callback(expenses);
  });
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
  const newExpense = {
    ...expense,
    date: new Date().toISOString(),
    paidByApartments: expense.paidByApartments || [],
  };
  const expensesCol = collection(db, 'expenses');
  const cleanExpense = removeUndefined(newExpense);
  const docRef = await addDoc(expensesCol, cleanExpense);
  // Update denormalized balance sheets for the month of this expense
  try {
    const fullExpense = { id: docRef.id, ...cleanExpense } as Expense;
    const { monthYear, deltas } = computeExpenseDeltas(fullExpense);
    await applyDeltasToBalanceSheets(deltas, monthYear);
    // Note: In case of failure, the expense is still created. Consider compensating writes or transactions if needed.
  } catch (err) {
    console.error('Error updating balanceSheets after addExpense:', err);
  }
  return { id: docRef.id, ...cleanExpense } as Expense;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<void> => {
  const expenseDoc = doc(db, 'expenses', id);
  // Fetch existing expense to compute delta
  const oldSnap = await getDoc(expenseDoc);
  if (!oldSnap.exists()) throw new Error('Expense not found');
  const oldExpense = { id: oldSnap.id, ...(oldSnap.data() as Partial<Expense>) } as Expense;

  const cleanExpense = removeUndefined(expense) as Partial<Expense>;
  await updateDoc(expenseDoc, cleanExpense);

  try {
    // Recompute deltas: subtract old, add new
    const { monthYear: oldMonth, deltas: oldD } = computeExpenseDeltas(oldExpense);
    const newExpense = { ...oldExpense, ...cleanExpense } as Expense;
    const { monthYear: newMonth, deltas: newD } = computeExpenseDeltas(newExpense);

    // Apply negative of old deltas
    const negOld: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
    Object.entries(oldD).forEach(([k, v]) => {
      negOld[k] = {
        totalIncomeDelta: -v.totalIncomeDelta,
        totalExpensesDelta: -v.totalExpensesDelta,
      };
    });

    // Apply: remove old, add new
    if (oldMonth === newMonth) {
      // Merge negOld and newD
      const merged: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
      Object.entries(negOld).forEach(([k, v]) => {
        merged[k] = {
          ...(merged[k] || { totalIncomeDelta: 0, totalExpensesDelta: 0 }),
          totalIncomeDelta: (merged[k]?.totalIncomeDelta || 0) + v.totalIncomeDelta,
          totalExpensesDelta: (merged[k]?.totalExpensesDelta || 0) + v.totalExpensesDelta,
        };
      });
      Object.entries(newD).forEach(([k, v]) => {
        merged[k] = {
          ...(merged[k] || { totalIncomeDelta: 0, totalExpensesDelta: 0 }),
          totalIncomeDelta: (merged[k]?.totalIncomeDelta || 0) + v.totalIncomeDelta,
          totalExpensesDelta: (merged[k]?.totalExpensesDelta || 0) + v.totalExpensesDelta,
        };
      });
      await applyDeltasToBalanceSheets(merged, newMonth);
    } else {
      // Different months: subtract old from oldMonth, add new to newMonth
      await applyDeltasToBalanceSheets(negOld, oldMonth);
      await applyDeltasToBalanceSheets(newD, newMonth);
    }
  } catch (err) {
    console.error('Error updating balanceSheets after updateExpense:', err);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseDoc = doc(db, 'expenses', id);
  // Fetch existing expense to subtract its effect
  const snap = await getDoc(expenseDoc);
  if (!snap.exists()) return;
  const expense = { id: snap.id, ...(snap.data() as Partial<Expense>) } as Expense;

  try {
    const { monthYear, deltas } = computeExpenseDeltas(expense);
    // Negate deltas and apply
    const neg: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
    Object.entries(deltas).forEach(([k, v]) => {
      neg[k] = { totalIncomeDelta: -v.totalIncomeDelta, totalExpensesDelta: -v.totalExpensesDelta };
    });
    await applyDeltasToBalanceSheets(neg, monthYear);
  } catch (err) {
    console.error('Error updating balanceSheets before deleteExpense:', err);
  }

  await deleteDoc(expenseDoc);
};

export const subscribeToRelevantExpenses = (
  callback: (expenses: Expense[]) => void,
  apartment: string
) => {
  // Subscribe to two server-side queries: expenses paid by apartment, and expenses where apartment is in owedByApartments.
  // This avoids fetching the entire collection and client-side scanning.
  const paidByQuery = query(collection(db, 'expenses'), where('paidByApartment', '==', apartment));
  const owedByQuery = query(
    collection(db, 'expenses'),
    where('owedByApartments', 'array-contains', apartment)
  );

  // Track latest documents from each listener and merge on updates.
  const paidMap = new Map<string, Expense>();
  const owedMap = new Map<string, Expense>();

  const emitMerged = () => {
    const merged = new Map<string, Expense>();
    paidMap.forEach((v, k) => merged.set(k, v));
    owedMap.forEach((v, k) => merged.set(k, v));
    callback(Array.from(merged.values()));
  };

  const paidUnsub = onSnapshot(paidByQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docs.forEach(doc => paidMap.set(doc.id, { id: doc.id, ...doc.data() } as Expense));
    // Remove any docs that were deleted from this snapshot
    const currentIds = new Set(snapshot.docs.map(d => d.id));
    Array.from(paidMap.keys()).forEach(id => {
      if (!currentIds.has(id)) paidMap.delete(id);
    });
    emitMerged();
  });

  const owedUnsub = onSnapshot(owedByQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docs.forEach(doc => owedMap.set(doc.id, { id: doc.id, ...doc.data() } as Expense));
    const currentIds = new Set(snapshot.docs.map(d => d.id));
    Array.from(owedMap.keys()).forEach(id => {
      if (!currentIds.has(id)) owedMap.delete(id);
    });
    emitMerged();
  });

  // Return a combined unsubscribe
  return () => {
    paidUnsub();
    owedUnsub();
  };
};

// --- Outstanding Balances ---
// Suggestion: Store outstanding balances in a summary document per apartment, updated on expense changes.
// This avoids scanning all expenses for each dashboard load.
//
// Denormalization note:
// Consider adding a `participants` or `relatedApartments` array on each expense that includes
// both the paying apartment and all owed apartments. This enables single-query server-side
// 'array-contains' or composite queries and simplifies subscriptions. If implemented, update
// write paths (addExpense/updateExpense) to keep the denormalized array consistent.

// --- Polling Feature ---
export const getPolls = async (activeOnly = false): Promise<Poll[]> => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll);
};

export const listenToPolls = (cb: (polls: Poll[]) => void, activeOnly = false) => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  return onSnapshot(q, snapshot => {
    cb(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll));
  });
};

export const addPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'votes'>): Promise<Poll> => {
  const now = new Date().toISOString();
  const newPoll = removeUndefined({
    ...poll,
    createdAt: now,
    votes: {},
  });
  const pollsCol = collection(db, 'polls');
  const docRef = await addDoc(pollsCol, newPoll);
  return { id: docRef.id, ...newPoll } as Poll;
};

export const voteOnPoll = async (
  pollId: string,
  apartmentId: string,
  optionId: string
): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) throw new Error('Poll not found');
  const poll = pollSnap.data() as Poll;
  if (poll.votes && poll.votes[apartmentId]) {
    throw new Error('This apartment has already voted.');
  }
  const update = { [`votes.${apartmentId}`]: optionId };
  await updateDoc(pollDoc, update);
};

export const getPollResults = async (pollId: string): Promise<Poll | null> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) return null;
  return { id: pollSnap.id, ...pollSnap.data() } as Poll;
};

export const closePoll = async (pollId: string): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  await updateDoc(pollDoc, { isActive: false });
};

// Secure delete: only creator or incharge role may delete a poll.
// Admins can only delete their own polls (data ownership rule).
export const deletePoll = async (
  pollId: string,
  currentUser?: { id: string; role?: string }
): Promise<void> => {
  if (!currentUser) {
    throw new Error('Not authenticated');
  }
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) throw new Error('Poll not found');
  const pollData = pollSnap.data() as Poll;
  const isOwner = pollData.createdBy === currentUser.id;
  const isIncharge = currentUser.role === 'incharge';
  if (!isOwner && !isIncharge) {
    throw new Error('You do not have permission to delete this poll');
  }
  await deleteDoc(pollDoc);
};

// --- Announcements ---
export const getActiveAnnouncements = async (): Promise<Notification[]> => {
  const notificationsCol = collection(db, 'notifications');
  const q = query(
    notificationsCol,
    where('type', '==', 'announcement'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
};

export const listenToActiveAnnouncements = (callback: (announcements: Notification[]) => void) => {
  const notificationsCol = collection(db, 'notifications');
  const q = query(
    notificationsCol,
    where('type', '==', 'announcement'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification);
    callback(announcements);
  });
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  const announcementDoc = doc(db, 'notifications', announcementId);
  await deleteDoc(announcementDoc);
};

// --- Faults ---
export const getFaults = async (): Promise<Fault[]> => {
  const faultsCol = collection(db, 'faults');
  const snapshot = await getDocs(faultsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Fault);
};
export const addFault = async (
  fault: Omit<Fault, 'id' | 'reportedAt' | 'fixed'>
): Promise<Fault> => {
  try {
    const newFault = {
      ...fault,
      reportedAt: new Date().toISOString(),
      fixed: false,
    };

    const faultsCol = collection(db, 'faults');
    const docRef = await addDoc(faultsCol, newFault);

    return { id: docRef.id, ...newFault } as Fault;
  } catch (error) {
    console.error('❌ Error in addFault:', error);
    throw error;
  }
};

export const updateFault = async (id: string, fault: Partial<Fault>): Promise<void> => {
  const faultDoc = doc(db, 'faults', id);
  await updateDoc(faultDoc, fault);
};

export const deleteFault = async (id: string): Promise<void> => {
  const faultDoc = doc(db, 'faults', id);
  await deleteDoc(faultDoc);
};

// --- Payments ---
export const getPayments = async (apartmentId?: string, monthYear?: string): Promise<Payment[]> => {
  let paymentsQuery = query(collection(db, 'payments'));
  if (apartmentId) {
    paymentsQuery = query(paymentsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    paymentsQuery = query(paymentsQuery, where('monthYear', '==', monthYear));
  }
  const paymentSnapshot = await getDocs(paymentsQuery);
  return paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
  const paymentsCol = collection(db, 'payments');
  const newPayment = {
    ...payment,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(paymentsCol, newPayment);
  // If this is already an approved expense, apply deltas to balanceSheets
  try {
    const deltas = computeApprovedExpensePaymentDeltas(undefined, {
      ...newPayment,
      id: docRef.id,
    } as Payment);
    if (deltas.length) {
      const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
      deltas.forEach(d => {
        const key = `${d.apartmentId}|${d.monthYear}`;
        map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
        map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
        map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
      });
      // group by monthYear and apply
      const perMonth: Record<
        string,
        Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
      > = {};
      Object.entries(map).forEach(([key, delta]) => {
        const [apartmentId, monthYear] = key.split('|');
        perMonth[monthYear] = perMonth[monthYear] || {};
        perMonth[monthYear][apartmentId] = delta;
      });
      for (const [month, deltasByApt] of Object.entries(perMonth)) {
        await applyDeltasToBalanceSheets(deltasByApt, month);
      }
    }
  } catch (e) {
    console.error('Error updating balanceSheets after addPayment:', e);
  }
  return { id: docRef.id, ...newPayment } as Payment;
};

export const updatePayment = async (id: string, payment: Partial<Payment>): Promise<void> => {
  const paymentDoc = doc(db, 'payments', id);
  // Read old to compute deltas
  const oldSnap = await getDoc(paymentDoc);
  const oldPayment = oldSnap.exists()
    ? ({ ...(oldSnap.data() as Payment), id } as Payment)
    : undefined;
  await updateDoc(paymentDoc, payment);
  try {
    const deltas = computeApprovedExpensePaymentDeltas(oldPayment, { ...oldPayment, ...payment });
    if (deltas.length) {
      const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
      deltas.forEach(d => {
        const key = `${d.apartmentId}|${d.monthYear}`;
        map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
        map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
        map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
      });
      const perMonth: Record<
        string,
        Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
      > = {};
      Object.entries(map).forEach(([key, delta]) => {
        const [apartmentId, monthYear] = key.split('|');
        perMonth[monthYear] = perMonth[monthYear] || {};
        perMonth[monthYear][apartmentId] = delta;
      });
      for (const [month, deltasByApt] of Object.entries(perMonth)) {
        await applyDeltasToBalanceSheets(deltasByApt, month);
      }
    }
  } catch (e) {
    console.error('Error updating balanceSheets after updatePayment:', e);
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  const paymentDoc = doc(db, 'payments', id);
  // Read existing payment to possibly subtract its effect
  const snap = await getDoc(paymentDoc);
  if (snap.exists()) {
    try {
      const p = { ...(snap.data() as Payment), id } as Payment;
      const deltas = computeApprovedExpensePaymentDeltas(p, undefined);
      if (deltas.length) {
        const map: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }> = {};
        deltas.forEach(d => {
          const key = `${d.apartmentId}|${d.monthYear}`;
          map[key] = map[key] || { totalIncomeDelta: 0, totalExpensesDelta: 0 };
          map[key].totalIncomeDelta += d.totalIncomeDelta || 0;
          map[key].totalExpensesDelta += d.totalExpensesDelta || 0;
        });
        const perMonth: Record<
          string,
          Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>
        > = {};
        Object.entries(map).forEach(([key, delta]) => {
          const [apartmentId, monthYear] = key.split('|');
          perMonth[monthYear] = perMonth[monthYear] || {};
          perMonth[monthYear][apartmentId] = delta;
        });
        for (const [month, deltasByApt] of Object.entries(perMonth)) {
          await applyDeltasToBalanceSheets(deltasByApt, month);
        }
      }
    } catch (e) {
      console.error('Error updating balanceSheets before deletePayment:', e);
    }
  }
  await deleteDoc(paymentDoc);
};

export const subscribeToPayments = (
  callback: (payments: Payment[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  let paymentsQuery = query(collection(db, 'payments'));
  if (apartmentId) {
    paymentsQuery = query(paymentsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    paymentsQuery = query(paymentsQuery, where('monthYear', '==', monthYear));
  }
  return onSnapshot(paymentsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
    callback(payments);
  });
};

// --- Payment Events ---
// Generate monthly payment events for configured categories
export const generatePaymentEvents = async (
  categoryId: string,
  monthYear: string
): Promise<Payment[]> => {
  // Get the category configuration
  const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
  if (!categoryDoc.exists()) {
    throw new Error(`Category ${categoryId} not found`);
  }

  const category = { id: categoryDoc.id, ...categoryDoc.data() } as Category;

  // Validate category is configured for payment events
  if (!category.isPaymentEvent || !category.monthlyAmount || typeof category.monthlyAmount !== 'number' || category.monthlyAmount <= 0) {
    throw new Error(`Category ${category.name} is not configured for payment events or has invalid monthlyAmount: ${category.monthlyAmount}`);
  }

  // Get all apartments
  const apartments = await getApartments();

  // Get all apartment members
  const allUsers = await getUsers();

  const createdPayments: Payment[] = [];

  // Create payment events for each apartment
  for (const apartment of apartments) {
    // Find the first member of the apartment to use as payee (they need to pay)
    const apartmentMembers = allUsers.filter(user => user.apartment === apartment.id);
    if (apartmentMembers.length === 0) {
      console.warn(
        `No members found for apartment ${apartment.id}, skipping payment event generation`
      );
      continue;
    }

    const firstMember = apartmentMembers[0];

    // Check if payment event already exists for this apartment and month
    const existingPayments = await getPayments(apartment.id, monthYear);
    const paymentEventExists = existingPayments.some(
      payment =>
        payment.reason?.includes('Monthly maintenance fee') ||
        payment.reason?.includes(category.name)
    );

    if (paymentEventExists) {
      console.log(`Payment event already exists for apartment ${apartment.id} in ${monthYear}`);
      continue;
    }

    // Validate amount and create payment event record
    const monthlyAmount = typeof category.monthlyAmount === 'number' ? category.monthlyAmount : 0;
    if (monthlyAmount <= 0) {
      console.warn(`Skipping payment event for category ${category.name} with invalid amount: ${monthlyAmount}`);
      continue;
    }

    const paymentEventData: Omit<Payment, 'id' | 'createdAt'> = {
      payerId: firstMember.id, // The apartment member who needs to pay
      payeeId: firstMember.id, // Same person (system-generated payment event)
      apartmentId: apartment.id,
      category: 'income',
      amount: monthlyAmount,
      status: 'pending',
      monthYear,
      reason: `Monthly maintenance fee - ${category.name}`,
    };

    try {
      const createdPayment = await addPayment(paymentEventData);
      createdPayments.push(createdPayment);
    } catch (error) {
      console.error(`Failed to create payment event for apartment ${apartment.id}:`, error);
    }
  }

  return createdPayments;
};

// Generate payment events for all configured categories for a specific month
export const generateAllPaymentEvents = async (monthYear: string): Promise<Payment[]> => {
  // Get all categories configured for payment events
  const categories = await getCategories();
  const paymentEventCategories = categories.filter(
    cat => cat.isPaymentEvent && cat.autoGenerate && cat.monthlyAmount && cat.monthlyAmount > 0
  );

  if (paymentEventCategories.length === 0) {
    // console.log('No categories configured for automatic payment event generation');
    return [];
  }

  const allCreatedPayments: Payment[] = [];

  for (const category of paymentEventCategories) {
    try {
      const createdPayments = await generatePaymentEvents(category.id, monthYear);
      allCreatedPayments.push(...createdPayments);
    } catch (error) {
      console.error(`Failed to generate payment events for category ${category.name}:`, error);
    }
  }

  return allCreatedPayments;
};

// --- Balance Sheets ---
export const getBalanceSheets = async (
  apartmentId?: string,
  monthYear?: string
): Promise<BalanceSheet[]> => {
  let sheetsQuery = query(collection(db, 'balanceSheets'));
  if (apartmentId) {
    sheetsQuery = query(sheetsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    sheetsQuery = query(sheetsQuery, where('monthYear', '==', monthYear));
  }
  const sheetSnapshot = await getDocs(sheetsQuery);
  return sheetSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      apartmentId: data.apartmentId,
      monthYear: data.monthYear,
      openingBalance: data.openingBalance,
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      closingBalance: data.closingBalance,
    } as BalanceSheet;
  });
};

export const addBalanceSheet = async (sheet: Omit<BalanceSheet, 'id'>): Promise<BalanceSheet> => {
  const sheetsCol = collection(db, 'balanceSheets');
  const docRef = await addDoc(sheetsCol, sheet);
  return { id: docRef.id, ...sheet } as BalanceSheet;
};

export const updateBalanceSheet = async (
  id: string,
  sheet: Partial<BalanceSheet>
): Promise<void> => {
  const sheetDoc = doc(db, 'balanceSheets', id);
  await updateDoc(sheetDoc, sheet);
};

export const deleteBalanceSheet = async (id: string): Promise<void> => {
  const sheetDoc = doc(db, 'balanceSheets', id);
  await deleteDoc(sheetDoc);
};

export const subscribeToBalanceSheets = (
  callback: (sheets: BalanceSheet[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  let sheetsQuery = query(collection(db, 'balanceSheets'));
  if (apartmentId) {
    sheetsQuery = query(sheetsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    sheetsQuery = query(sheetsQuery, where('monthYear', '==', monthYear));
  }
  return onSnapshot(sheetsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const sheets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        apartmentId: data.apartmentId,
        monthYear: data.monthYear,
        openingBalance: data.openingBalance,
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        closingBalance: data.closingBalance,
      } as BalanceSheet;
    });
    callback(sheets);
  });
};

// --- Caching & Real-time Listeners ---
// Use client-side caching (React Context, SWR, React Query) for frequently accessed data (users, categories).
// Only use onSnapshot for UI elements that require real-time updates.

// --- File Metadata ---
export const getFileMetadata = async (id: string): Promise<FileMetadata | null> => {
  const fileDoc = doc(db, 'fileMetadata', id);
  const fileSnapshot = await getDoc(fileDoc);
  if (fileSnapshot.exists()) {
    return { id: fileSnapshot.id, ...fileSnapshot.data() } as FileMetadata;
  }
  return null;
};

export const getFileMetadataByCategory = async (
  category: FileMetadata['category']
): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('category', '==', category),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getFileMetadataByUploader = async (userId: string): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('uploadedBy', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getFileMetadataByAge = async (cutoffDate: string): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('uploadedAt', '<', cutoffDate),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getAllFileMetadata = async (limitCount?: number): Promise<FileMetadata[]> => {
  let metadataQuery = query(collection(db, 'fileMetadata'), orderBy('uploadedAt', 'desc'));

  if (limitCount) {
    metadataQuery = query(metadataQuery, limit(limitCount));
  }

  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const addFileMetadata = async (
  metadata: Omit<FileMetadata, 'id'>
): Promise<FileMetadata> => {
  const metadataCol = collection(db, 'fileMetadata');
  const docRef = await addDoc(metadataCol, metadata);
  return { id: docRef.id, ...metadata } as FileMetadata;
};

export const updateFileMetadata = async (
  id: string,
  metadata: Partial<FileMetadata>
): Promise<void> => {
  const metadataDoc = doc(db, 'fileMetadata', id);
  await updateDoc(metadataDoc, metadata);
};

export const deleteFileMetadata = async (id: string): Promise<void> => {
  const metadataDoc = doc(db, 'fileMetadata', id);
  await deleteDoc(metadataDoc);
};

export const subscribeToFileMetadata = (
  callback: (files: FileMetadata[]) => void,
  category?: FileMetadata['category'],
  userId?: string
) => {
  let metadataQuery = query(collection(db, 'fileMetadata'), orderBy('uploadedAt', 'desc'));

  if (category) {
    metadataQuery = query(metadataQuery, where('category', '==', category));
  }

  if (userId) {
    metadataQuery = query(metadataQuery, where('uploadedBy', '==', userId));
  }

  return onSnapshot(metadataQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
    callback(files);
  });
};

// --- Vendors ---
export const getVendors = async (activeOnly = false): Promise<Vendor[]> => {
  let vendorsQuery = query(collection(db, 'vendors'));
  if (activeOnly) vendorsQuery = query(vendorsQuery, where('isActive', '==', true));
  const snapshot = await getDocs(vendorsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vendor);
};

export const addVendor = async (
  vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Vendor> => {
  const vendorsCol = collection(db, 'vendors');
  const now = new Date().toISOString();
  const newVendor = removeUndefined({
    ...vendor,
    createdAt: now,
    isActive: vendor.isActive ?? true,
  });
  const docRef = await addDoc(vendorsCol, newVendor);
  return { id: docRef.id, ...newVendor } as Vendor;
};

export const updateVendor = async (id: string, vendor: Partial<Vendor>): Promise<void> => {
  const vendorDoc = doc(db, 'vendors', id);
  const clean = removeUndefined({ ...vendor, updatedAt: new Date().toISOString() });
  await updateDoc(vendorDoc, clean);
};

export const deleteVendor = async (id: string): Promise<void> => {
  const vendorDoc = doc(db, 'vendors', id);
  await deleteDoc(vendorDoc);
};

export const subscribeToVendors = (callback: (vendors: Vendor[]) => void, activeOnly = false) => {
  let vendorsQuery = query(collection(db, 'vendors'));
  if (activeOnly) vendorsQuery = query(vendorsQuery, where('isActive', '==', true));
  return onSnapshot(vendorsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vendor);
    callback(vendors);
  });
};

// --- Maintenance Budgets ---
export const getMaintenanceBudget = async (year: number): Promise<MaintenanceBudget | null> => {
  const budgetsQuery = query(
    collection(db, 'maintenanceBudgets'),
    where('year', '==', year),
    limit(1)
  );
  const snapshot = await getDocs(budgetsQuery);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as MaintenanceBudget;
};

export const addMaintenanceBudget = async (
  budget: Omit<
    MaintenanceBudget,
    'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'spentByCategory'
  >
): Promise<MaintenanceBudget> => {
  const budgetsCol = collection(db, 'maintenanceBudgets');
  const now = new Date().toISOString();
  const newBudget: Omit<MaintenanceBudget, 'id'> = {
    ...budget,
    createdAt: now,
    totalSpent: 0,
    spentByCategory: {},
  };
  const docRef = await addDoc(budgetsCol, newBudget);
  return { id: docRef.id, ...newBudget } as MaintenanceBudget;
};

export const updateMaintenanceBudget = async (
  id: string,
  budget: Partial<MaintenanceBudget>
): Promise<void> => {
  const budgetDoc = doc(db, 'maintenanceBudgets', id);
  const clean = removeUndefined({ ...budget, updatedAt: new Date().toISOString() });
  await updateDoc(budgetDoc, clean);
};

export const subscribeToMaintenanceBudget = (
  year: number,
  callback: (budget: MaintenanceBudget | null) => void
) => {
  const budgetsQuery = query(
    collection(db, 'maintenanceBudgets'),
    where('year', '==', year),
    limit(1)
  );
  return onSnapshot(budgetsQuery, snapshot => {
    if (snapshot.empty) return callback(null);
    const docSnap = snapshot.docs[0];
    callback({ id: docSnap.id, ...docSnap.data() } as MaintenanceBudget);
  });
};

// --- Maintenance Tasks ---
const computeTaskStatus = (task: MaintenanceTask): MaintenanceTask => {
  // If already in a terminal state, leave unchanged
  if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'overdue')
    return task;
  const today = new Date().toISOString().split('T')[0];
  const due = task.dueDate || task.scheduledDate;
  // For non-terminal active states (scheduled, in_progress) compute overdue
  if (due < today) {
    return { ...task, status: 'overdue' };
  }
  return task;
};

export const getMaintenanceTasks = async (
  start?: string,
  end?: string,
  status?: MaintenanceTask['status'][],
  limit_count = 50
): Promise<MaintenanceTask[]> => {
  let tasksQuery = query(collection(db, 'maintenanceTasks'));

  // Filter by status if provided (for upcoming/active tasks)
  if (status && status.length > 0) {
    tasksQuery = query(tasksQuery, where('status', 'in', status));
  }

  // Add date filtering with proper indexing
  if (start && end) {
    tasksQuery = query(
      tasksQuery,
      where('scheduledDate', '>=', start),
      where('scheduledDate', '<=', end),
      orderBy('scheduledDate', 'desc'),
      limit(limit_count)
    );
  } else if (status && status.includes('completed')) {
    // For completed tasks, order by completion date
    tasksQuery = query(tasksQuery, orderBy('completedDate', 'desc'), limit(limit_count));
  } else {
    // Default: order by scheduled date
    tasksQuery = query(tasksQuery, orderBy('scheduledDate', 'desc'), limit(limit_count));
  }

  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
  return tasks.map(computeTaskStatus);
};

// Optimized queries for dashboard performance
export const getUpcomingMaintenanceTasks = async (limit_count = 20): Promise<MaintenanceTask[]> => {
  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', 'in', ['scheduled', 'in_progress']),
    orderBy('status', 'asc'),
    orderBy('scheduledDate', 'asc'),
    limit(limit_count)
  );

  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
  return tasks.map(computeTaskStatus);
};

export const getCompletedMaintenanceTasks = async (
  page = 1,
  pageSize = 5
): Promise<{ tasks: MaintenanceTask[]; hasMore: boolean }> => {
  const offset = (page - 1) * pageSize;

  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', '==', 'completed'),
    orderBy('completedDate', 'desc'),
    limit(pageSize + 1) // Get one extra to check if there are more
  );

  const snapshot = await getDocs(tasksQuery);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);

  // Apply offset manually (Firestore doesn't have efficient offset)
  const tasks = allTasks.slice(offset, offset + pageSize).map(computeTaskStatus);
  const hasMore = allTasks.length > offset + pageSize;

  return { tasks, hasMore };
};

export const getMaintenanceTasksCount = async (): Promise<{
  total: number;
  upcoming: number;
  completed: number;
}> => {
  // Use count() aggregation for efficiency
  const totalQuery = query(collection(db, 'maintenanceTasks'));
  const upcomingQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', 'in', ['scheduled', 'in_progress'])
  );
  const completedQuery = query(
    collection(db, 'maintenanceTasks'),
    where('status', '==', 'completed')
  );

  const [totalSnap, upcomingSnap, completedSnap] = await Promise.all([
    getCountFromServer(totalQuery),
    getCountFromServer(upcomingQuery),
    getCountFromServer(completedQuery),
  ]);

  return {
    total: totalSnap.data().count,
    upcoming: upcomingSnap.data().count,
    completed: completedSnap.data().count,
  };
};

export const addMaintenanceTask = async (
  task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    status?: MaintenanceTask['status'];
  }
): Promise<MaintenanceTask> => {
  const tasksCol = collection(db, 'maintenanceTasks');
  const now = new Date().toISOString();
  const newTask: Omit<MaintenanceTask, 'id'> = {
    ...task,
    status: task.status || 'scheduled',
    createdAt: now,
    updatedAt: now,
  };
  const cleanTask = removeUndefined(newTask);
  const docRef = await addDoc(tasksCol, cleanTask);
  return computeTaskStatus({ id: docRef.id, ...cleanTask } as MaintenanceTask);
};

export const updateMaintenanceTask = async (
  id: string,
  task: Partial<MaintenanceTask>
): Promise<MaintenanceTask | undefined> => {
  const taskDoc = doc(db, 'maintenanceTasks', id);

  // First, get the current task to check if we need to handle recurrence
  const currentTaskSnap = await getDoc(taskDoc);
  if (!currentTaskSnap.exists()) {
    throw new Error('Task not found');
  }

  const currentTask = { id: currentTaskSnap.id, ...currentTaskSnap.data() } as MaintenanceTask;

  // Update the current task
  const clean = removeUndefined({ ...task, updatedAt: new Date().toISOString() });
  await updateDoc(taskDoc, clean);

  // Create the updated task object for recurrence check
  const updatedTask: MaintenanceTask = { ...currentTask, ...task };

  // Check if this update completes a recurring task and we need to create a new instance
  if (
    task.status === 'completed' &&
    currentTask.status !== 'completed' && // Only if it wasn't already completed
    shouldCreateRecurringTask(updatedTask)
  ) {
    try {
      // Create a new recurring task
      const recurringTaskData = createRecurringTaskFromCompleted(updatedTask);
      const newRecurringTask = await addMaintenanceTask({
        ...recurringTaskData,
        createdBy: updatedTask.createdBy,
      });

      return newRecurringTask;
    } catch (error) {
      console.error('Failed to create recurring task:', error);
      // Don't fail the original update if recurring task creation fails
    }
  }

  // Check if this update skips a recurring task and we need to create a new instance
  if (
    task.status === 'skipped' &&
    currentTask.status !== 'skipped' && // Only if it wasn't already skipped
    shouldCreateRecurringTaskOnSkip(updatedTask)
  ) {
    try {
      // Create a new recurring task from the skipped task
      const recurringTaskData = createRecurringTaskFromSkipped(updatedTask);
      const newRecurringTask = await addMaintenanceTask({
        ...recurringTaskData,
        createdBy: updatedTask.createdBy,
      });

      return newRecurringTask;
    } catch (error) {
      console.error('Failed to create recurring task from skipped task:', error);
      // Don't fail the original update if recurring task creation fails
    }
  }

  return undefined;
};

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
  const taskDoc = doc(db, 'maintenanceTasks', id);
  await deleteDoc(taskDoc);
};

export const subscribeToMaintenanceTasks = (
  callback: (tasks: MaintenanceTask[]) => void,
  limitCount = 200
) => {
  const tasksQuery = query(
    collection(db, 'maintenanceTasks'),
    orderBy('scheduledDate', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(tasksQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MaintenanceTask);
    callback(tasks.map(computeTaskStatus));
  });
};

// Helper to apply actualCost to budget aggregations when task completes
export const applyTaskCostToBudget = async (taskId: string): Promise<void> => {
  // Fetch task
  const taskDoc = doc(db, 'maintenanceTasks', taskId);
  const snap = await getDoc(taskDoc);
  if (!snap.exists()) return;
  const task = { id: snap.id, ...snap.data() } as MaintenanceTask;
  if (task.status !== 'completed' || !task.actualCost) return; // Only apply once when cost & completed
  const year = new Date(task.scheduledDate).getFullYear();
  const budget = await getMaintenanceBudget(year);
  if (!budget) return; // No budget defined
  const cat = task.category || 'other';
  const spentByCategory = { ...(budget.spentByCategory || {}) };
  const prev = spentByCategory[cat] || 0;
  // Prevent double count by checking a marker field on task maybe? For now ensure we only add if task.updatedAt ~ recently and not previously incremented.
  // Simplified: always increment (risk double count if editing). TODO: Add an idempotent marker (e.g., budgetApplied=true) later.
  spentByCategory[cat] = prev + (task.actualCost || 0);
  const totalSpent = (budget.totalSpent || 0) + (task.actualCost || 0);
  await updateMaintenanceBudget(budget.id, { spentByCategory, totalSpent });
};
