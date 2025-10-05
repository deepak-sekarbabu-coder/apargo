import { addDoc, collection } from 'firebase/firestore';

import { db } from '../src/lib/firebase';

const insertSampleExpenses = async () => {
  const expensesCol = collection(db, 'expenses');
  const sampleExpenses = [
    {
      amount: 150.0,
      description: 'Monthly internet bill',
      categoryId: 'utilities', // You'll need to replace with actual category ID
      paidBy: 'G1',
      owedByApartments: ['F1', 'F2', 'S1', 'S2', 'T1', 'T2'],
      perApartmentShare: 25.0,
      date: new Date().toISOString(),
      status: 'pending',
    },
    {
      amount: 80.0,
      description: 'Cleaning supplies',
      categoryId: 'cleaning', // You'll need to replace with actual category ID
      paidBy: 'F1',
      owedByApartments: [], // Cleaning expenses don't get split
      perApartmentShare: 0,
      date: new Date().toISOString(),
      status: 'completed',
    },
  ];

  try {
    for (const expense of sampleExpenses) {
      await addDoc(expensesCol, expense);
      console.log(`Added expense: ${expense.description}`);
    }
    console.log('All sample expenses added successfully!');
  } catch (error) {
    console.error('Error adding sample expenses:', error);
  }
};

// Call the function to insert the data.
insertSampleExpenses();
