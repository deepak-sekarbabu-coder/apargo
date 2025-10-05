import { addDoc, collection, getDocs } from 'firebase/firestore';

import { getApartmentIds } from '../src/lib/apartment-constants';
import { db } from '../src/lib/firebase';

const insertApartments = async () => {
  const apartmentsCol = collection(db, 'apartments');
  const apartmentIds = getApartmentIds();

  console.log(`Starting apartment insertion for ${apartmentIds.length} apartments...`);

  try {
    const existingApartmentsSnapshot = await getDocs(apartmentsCol);
    const existingApartmentIds = new Set(existingApartmentsSnapshot.docs.map(doc => doc.data().id));

    if (existingApartmentIds.size > 0) {
      console.log(`Found ${existingApartmentIds.size} existing apartments.`);
    }

    for (const id of apartmentIds) {
      if (existingApartmentIds.has(id)) {
        console.log(`Apartment ${id} already exists. Skipping.`);
        continue;
      }
      await addDoc(apartmentsCol, {
        id: id,
        name: `Apartment ${id}`,
      });
      console.log(`Successfully added apartment ${id}.`);
    }
    console.log('Apartment insertion process finished.');
  } catch (error) {
    console.error('Error during apartment insertion:', error);
  }
};

insertApartments();
