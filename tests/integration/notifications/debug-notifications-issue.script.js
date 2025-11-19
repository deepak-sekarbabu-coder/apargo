// Debug script to identify notification issues
// Run this in your browser console while on the dashboard page

const debugNotificationIssue = async () => {
  console.log('=== DEBUGGING NOTIFICATION ISSUE ===\n');

  try {
    // Step 1: Check if Firebase modules are available
    console.log('1. Checking Firebase availability...');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../../src/lib/firebase.js');
    console.log('✅ Firebase modules loaded successfully\n');

    // Step 2: Check current user data
    console.log('2. Checking current user data...');

    // Try to get user from React context (if available)
    let currentUser = null;
    if (typeof window !== 'undefined' && window.React) {
      // This might not work, but worth trying
      console.log('Attempting to get user from React context...');
    }

    // Check localStorage for user data
    const userFromStorage = localStorage.getItem('user');
    if (userFromStorage) {
      try {
        currentUser = JSON.parse(userFromStorage);
        console.log('User from localStorage:', currentUser);
      } catch (e) {
        console.log('Failed to parse user from localStorage');
      }
    }

    if (!currentUser || !currentUser.apartment) {
      console.log('❌ No user found or user has no apartment assigned!');
      console.log('Please check your user data in Firestore and ensure apartment field is set.');
      return;
    }

    console.log('✅ Current user apartment:', currentUser.apartment);
    console.log('✅ Current user role:', currentUser.role);
    console.log('✅ Current user name:', currentUser.name, '\n');

    // Step 3: Check all notifications in database
    console.log('3. Checking all notifications in database...');
    const allNotificationsQuery = collection(db, 'notifications');
    const allNotificationsSnapshot = await getDocs(allNotificationsQuery);

    console.log(`Total notifications in database: ${allNotificationsSnapshot.size}`);

    const announcements = [];
    allNotificationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'announcement') {
        announcements.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          toApartmentId: data.toApartmentId,
          isRead: data.isRead,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          priority: data.priority,
        });
      }
    });

    console.log(`Announcement notifications found: ${announcements.length}`);
    announcements.forEach((ann, index) => {
      console.log(`Announcement ${index + 1}:`, ann);
    });
    console.log('');

    // Step 4: Test the queries that NotificationsPanel uses
    console.log('4. Testing notification queries...');

    // Query 1: Old structure (toApartmentId as string)
    const q1 = query(
      collection(db, 'notifications'),
      where('toApartmentId', '==', currentUser.apartment)
    );
    const snapshot1 = await getDocs(q1);
    console.log(`Query 1 (toApartmentId == '${currentUser.apartment}'): ${snapshot1.size} results`);

    // Query 2: New structure (toApartmentId as array)
    const q2 = query(
      collection(db, 'notifications'),
      where('toApartmentId', 'array-contains', currentUser.apartment)
    );
    const snapshot2 = await getDocs(q2);
    console.log(
      `Query 2 (toApartmentId array-contains '${currentUser.apartment}'): ${snapshot2.size} results`
    );

    // Step 5: Check if notifications should be visible
    console.log('\n5. Checking notification visibility...');
    const now = new Date();

    let visibleNotifications = 0;
    let expiredNotifications = 0;
    let readNotifications = 0;

    [snapshot1, snapshot2].forEach(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        // Check if expired
        if (data.type === 'announcement' && data.expiresAt) {
          const expiryDate = new Date(data.expiresAt);
          if (expiryDate < now) {
            expiredNotifications++;
            console.log(`❌ Expired notification: ${data.title} (expired: ${data.expiresAt})`);
            return;
          }
        }

        // Check if read
        let isReadForUser = false;
        if (
          data.type === 'announcement' &&
          typeof data.isRead === 'object' &&
          data.isRead !== null
        ) {
          isReadForUser = data.isRead[currentUser.apartment] || false;
        } else {
          isReadForUser = Boolean(data.isRead);
        }

        if (isReadForUser) {
          readNotifications++;
          console.log(`📖 Read notification: ${data.title}`);
        } else {
          visibleNotifications++;
          console.log(`✅ Visible notification: ${data.title}`);
        }
      });
    });

    console.log(`\nSummary:`);
    console.log(`- Visible notifications: ${visibleNotifications}`);
    console.log(`- Read notifications: ${readNotifications}`);
    console.log(`- Expired notifications: ${expiredNotifications}`);

    // Step 6: Recommendations
    console.log('\n6. Recommendations:');
    if (visibleNotifications === 0) {
      console.log('❌ No visible notifications found. Possible issues:');
      console.log('   - User apartment does not match notification toApartmentId');
      console.log('   - All notifications are expired');
      console.log('   - All notifications are marked as read');
      console.log('   - NotificationsPanel component is not rendering properly');
    } else {
      console.log('✅ Notifications should be visible. Check if:');
      console.log('   - NotificationsPanel is properly imported and rendered');
      console.log('   - There are no JavaScript errors in the console');
      console.log('   - The notification bell icon appears in the header');
    }
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are on the dashboard page');
    console.log('2. Make sure you are logged in');
    console.log('3. Check the browser console for any errors');
    console.log('4. Try refreshing the page and running this script again');
  }
};

// Run the debug function
debugNotificationIssue();
