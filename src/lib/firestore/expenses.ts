import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';
import {
  calculateDeltaChanges,
  computeExpenseDeltas,
  getBalanceDocId,
  removeUndefined,
} from '../firestore-utils';
import type { BalanceSheet, Expense } from '../types';

const updateBalanceSheets = async (deltas: ReturnType<typeof calculateDeltaChanges>): Promise<void> => {
  if (deltas.oldMonth === deltas.newMonth) {
    await applyDeltasToBalanceSheets(deltas.mergedDeltas, deltas.newMonth);
  } else {
    await applyDeltasToBalanceSheets(deltas.negOldDeltas, deltas.oldMonth);
    await applyDeltasToBalanceSheets(deltas.newDeltas, deltas.newMonth);
  }
};

// Apply deltas (positive or negative) to balanceSheets documents using updateDoc/addDoc

async function updateExistingBalanceSheet(sheetDoc: any, delta: {totalIncomeDelta: number, totalExpensesDelta: number}, opening: number) {
  const data = (await getDoc(sheetDoc)).data() as Partial<BalanceSheet>;
  const newTotalIncome = (data?.totalIncome || 0) + (delta.totalIncomeDelta || 0);
  const newTotalExpenses = (data?.totalExpenses || 0) + (delta.totalExpensesDelta || 0);
  const closingBalance = opening + newTotalIncome - newTotalExpenses;
  const updated: Partial<BalanceSheet> = {
    totalIncome: newTotalIncome,
    totalExpenses: newTotalExpenses,
    openingBalance: opening,
    closingBalance,
  };
  return updateDoc(sheetDoc, removeUndefined(updated));
}

async function createNewBalanceSheet(sheetDoc: any, apartmentId: string, monthYear: string, delta: {totalIncomeDelta: number, totalExpensesDelta: number}) {
  let openingBalance = 0;

  try {
    const [year, month] = monthYear.split('-').map(Number);
    const prevDate = new Date(year, month - 1, 1);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevMonthYear = `${prevYear}-${prevMonth}`;
    const prevDocId = getBalanceDocId(apartmentId, prevMonthYear);
    const prevSheetDoc = doc(db, 'balanceSheets', prevDocId);

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
    closingBalance: openingBalance + (delta.totalIncomeDelta || 0) - (delta.totalExpensesDelta || 0),
  };
  return setDoc(sheetDoc, newSheet);
}

export const applyDeltasToBalanceSheets = async (
  deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>,
  monthYear: string
) => {
  const ops: Promise<unknown>[] = [];

  Object.entries(deltas).forEach(([apartmentId, delta]) => {
    const docId = getBalanceDocId(apartmentId, monthYear);
    const sheetDoc = doc(db, 'balanceSheets', docId);

    const op = getDoc(sheetDoc).then(async snap => {
      if (snap.exists()) {
        const opening = (snap.data()?.openingBalance as number) || 0;
        return updateExistingBalanceSheet(sheetDoc, delta, opening);
      } else {
        return createNewBalanceSheet(sheetDoc, apartmentId, monthYear, delta);
      }
    });

    ops.push(op);
  });

  await Promise.all(ops);
};

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

async function updateBalanceSheetsForExpense(expense: Expense) {
  try {
    const { monthYear, deltas } = computeExpenseDeltas(expense);
    await applyDeltasToBalanceSheets(deltas, monthYear);
  } catch (err) {
    console.error('Error updating balanceSheets after addExpense:', err);
  }
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
  const newExpense = {
    ...expense,
    date: new Date().toISOString(),
    paidByApartments: expense.paidByApartments || [],
  };
  const expensesCol = collection(db, 'expenses');
  const cleanExpense = removeUndefined(newExpense);
  const docRef = await addDoc(expensesCol, cleanExpense);
  const fullExpense = { id: docRef.id, ...cleanExpense } as Expense;
  await updateBalanceSheetsForExpense(fullExpense);
  return fullExpense;
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
    const newExpense = { ...oldExpense, ...cleanExpense } as Expense;
    const deltaCalc = calculateDeltaChanges(oldExpense, newExpense);
    await updateBalanceSheets(deltaCalc);
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

export const getBalanceSheets = async (apartmentId?: string, monthYear?: string): Promise<BalanceSheet[]> => {
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

  const paidUnsub = onSnapshot(paidByQuery, createExpenseSnapshotHandler(paidMap, emitMerged));
  const owedUnsub = onSnapshot(owedByQuery, createExpenseSnapshotHandler(owedMap, emitMerged));

  // Return a combined unsubscribe
  return () => {
    paidUnsub();
    owedUnsub();
  };
};
