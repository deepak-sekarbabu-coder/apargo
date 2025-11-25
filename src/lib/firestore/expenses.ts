import { getLogger } from '../core/logger';
import type { BalanceSheet, Expense } from '../core/types';
import { type DatabaseService, type QuerySnapshot, database } from '../database';
import {
  calculateDeltaChanges,
  computeExpenseDeltas,
  getBalanceDocId,
  removeUndefined,
} from './firestore-utils';

const logger = getLogger('Firestore');

const updateBalanceSheets = async (
  deltas: ReturnType<typeof calculateDeltaChanges>
): Promise<void> => {
  if (deltas.oldMonth === deltas.newMonth) {
    await applyDeltasToBalanceSheets(deltas.mergedDeltas, deltas.newMonth);
  } else {
    await applyDeltasToBalanceSheets(deltas.negOldDeltas, deltas.oldMonth);
    await applyDeltasToBalanceSheets(deltas.newDeltas, deltas.newMonth);
  }
};

// Apply deltas (positive or negative) to balanceSheets documents using updateDoc/addDoc

async function updateExistingBalanceSheet(
  db: DatabaseService,
  sheetDocId: string,
  delta: { totalIncomeDelta: number; totalExpensesDelta: number },
  opening: number
) {
  const sheetDoc = db.collection<BalanceSheet>('balanceSheets').doc(sheetDocId);
  const snapshot = await sheetDoc.get();
  const data = snapshot.data() as Partial<BalanceSheet>;
  const newTotalIncome = (data?.totalIncome || 0) + (delta.totalIncomeDelta || 0);
  const newTotalExpenses = (data?.totalExpenses || 0) + (delta.totalExpensesDelta || 0);
  const closingBalance = opening + newTotalIncome - newTotalExpenses;
  const updated: Partial<BalanceSheet> = {
    totalIncome: newTotalIncome,
    totalExpenses: newTotalExpenses,
    openingBalance: opening,
    closingBalance,
  };
  return sheetDoc.update(removeUndefined(updated));
}

async function createNewBalanceSheet(
  db: DatabaseService,
  sheetDocId: string,
  apartmentId: string,
  monthYear: string,
  delta: { totalIncomeDelta: number; totalExpensesDelta: number }
) {
  let openingBalance = 0;

  try {
    const [year, month] = monthYear.split('-').map(Number);
    const prevDate = new Date(year, month - 1, 1);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevMonthYear = `${prevYear}-${prevMonth}`;
    const prevDocId = getBalanceDocId(apartmentId, prevMonthYear);
    const prevSheetDoc = db.collection<BalanceSheet>('balanceSheets').doc(prevDocId);

    const prevSnap = await prevSheetDoc.get();
    if (prevSnap.exists) {
      const prevData = prevSnap.data() as BalanceSheet;
      openingBalance = prevData.closingBalance;
    }
  } catch (err) {
    logger.warn(`Could not fetch previous month balance sheet for continuity check: ${err}`);
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
  const sheetDoc = db.collection<BalanceSheet>('balanceSheets').doc(sheetDocId);
  return sheetDoc.set(newSheet);
}

export const applyDeltasToBalanceSheets = async (
  deltas: Record<string, { totalIncomeDelta: number; totalExpensesDelta: number }>,
  monthYear: string
) => {
  const db = database;
  const ops: Promise<unknown>[] = [];

  Object.entries(deltas).forEach(([apartmentId, delta]) => {
    const docId = getBalanceDocId(apartmentId, monthYear);
    const sheetDoc = db.collection<BalanceSheet>('balanceSheets').doc(docId);

    const op = sheetDoc.get().then(async snap => {
      if (snap.exists) {
        const opening = (snap.data()?.openingBalance as number) || 0;
        return updateExistingBalanceSheet(db, docId, delta, opening);
      } else {
        return createNewBalanceSheet(db, docId, apartmentId, monthYear, delta);
      }
    });

    ops.push(op);
  });

  await Promise.all(ops);
};

export const getExpenses = async (apartment?: string): Promise<Expense[]> => {
  // If apartment not provided, return recent expenses (existing behavior)
  if (!apartment) {
    const expensesCollection = database.collection<Expense>('expenses');
    const expenseSnapshot = await expensesCollection.query().get();
    return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
  }

  // When apartment is provided, perform server-side queries for relevance.
  // Firestore doesn't support OR across different fields in a single query (except in newer SDKs with 'in'/'array-contains-any').
  // We'll run two queries in parallel and merge results client-side (this avoids downloading the entire collection).
  const expensesCollection = database.collection<Expense>('expenses');
  const paidByQuery = expensesCollection
    .query()
    .where({ field: 'paidByApartment', operator: '==', value: apartment });
  const owedByQuery = expensesCollection
    .query()
    .where({ field: 'owedByApartments', operator: 'array-contains', value: apartment });

  const [paidSnap, owedSnap] = await Promise.all([paidByQuery.get(), owedByQuery.get()]);
  const paid = paidSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
  const owed = owedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);

  // Merge unique expenses by id
  const mergedById = new Map<string, Expense>();
  paid.concat(owed).forEach(e => mergedById.set(e.id as string, e));
  return Array.from(mergedById.values());
};

export const subscribeToExpenses = async (
  callback: (expenses: Expense[]) => void,
  apartment?: string
) => {
  const filters = apartment
    ? [{ field: 'paidByApartment', operator: '==' as const, value: apartment }]
    : [];
  // Only use real-time listener if UI requires live updates
  return database.subscribeToCollection<Expense>(
    'expenses',
    (snapshot: QuerySnapshot<Expense>) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
      callback(expenses);
    },
    filters
  );
};

async function updateBalanceSheetsForExpense(expense: Expense) {
  try {
    const { monthYear, deltas } = computeExpenseDeltas(expense);
    await applyDeltasToBalanceSheets(deltas, monthYear);
  } catch (err) {
    logger.error('Error updating balanceSheets after addExpense:', err);
  }
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
  const newExpense = {
    ...expense,
    date: new Date().toISOString(),
    paidByApartments: expense.paidByApartments || [],
  };

  // Set initial paid status: true if all owing apartments have paid (or none owe for no-split)
  const allPaid = (newExpense.owedByApartments || []).every(id =>
    (newExpense.paidByApartments || []).includes(id)
  );
  const expenseWithPaid = { ...newExpense, paid: allPaid };

  const expensesCollection = database.collection<Omit<Expense, 'id'>>('expenses');
  const cleanExpense = removeUndefined(expenseWithPaid);
  const docRef = await expensesCollection.add(cleanExpense);
  const fullExpense = { id: docRef.id, ...cleanExpense } as Expense;
  await updateBalanceSheetsForExpense(fullExpense);
  return fullExpense;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<void> => {
  const db = database;
  const expenseDoc = db.collection<Expense>('expenses').doc(id);
  // Fetch existing expense to compute delta
  const oldSnap = await expenseDoc.get();
  if (!oldSnap.exists) throw new Error('Expense not found');
  const oldExpense = { id: oldSnap.id, ...(oldSnap.data() as Partial<Expense>) } as Expense;

  const cleanExpense = removeUndefined(expense) as Partial<Expense>;
  await expenseDoc.update(cleanExpense);

  try {
    const newExpense = { ...oldExpense, ...cleanExpense } as Expense;
    const deltaCalc = calculateDeltaChanges(oldExpense, newExpense);
    await updateBalanceSheets(deltaCalc);
  } catch (err) {
    logger.error('Error updating balanceSheets after updateExpense:', err);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const db = database;
  const expenseDoc = db.collection<Expense>('expenses').doc(id);
  // Fetch existing expense to subtract its effect
  const snap = await expenseDoc.get();
  if (!snap.exists) return;
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
    logger.error('Error updating balanceSheets before deleteExpense:', err);
  }

  await expenseDoc.delete();
};

export const getBalanceSheets = async (
  apartmentId?: string,
  monthYear?: string
): Promise<BalanceSheet[]> => {
  const db = database;
  const sheetsCollection = db.collection<BalanceSheet>('balanceSheets');
  let queryBuilder = sheetsCollection.query();
  if (apartmentId) {
    queryBuilder = queryBuilder.where({ field: 'apartmentId', operator: '==', value: apartmentId });
  }
  if (monthYear) {
    queryBuilder = queryBuilder.where({ field: 'monthYear', operator: '==', value: monthYear });
  }
  const sheetSnapshot = await queryBuilder.get();
  return sheetSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      apartmentId: data?.apartmentId,
      monthYear: data?.monthYear,
      openingBalance: data?.openingBalance,
      totalIncome: data?.totalIncome,
      totalExpenses: data?.totalExpenses,
      closingBalance: data?.closingBalance,
    } as BalanceSheet;
  });
};

export const subscribeToBalanceSheets = async (
  callback: (sheets: BalanceSheet[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  const db = database;
  const filters: Array<{
    field: string;
    operator:
      | '=='
      | '!='
      | '<'
      | '<='
      | '>'
      | '>='
      | 'array-contains'
      | 'in'
      | 'array-contains-any';
    value: unknown;
  }> = [];
  if (apartmentId) {
    filters.push({ field: 'apartmentId', operator: '==', value: apartmentId });
  }
  if (monthYear) {
    filters.push({ field: 'monthYear', operator: '==', value: monthYear });
  }
  return db.subscribeToCollection<BalanceSheet>(
    'balanceSheets',
    (snapshot: QuerySnapshot<BalanceSheet>) => {
      const sheets = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          apartmentId: data?.apartmentId,
          monthYear: data?.monthYear,
          openingBalance: data?.openingBalance,
          totalIncome: data?.totalIncome,
          totalExpenses: data?.totalExpenses,
          closingBalance: data?.closingBalance,
        } as BalanceSheet;
      });
      callback(sheets);
    },
    filters
  );
};

// Helper function to create snapshot handlers for expense subscriptions
const createExpenseSnapshotHandler = (
  expenseMap: Map<string, Expense>,
  emitCallback: () => void
) => {
  return (snapshot: QuerySnapshot<Expense>) => {
    snapshot.docs.forEach(doc => {
      const expense = { id: doc.id, ...doc.data() } as Expense;
      expenseMap.set(doc.id, expense);
    });
    // Remove expenses that are no longer in the snapshot
    const currentIds = new Set(snapshot.docs.map(doc => doc.id));
    for (const [id] of expenseMap) {
      if (!currentIds.has(id)) {
        expenseMap.delete(id);
      }
    }
    emitCallback();
  };
};

export const subscribeToRelevantExpenses = async (
  callback: (expenses: Expense[]) => void,
  apartment: string
) => {
  const db = await database;

  // Track latest documents from each listener and merge on updates.
  const paidMap = new Map<string, Expense>();
  const owedMap = new Map<string, Expense>();

  const emitMerged = () => {
    const merged = new Map<string, Expense>();
    paidMap.forEach((v, k) => merged.set(k, v));
    owedMap.forEach((v, k) => merged.set(k, v));
    callback(Array.from(merged.values()));
  };

  const paidUnsub = await db.subscribeToCollection<Expense>(
    'expenses',
    createExpenseSnapshotHandler(paidMap, emitMerged),
    [{ field: 'paidByApartment', operator: '==', value: apartment }]
  );
  const owedUnsub = await db.subscribeToCollection<Expense>(
    'expenses',
    createExpenseSnapshotHandler(owedMap, emitMerged),
    [{ field: 'owedByApartments', operator: 'array-contains', value: apartment }]
  );

  // Return a combined unsubscribe
  return {
    unsubscribe: () => {
      paidUnsub.unsubscribe();
      owedUnsub.unsubscribe();
    },
  };
};
