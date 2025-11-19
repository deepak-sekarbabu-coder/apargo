// Test script to verify the announcement system with array structure
// Run this in your browser console while logged in as admin

const testArrayNotifications = async () => {
  console.log('=== Testing Announcement System (Array Structure) ===');

  try {
    // First, test the test notifications endpoint
    console.log('\n1. Testing notification creation with array structure...');
    const testResponse = await fetch('/api/test-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test notification created:', testData);
      console.log('User details:', testData.userDetails);
      console.log('Apartments found:', testData.apartments);
      console.log('Single notification created for all apartments:', testData.notificationsCreated);
    } else {
      const testError = await testResponse.json();
      console.error('❌ Test notification failed:', testError);
    }

    // Wait a moment for the test notification to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now test the actual announcement creation
    console.log('\n2. Creating actual announcement (single notification with apartment array)...');
    const announcementResponse = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Array Structure Announcement',
        message: 'This announcement uses a single notification with toApartmentId as an array!',
        priority: 'high',
      }),
    });

    const announcementData = await announcementResponse.json();

    if (announcementResponse.ok) {
      console.log('✅ Announcement notification created successfully:', announcementData);
      console.log('Single notification ID:', announcementData.notificationId);
      console.log('Apartments included in array:', announcementData.apartmentsNotified);
      console.log('Total apartments:', announcementData.totalApartments);
    } else {
      console.error('❌ Announcement creation failed:', announcementData);
    }

    // Check if notifications appear in the UI
    console.log('\n3. Check your notifications panel - you should see the new announcements!');
    console.log('4. Check Firestore console - you should see:');
    console.log('   - Single notification document with toApartmentId as an array');
    console.log('   - isRead as an object with apartment IDs as keys');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

testArrayNotifications();
