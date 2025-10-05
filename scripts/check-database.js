import { getFirestore } from 'firebase-admin/firestore';

import { getFirebaseAdminApp } from '../src/lib/firebase-admin.js';

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to Firebase Admin...');
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);

    // Get all users
    console.log('📋 Checking users...');
    const usersSnapshot = await adminDb.collection('users').get();
    const users = [];
    const apartmentIds = new Set();

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const user = {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        apartment: userData.apartment,
        role: userData.role,
      };
      users.push(user);
      if (userData.apartment) {
        apartmentIds.add(userData.apartment);
      }
      console.log(`  - ${user.name}: apartment=${user.apartment}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`  - Total users: ${users.length}`);
    console.log(`  - Apartments in use: [${Array.from(apartmentIds).sort().join(', ')}]`);

    // Get recent notifications
    console.log('\n🔔 Recent notifications:');
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - "${data.title}"`);
      console.log(`    toApartmentId: ${JSON.stringify(data.toApartmentId)}`);
      console.log(`    type: ${data.type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
