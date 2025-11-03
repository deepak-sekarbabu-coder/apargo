import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Try to read service account from apartgo.json
    const serviceAccountPath = path.join(process.cwd(), 'apartgo.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      // Ensure private key has correct newline characters
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      return initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      throw new Error('apartgo.json service account file not found');
    }
  }
  return getApps()[0];
};

const insertCategories = async () => {
  try {
    // Initialize Firebase Admin
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);

    const categoriesCol = db.collection('categories');
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

    // Check for existing categories to avoid duplicates
    const existingCategoriesSnapshot = await categoriesCol.get();
    const existingCategoryNames = new Set(
      existingCategoriesSnapshot.docs.map(doc => doc.data().name)
    );

    if (existingCategoryNames.size > 0) {
      console.log(`Found ${existingCategoryNames.size} existing categories.`);
    }

    for (const category of categories) {
      if (existingCategoryNames.has(category.name)) {
        console.log(`Category "${category.name}" already exists. Skipping.`);
        continue;
      }

      await categoriesCol.add(category);
      console.log(`Added category: ${category.name}`);
    }
    console.log('Category insertion process finished.');
  } catch (error) {
    console.error('Error adding categories:', error);
    process.exit(1);
  }
};

// Call the function to insert the data.
insertCategories();
