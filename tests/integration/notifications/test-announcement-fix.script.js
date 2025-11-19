// Test script to verify the announcement fix
// Run this in your browser console while logged in as admin

const testAnnouncementFix = async () => {
  console.log('=== Testing Fixed Announcement System ===');

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
    } else {
      const testError = await testResponse.json();
      console.error('❌ Test notifications failed:', testError);
    }

    // Wait a moment for the test notifications to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now test the actual announcement creation
    console.log('\n2. Creating actual announcement...');
    const announcementResponse = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Fixed Announcement Test',
        message: "This announcement should now appear in all users' notifications!",
        priority: 'high',
      }),
    });

    const announcementData = await announcementResponse.json();

    if (announcementResponse.ok) {
      console.log('✅ Announcement created successfully:', announcementData);
      console.log('Notifications created for apartments:', announcementData.apartmentsNotified);
      console.log('Total notifications created:', announcementData.notificationsCreated);
    } else {
      console.error('❌ Announcement creation failed:', announcementData);
    }

    // Check if notifications appear in the UI
    console.log('\n3. Check your notifications panel - you should see the new announcements!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

testAnnouncementFix();
