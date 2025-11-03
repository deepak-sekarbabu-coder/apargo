import { type QuerySnapshot, database } from '../database';
import { removeUndefined } from '../firestore-utils';
import type { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  const categoriesCollection = database.collection<Category>('categories');
  const categorySnapshot = await categoriesCollection.query().get();
  return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesCollection = database.collection<Category>('categories');
  const cleanCategory = removeUndefined(category);
  const docRef = await categoriesCollection.add(cleanCategory);
  return { id: docRef.id, ...cleanCategory } as Category;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const categoryDoc = database.collection<Category>('categories').doc(id);
  const cleanCategory = removeUndefined(category) as Partial<Category>;
  await categoryDoc.update(cleanCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = database.collection<Category>('categories').doc(id);
  await categoryDoc.delete();
};

export const subscribeToCategories = async (callback: (categories: Category[]) => void) => {
  return database.subscribeToCollection<Category>(
    'categories',
    (snapshot: QuerySnapshot<Category>) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
      callback(categories);
    }
  );
};
