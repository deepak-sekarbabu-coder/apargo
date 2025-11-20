import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';

import type { Fault } from '../core/types';
import { db } from '../firebase/firebase';

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
