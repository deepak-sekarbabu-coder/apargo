import { getFirestore } from 'firebase-admin/firestore';

import { getApartmentIds } from '../src/lib/apartment-constants.ts';
import { getFirebaseAdminApp } from '../src/lib/firebase-admin.js';

async function validateAndFixUserApartments() {
  try {
    console.log('🔧 Validating and fixing user apartment assignments...');
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all apartments that should exist
    const expectedApartments = getApartmentIds();
    console.log('Expected apartments:', expectedApartments);

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();
    const users = [];
    const usersWithoutApartments = [];
    const apartmentsInUse = new Set();

    console.log('\n📋 Current user apartment assignments:');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const user = {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        apartment: userData.apartment,
        role: userData.role,
        propertyRole: userData.propertyRole,
      };
      users.push(user);

      if (userData.apartment) {
        apartmentsInUse.add(userData.apartment);
        console.log(`  ✅ ${user.name} -> ${user.apartment}`);
      } else {
        usersWithoutApartments.push(user);
        console.log(`  ❌ ${user.name} -> NO APARTMENT ASSIGNED`);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`  - Total users: ${users.length}`);
    console.log(`  - Users with apartments: ${users.length - usersWithoutApartments.length}`);
    console.log(`  - Users without apartments: ${usersWithoutApartments.length}`);
    console.log(`  - Apartments in use: [${Array.from(apartmentsInUse).sort().join(', ')}]`);
    console.log(
      `  - Available apartments: [${expectedApartments.filter(apt => !apartmentsInUse.has(apt)).join(', ')}]`
    );

    // Fix users without apartments
    if (usersWithoutApartments.length > 0) {
      console.log('\n🔧 Fixing users without apartment assignments:');
      const availableApartments = expectedApartments.filter(apt => !apartmentsInUse.has(apt));

      for (let i = 0; i < usersWithoutApartments.length && i < availableApartments.length; i++) {
        const user = usersWithoutApartments[i];
        const apartment = availableApartments[i];

        console.log(`  Assigning ${user.name} to apartment ${apartment}`);
        await adminDb
          .collection('users')
          .doc(user.id)
          .update({
            apartment: apartment,
            propertyRole: user.propertyRole || 'tenant', // Set default if missing
          });

        apartmentsInUse.add(apartment);
      }
    }

    // Check recent notifications
    console.log('\n🔔 Recent notifications:');
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      const targetApartments = Array.isArray(data.toApartmentId)
        ? data.toApartmentId
        : [data.toApartmentId];

      console.log(`  - "${data.title}" (${data.type})`);
      console.log(`    Target apartments: [${targetApartments.join(', ')}]`);
      console.log(
        `    Missing apartments: [${expectedApartments.filter(apt => !targetApartments.includes(apt)).join(', ')}]`
      );
    });

    console.log('\n✅ Apartment validation and fix complete!');
    console.log('🔄 Please refresh your browser to see the updated assignments.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

validateAndFixUserApartments();
