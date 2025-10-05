import { addDoc, collection } from 'firebase/firestore';

import { db } from '../src/lib/firebase';

const insertUsers = async () => {
  const usersCol = collection(db, 'users');
  const users = [
    {
      name: 'Admin User',
      email: 'admin@admin.com',
      role: 'admin',
      apartmentId: 'G1',
    },
    {
      name: 'Resident User',
      email: 'resident@example.com',
      role: 'resident',
      apartmentId: 'F1',
    },
  ];

  try {
    for (const user of users) {
      await addDoc(usersCol, user);
      console.log(`Added user: ${user.name}`);
    }
    console.log('All users added successfully!');
  } catch (error) {
    console.error('Error adding users:', error);
  }
};

// Call the function to insert the data.
insertUsers();
