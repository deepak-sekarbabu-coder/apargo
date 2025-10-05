// Test script to verify the announcement system (storing directly as notifications)
// Run this in your browser console while logged in as admin

const testDirectNotifications = async () => {
  console.log('=== Testing Announcement System (Direct Notifications) ===');

  try {
    // First, test the test notifications endpoint
    console.log('\n1. Testing notification creation...');
    const testResponse = await fetch('/api/test-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test notifications created:', testData);
      console.log('User details:', testData.userDetails);
      console.log('Apartments found:', testData.apartments);
      console.log('Notifications created:', testData.notificationsCreated);
    } else {
      const testError = await testResponse.json();
      console.error('❌ Test notifications failed:', testError);
    }

    // Wait a moment for the test notifications to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now test the actual announcement creation
    console.log('\n2. Creating actual announcement (stored directly as notifications)...');
    const announcementResponse = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Direct Notification Announcement',
        message: 'This announcement is stored directly as notifications in Firestore!',
        priority: 'high',
      }),
    });

    const announcementData = await announcementResponse.json();

    if (announcementResponse.ok) {
      console.log('✅ Announcement notifications created successfully:', announcementData);
      console.log('Notifications created for apartments:', announcementData.apartmentsNotified);
      console.log('Total notifications created:', announcementData.notificationsCreated);
      console.log('Notification IDs:', announcementData.notificationIds);
    } else {
      console.error('❌ Announcement creation failed:', announcementData);
    }

    // Check if notifications appear in the UI
    console.log('\n3. Check your notifications panel - you should see the new announcements!');
    console.log(
      '4. Check Firestore console - announcements should be in the "notifications" collection only'
    );
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

testDirectNotifications();
