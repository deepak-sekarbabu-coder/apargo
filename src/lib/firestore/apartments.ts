import {
  DocumentData,
  QuerySnapshot,
  collection,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';

import { db } from '../firebase';
import type { Apartment } from '../types';

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
