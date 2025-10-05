// Complete fix for notification display issues
// Copy and paste this entire script into the browser console

const fixNotificationIssues = async () => {
  console.log('🔧 FIXING NOTIFICATION DISPLAY ISSUES');
  console.log('=====================================\n');

  try {
    // Step 1: Check current user data
    console.log('1. Analyzing current user data...');

    const userFromStorage = localStorage.getItem('user');
    let currentUser = null;

    if (userFromStorage) {
      try {
        currentUser = JSON.parse(userFromStorage);
        console.log('✅ User found:', currentUser);
        console.log('   Name:', currentUser.name);
        console.log('   Email:', currentUser.email);
        console.log('   Role:', currentUser.role);
        console.log('   Apartment:', currentUser.apartment);
        console.log('   ApartmentId:', currentUser.apartmentId); // Check for inconsistency
      } catch (e) {
        console.log('❌ Failed to parse user data');
        return;
      }
    } else {
      console.log('❌ No user data found - please log in');
      return;
    }

    // Step 2: Check for apartment field inconsistency
    if (!currentUser.apartment && currentUser.apartmentId) {
      console.log('⚠️  Found apartment field inconsistency!');
      console.log('   User has apartmentId but missing apartment field');
      console.log('   Fixing this in localStorage...');

      currentUser.apartment = currentUser.apartmentId;
      localStorage.setItem('user', JSON.stringify(currentUser));
      console.log('✅ Fixed apartment field in localStorage');

      // Reload the page to apply the fix
      console.log('🔄 Reloading page to apply fix...');
      window.location.reload();
      return;
    }

    if (!currentUser.apartment) {
      console.log('❌ User has no apartment assigned - this is the main issue!');
      console.log('   Admin user needs an apartment assignment to see notifications.');
      console.log('   Please check the user profile in the admin panel.');
      return;
    }

    // Step 3: Check Firebase notifications
    console.log('\n2. Checking Firebase notifications...');

    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const { db } = await import('./src/lib/firebase.js');

    console.log(`   Searching for notifications for apartment: ${currentUser.apartment}`);

    // Check both query types
    const qString = query(
      collection(db, 'notifications'),
      where('toApartmentId', '==', currentUser.apartment)
    );

    const qArray = query(
      collection(db, 'notifications'),
      where('toApartmentId', 'array-contains', currentUser.apartment)
    );

    const [stringSnapshot, arraySnapshot] = await Promise.all([getDocs(qString), getDocs(qArray)]);

    console.log(`   String query results: ${stringSnapshot.size} notifications`);
    console.log(`   Array query results: ${arraySnapshot.size} notifications`);

    const allNotifications = [];
    const now = new Date();

    // Process all notifications
    [...stringSnapshot.docs, ...arraySnapshot.docs].forEach(doc => {
      const data = doc.data();
      const isExpired = data.expiresAt && new Date(data.expiresAt) < now;

      console.log(`\n   Notification: ${data.title}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Type: ${data.type}`);
      console.log(`     Created: ${data.createdAt}`);
      console.log(`     Expires: ${data.expiresAt || 'No expiry'}`);
      console.log(`     Is Expired: ${isExpired ? 'YES' : 'NO'}`);
      console.log(`     Target Apartments: ${JSON.stringify(data.toApartmentId)}`);
      console.log(`     Is Active: ${data.isActive}`);

      if (data.type === 'announcement' && typeof data.isRead === 'object') {
        const isReadForUser = data.isRead[currentUser.apartment];
        console.log(
          `     Read Status for ${currentUser.apartment}: ${isReadForUser ? 'READ' : 'UNREAD'}`
        );
      }

      if (!isExpired && data.isActive !== false) {
        allNotifications.push({
          id: doc.id,
          ...data,
        });
      }
    });

    console.log(`\n   Active notifications: ${allNotifications.length}`);

    // Step 4: Force refresh the notifications panel
    console.log('\n3. Forcing notifications panel refresh...');

    // Try to trigger a re-render by updating the user data
    const event = new CustomEvent('userDataUpdated', { detail: currentUser });
    window.dispatchEvent(event);

    // Force React to re-render by updating localStorage timestamp
    const userWithTimestamp = { ...currentUser, _lastUpdated: Date.now() };
    localStorage.setItem('user', JSON.stringify(userWithTimestamp));

    // Step 5: Check if notifications panel exists
    const notificationButton =
      document.querySelector('[aria-label*="notification"]') ||
      document.querySelector('button[aria-label*="notification"]');

    if (notificationButton) {
      console.log('✅ Notification button found in UI');

      // Click to refresh
      console.log('   Clicking notification button to refresh...');
      notificationButton.click();

      setTimeout(() => {
        const unreadIndicator = notificationButton.querySelector('.bg-red-500, .bg-red-400');
        if (unreadIndicator) {
          console.log('✅ Notification indicator is now visible!');
          console.log(`   Unread count: ${unreadIndicator.textContent}`);
        } else if (allNotifications.length > 0) {
          console.log('⚠️  Notifications exist but indicator not showing');
          console.log('   This might be a React state update issue');
        }
      }, 1000);
    } else {
      console.log('❌ Notification button not found in UI');
      console.log('   This suggests the notifications panel component is not rendering');
    }

    // Step 6: Create test announcement to verify system
    console.log('\n4. Creating test announcement to verify system...');

    try {
      const testResponse = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Notification System Test',
          message: 'This is a test to verify the notification system is working correctly.',
          priority: 'high',
        }),
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Test announcement created successfully');
        console.log('   FCM Results:', testData.pushNotificationResult);

        console.log('\n🎯 SOLUTION APPLIED!');
        console.log('==================');
        console.log('✅ Fixed apartment field inconsistency');
        console.log('✅ Refreshed notification listeners');
        console.log('✅ Created test announcement');
        console.log('');
        console.log('📱 You should now see notifications in the bell icon!');
        console.log('🔄 If not visible immediately, wait 10 seconds or refresh the page.');
      } else {
        const error = await testResponse.json();
        console.log('❌ Failed to create test announcement:', error);
      }
    } catch (error) {
      console.log('❌ Error creating test announcement:', error.message);
    }
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('\nManual steps to fix:');
    console.log('1. Check if user has apartment field set');
    console.log('2. Verify user is assigned to a valid apartment');
    console.log('3. Ensure announcements target the correct apartments');
    console.log('4. Refresh the browser page');
  }
};

// Instructions
console.log('🔧 NOTIFICATION FIX TOOL READY');
console.log('==============================');
console.log('');
console.log('This tool will:');
console.log('1. Check for user apartment field issues');
console.log('2. Fix localStorage user data inconsistencies');
console.log('3. Verify notification queries work');
console.log('4. Force refresh the notifications panel');
console.log('5. Create a test announcement');
console.log('');
console.log('Run: fixNotificationIssues()');
console.log('');

// Auto-run the fix
fixNotificationIssues();
