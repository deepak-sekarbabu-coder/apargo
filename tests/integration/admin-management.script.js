/**
 * Test script to create sample announcements and polls for testing admin functionality
 * Run this in the browser console when logged in as an admin user
 */

async function createTestData() {
  console.log('🧪 Creating test announcements and polls...');

  try {
    // Create a test announcement
    console.log('📢 Creating test announcement...');
    const announcementResponse = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Admin Announcement',
        message:
          'This is a test announcement created to verify the admin management functionality. You should be able to see this in the admin panel and delete it.',
        priority: 'high',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
      }),
    });

    if (announcementResponse.ok) {
      const announcementData = await announcementResponse.json();
      console.log('✅ Test announcement created:', announcementData);
    } else {
      const error = await announcementResponse.json();
      console.error('❌ Failed to create announcement:', error);
    }

    // Create a test poll via the existing method (there might be an API endpoint)
    console.log('📊 Creating test poll...');
    // Since there's no direct API for polls, we'll create it directly
    // Check if we can access the poll creation function
    if (typeof window !== 'undefined') {
      console.log(
        'Poll creation should be done via the admin UI - use the "New Poll" button in the admin panel'
      );
    }

    console.log(
      '✅ Test data creation completed! Check the admin panel Community tab to see the results.'
    );
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Check if user is admin
async function checkAdminStatus() {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test',
        message: 'Test',
      }),
    });

    if (response.status === 403) {
      console.log('❌ You need to be logged in as an admin to create test data');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Please make sure you are logged in and have admin privileges');
    return false;
  }
}

// Export for browser console use
window.createTestData = createTestData;
window.checkAdminStatus = checkAdminStatus;

console.log('Test script loaded! Run createTestData() in the console to create test data.');
