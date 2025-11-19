import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { removeUndefined } from './firestore-utils';
import type { MaintenanceBudget } from '../core/types';

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
