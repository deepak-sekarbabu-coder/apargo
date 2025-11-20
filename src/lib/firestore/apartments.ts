import type { Apartment } from '../core/types';
import { database } from '../database';

export const getApartments = async (): Promise<Apartment[]> => {
  // Only fetch needed fields for dashboard
  const apartmentsCollection = database.collection<Apartment>('apartments');
  const apartmentSnapshot = await apartmentsCollection.query().get();
  return apartmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
};
