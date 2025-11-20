import type { Apartment } from '../core/types';
import { type QuerySnapshot, database } from '../database';

export const getApartments = async (): Promise<Apartment[]> => {
  // Only fetch needed fields for dashboard
  const apartmentsCollection = database.collection<Apartment>('apartments');
  const apartmentSnapshot = await apartmentsCollection.query().get();
  return apartmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
};

export const subscribeToApartments = async (callback: (apartments: Apartment[]) => void) => {
  // Use real-time listener only if UI requires live updates
  return database.subscribeToCollection<Apartment>(
    'apartments',
    (snapshot: QuerySnapshot<Apartment>) => {
      const apartments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
      callback(apartments);
    }
  );
};
