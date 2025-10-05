// Debug notifications - Run in browser console
// This will help identify why notifications are not appearing

const debugNotifications = async () => {
  console.log('🔍 DEBUGGING NOTIFICATIONS');
  console.log('==========================\n');

  try {
    // 1. Check current user data
    console.log('1. Checking current user data...');

    const userFromStorage = localStorage.getItem('user');
    let currentUser = null;

    if (userFromStorage) {
      try {
        currentUser = JSON.parse(userFromStorage);
        console.log('✅ User found in localStorage:', currentUser);
        console.log('   Name:', currentUser.name);
        console.log('   Email:', currentUser.email);
        console.log('   Role:', currentUser.role);
        console.log('   Apartment:', currentUser.apartment);
        console.log('   FCM Token:', currentUser.fcmToken ? 'Present' : 'Missing');
      } catch (e) {
        console.log('❌ Failed to parse user from localStorage');
        return;
      }
    } else {
      console.log('❌ No user data found in localStorage');
      return;
    }

    if (!currentUser.apartment) {
      console.log('❌ Current user has no apartment assigned!');
      console.log('   This is likely why notifications are not showing.');
      console.log('   User needs an apartment assignment to receive notifications.');
      return;
    }

    // 2. Import Firebase modules and check notifications
    console.log('\n2. Checking Firestore notifications...');

    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const { db } = await import('./src/lib/firebase.js');

    // Check both query types that the component uses
    console.log(`   Checking notifications for apartment: ${currentUser.apartment}`);

    // Query 1: toApartmentId equals apartment (string match)
    const qString = query(
      collection(db, 'notifications'),
      where('toApartmentId', '==', currentUser.apartment)
    );

    const stringSnapshot = await getDocs(qString);
    console.log(`   String query results: ${stringSnapshot.size} notifications`);

    // Query 2: toApartmentId array contains apartment
    const qArray = query(
      collection(db, 'notifications'),
      where('toApartmentId', 'array-contains', currentUser.apartment)
    );

    const arraySnapshot = await getDocs(qArray);
    console.log(`   Array query results: ${arraySnapshot.size} notifications`);

    // 3. Check all notifications for this user's apartment
    const allNotifications = [];
    const now = new Date();

    // Process string query results
    stringSnapshot.forEach(doc => {
      const data = doc.data();
      allNotifications.push({
        id: doc.id,
        source: 'string-query',
        ...data,
      });
    });

    // Process array query results
    arraySnapshot.forEach(doc => {
      const data = doc.data();
      allNotifications.push({
        id: doc.id,
        source: 'array-query',
        ...data,
      });
    });

    console.log(`\n3. Total notifications found: ${allNotifications.length}`);

    // 4. Analyze each notification
    if (allNotifications.length > 0) {
      console.log('\n4. Analyzing notifications...');

      allNotifications.forEach((notif, index) => {
        console.log(`\n   Notification ${index + 1}:`);
        console.log(`     ID: ${notif.id}`);
        console.log(`     Source: ${notif.source}`);
        console.log(`     Type: ${notif.type}`);
        console.log(`     Title: ${notif.title}`);
        console.log(`     Created: ${notif.createdAt}`);
        console.log(`     Expires: ${notif.expiresAt || 'No expiry'}`);
        console.log(`     toApartmentId: ${JSON.stringify(notif.toApartmentId)}`);
        console.log(`     isRead: ${JSON.stringify(notif.isRead)}`);
        console.log(`     isActive: ${notif.isActive}`);

        // Check if expired
        if (notif.expiresAt) {
          const expiryDate = new Date(notif.expiresAt);
          const isExpired = expiryDate < now;
          console.log(`     Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);
          if (isExpired) {
            console.log(`     ❌ This notification is expired and won't show`);
          }
        }

        // Check read status for this user
        if (notif.type === 'announcement' && typeof notif.isRead === 'object') {
          const isReadForUser = notif.isRead[currentUser.apartment];
          console.log(`     Read status for ${currentUser.apartment}: ${isReadForUser}`);
        }
      });
    } else {
      console.log('❌ No notifications found for this apartment');
      console.log('\n   Possible reasons:');
      console.log('   - No announcements have been created');
      console.log('   - Announcements were created for different apartments');
      console.log('   - All announcements have expired');
      console.log('   - Database query issue');
    }

    // 5. Check all announcements in the database
    console.log('\n5. Checking ALL announcements in database...');

    const allAnnouncementsQuery = query(
      collection(db, 'notifications'),
      where('type', '==', 'announcement'),
      orderBy('createdAt', 'desc')
    );

    const allAnnouncementsSnapshot = await getDocs(allAnnouncementsQuery);
    console.log(`   Total announcements in database: ${allAnnouncementsSnapshot.size}`);

    if (allAnnouncementsSnapshot.size > 0) {
      console.log('\n   All announcements:');
      allAnnouncementsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`     ${index + 1}. ${data.title} (${data.createdAt})`);
        console.log(`        Target apartments: ${JSON.stringify(data.toApartmentId)}`);
        console.log(`        Expires: ${data.expiresAt || 'No expiry'}`);
        console.log(`        Active: ${data.isActive}`);

        // Check if this announcement should be visible to current user
        let shouldBeVisible = false;
        if (Array.isArray(data.toApartmentId)) {
          shouldBeVisible = data.toApartmentId.includes(currentUser.apartment);
        } else {
          shouldBeVisible = data.toApartmentId === currentUser.apartment;
        }

        console.log(
          `        Should be visible to ${currentUser.apartment}: ${shouldBeVisible ? 'YES' : 'NO'}`
        );
      });
    }

    // 6. Recommendations
    console.log('\n6. RECOMMENDATIONS:');
    console.log('==================');

    if (allNotifications.length === 0 && allAnnouncementsSnapshot.size === 0) {
      console.log('📋 Create a test announcement:');
      console.log('   1. Go to Admin Panel → Create Announcement');
      console.log('   2. Fill in title and message');
      console.log('   3. Click Create Announcement');
      console.log('   4. Check console for FCM delivery results');
    } else if (allNotifications.length === 0 && allAnnouncementsSnapshot.size > 0) {
      console.log('📋 Apartment targeting issue:');
      console.log('   1. Announcements exist but not targeting your apartment');
      console.log('   2. Check user apartment assignment');
      console.log('   3. Verify announcement creation includes all apartments');
    } else {
      console.log('📋 Notifications exist but not displaying:');
      console.log('   1. Check for expired notifications');
      console.log('   2. Verify React component is re-rendering');
      console.log('   3. Check browser console for React errors');
      console.log('   4. Try refreshing the page');
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are on the dashboard page');
    console.log('2. Make sure you are logged in as an admin');
    console.log('3. Check browser console for errors');
    console.log('4. Try refreshing the page');
  }
};

// Provide instructions
console.log('🔧 NOTIFICATION DEBUG TOOL LOADED');
console.log('================================');
console.log('');
console.log('Run: debugNotifications()');
console.log('');

// Auto-run
debugNotifications();
