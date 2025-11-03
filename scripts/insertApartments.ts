import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

import { getApartmentIds } from '../src/lib/apartment-constants';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Try to read service account from apartgo.json
    const serviceAccountPath = path.join(process.cwd(), 'apartgo.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      // Ensure private key has correct newline characters
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      throw new Error('apartgo.json service account file not found');
    }
  }
  return getApps()[0];
};

const insertApartments = async () => {
  try {
    // Initialize Firebase Admin
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);

    const apartmentsCol = db.collection('apartments');
    const apartmentIds = getApartmentIds();

    console.log(`Starting apartment insertion for ${apartmentIds.length} apartments...`);

    const existingApartmentsSnapshot = await apartmentsCol.get();
    const existingApartmentIds = new Set(existingApartmentsSnapshot.docs.map(doc => doc.data().id));

    if (existingApartmentIds.size > 0) {
      console.log(`Found ${existingApartmentIds.size} existing apartments.`);
    }

    for (const id of apartmentIds) {
      if (existingApartmentIds.has(id)) {
        console.log(`Apartment ${id} already exists. Skipping.`);
        continue;
      }

      await apartmentsCol.add({
        id: id,
        name: `Apartment ${id}`,
        members: [], // Initialize with empty members array
      });
      console.log(`Successfully added apartment ${id}.`);
    }
    console.log('Apartment insertion process finished.');
  } catch (error) {
    console.error('Error during apartment insertion:', error);
    process.exit(1);
  }
};

insertApartments();
