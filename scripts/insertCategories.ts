import { addDoc, collection } from 'firebase/firestore';

import { db } from '../src/lib/firebase';

const insertCategories = async () => {
  const categoriesCol = collection(db, 'categories');
  const categories = [
    { name: 'Utilities', icon: '🏠', noSplit: false },
    { name: 'Cleaning', icon: '🧹', noSplit: true }, // No split - personal expense
    { name: 'Maintenance', icon: '🔧', noSplit: false },
    { name: 'CCTV', icon: '📹', noSplit: false },
    { name: 'Electricity', icon: '⚡', noSplit: false },
    { name: 'Supplies', icon: '📦', noSplit: false },
    { name: 'Repairs', icon: '🔧', noSplit: false },
    { name: 'Water Tank', icon: '💧', noSplit: false },
    { name: 'Security', icon: '🔒', noSplit: false },
    { name: 'Other', icon: '❓', noSplit: false },
  ];

  try {
    for (const category of categories) {
      await addDoc(categoriesCol, category);
      console.log(`Added category: ${category.name}`);
    }
    console.log('All categories added successfully!');
  } catch (error) {
    console.error('Error adding categories:', error);
  }
};

// Call the function to insert the data.
insertCategories();
