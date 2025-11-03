import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import { removeUndefined } from '../firestore-utils';
import type { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, 'categories');
  // Only fetch needed fields for category list
  const categorySnapshot = await getDocs(categoriesCol);
  return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesCol = collection(db, 'categories');
  const cleanCategory = removeUndefined(category);
  const docRef = await addDoc(categoriesCol, cleanCategory);
  return { id: docRef.id, ...cleanCategory } as Category;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  const cleanCategory = removeUndefined(category) as Partial<Category>;
  await updateDoc(categoryDoc, cleanCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  await deleteDoc(categoryDoc);
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const categoriesQuery = query(collection(db, 'categories'));
  return onSnapshot(categoriesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
    callback(categories);
  });
};
