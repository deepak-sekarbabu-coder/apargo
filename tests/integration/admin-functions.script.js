/**
 * Quick verification test for the admin announcement and poll management
 * This can be run in the browser console to test the firestore functions
 */

async function testFirestoreFunctions() {
  console.log('🔍 Testing Firestore functions...');

  try {
    // Test getting active announcements
    console.log('Testing getActiveAnnouncements...');

    // Import the functions (adjust the path as needed)
    const { getActiveAnnouncements, getPolls } = await import('../../src/lib/firestore.js');

    // Test announcements
    const announcements = await getActiveAnnouncements();
    console.log('📢 Active announcements:', announcements.length);
    announcements.forEach((ann, i) => {
      console.log(
        `  ${i + 1}. ${ann.title} (${ann.priority}) - ${ann.message.substring(0, 50)}...`
      );
    });

    // Test polls
    const polls = await getPolls(true); // true for active only
    console.log('📊 Active polls:', polls.length);
    polls.forEach((poll, i) => {
      const voteCount = Object.keys(poll.votes || {}).length;
      console.log(`  ${i + 1}. ${poll.question} - ${voteCount} votes`);
    });

    console.log('✅ Firestore functions test completed');
  } catch (error) {
    console.error('❌ Error testing Firestore functions:', error);
    console.log('Make sure you are on a page where the firestore module is available');
  }
}

// Export for browser console use
window.testFirestoreFunctions = testFirestoreFunctions;

console.log('Verification script loaded! Run testFirestoreFunctions() to test the functions.');
