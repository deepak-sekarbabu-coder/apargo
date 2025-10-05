// Test script for announcement API
// Run this in your browser console while logged in as admin

const testAnnouncementAPI = async () => {
  console.log('=== Testing Announcement API ===');

  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Announcement',
        message: 'This is a test announcement to debug the notification system.',
        priority: 'medium',
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('API Error:', data.error);
    } else {
      console.log('✅ Announcement created successfully!');
      console.log('Announcement ID:', data.announcementId);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testAnnouncementAPI();
