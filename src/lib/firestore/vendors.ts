import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';
import { removeUndefined } from '../firestore-utils';
import type { Vendor } from '../types';

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
