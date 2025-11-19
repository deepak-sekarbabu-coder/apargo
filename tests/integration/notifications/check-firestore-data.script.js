// Check Firestore data structure
// Run this in browser console

const checkFirestoreData = async () => {
  console.log('=== Checking Firestore Data ===');

  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../../src/lib/firebase');

    // Check users collection
    console.log('\n--- Users Collection ---');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('Total users:', usersSnapshot.size);

    const apartments = new Set();
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`User ${doc.id}:`, {
        name: userData.name,
        apartment: userData.apartment,
        role: userData.role,
        isApproved: userData.isApproved,
      });
      if (userData.apartment) apartments.add(userData.apartment);
    });

    console.log('Unique apartments:', Array.from(apartments));

    // Check announcements collection
    console.log('\n--- Announcements Collection ---');
    const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
    console.log('Total announcements:', announcementsSnapshot.size);

    announcementsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Announcement ${doc.id}:`, {
        title: data.title,
        message: data.message,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        priority: data.priority,
        isActive: data.isActive,
      });
    });

    // Check notifications collection
    console.log('\n--- Notifications Collection ---');
    const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
    console.log('Total notifications:', notificationsSnapshot.size);

    const announcementNotifications = [];
    notificationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'announcement') {
        announcementNotifications.push({
          id: doc.id,
          title: data.title,
          toApartmentId: data.toApartmentId,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          isRead: data.isRead,
        });
      }
    });

    console.log('Announcement notifications:', announcementNotifications);
  } catch (error) {
    console.error('Error checking Firestore data:', error);
  }
};

checkFirestoreData();
