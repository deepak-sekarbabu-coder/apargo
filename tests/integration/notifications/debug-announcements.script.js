// Debug script to check announcement functionality
// Run this in your browser console on the dashboard page

console.log('=== Debugging Announcements ===');

// Check current user data
const checkUser = () => {
  // This assumes you have access to the auth context
  console.log('Current user:', window.localStorage.getItem('user') || 'No user in localStorage');

  // Check if user object is available globally (you might need to adjust this)
  if (typeof user !== 'undefined') {
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('User apartment:', user?.apartment);
  }
};

// Check notifications in Firestore
const checkNotifications = async () => {
  try {
    // You'll need to import these from your Firebase config
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../../src/lib/firebase');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.apartment) {
      console.error('User has no apartment assigned!');
      return;
    }

    const q = query(collection(db, 'notifications'), where('toApartmentId', '==', user.apartment));

    const snapshot = await getDocs(q);
    console.log('Total notifications:', snapshot.size);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Notification:', {
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        isRead: data.isRead,
      });
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
};

checkUser();
checkNotifications();
