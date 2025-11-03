import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';
import { removeUndefined } from '../firestore-utils';
import type { User } from '../types';

export const getUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'), where('isApproved', '==', true));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment)); // Composite index: apartment
  }
  // Only fetch needed fields for user list
  usersQuery = query(usersQuery); // Add .select() if using Firestore Lite
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getAllUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment)); // Composite index: apartment
  }
  // Only fetch needed fields for user list
  usersQuery = query(usersQuery); // Add .select() if using Firestore Lite
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getUser = async (id: string): Promise<User | null> => {
  const userDoc = doc(db, 'users', id);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return { id: userSnapshot.id, ...userSnapshot.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('email', '==', email)); // Index: email
  try {
    const userSnapshot = await getDocs(q);
    if (userSnapshot.empty) {
      return null;
    }
    const doc = userSnapshot.docs[0];
    const userData = { id: doc.id, ...doc.data() } as User;
    return userData;
  } catch (error) {
    console.error('Error querying user by email:', error);
    throw error;
  }
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const usersCol = collection(db, 'users');
  const cleanUser = removeUndefined({ ...user, isApproved: false });
  const docRef = await addDoc(usersCol, cleanUser);
  return { id: docRef.id, ...cleanUser } as User;
};

export const approveUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await updateDoc(userDoc, { isApproved: true });
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  const cleanUser = removeUndefined(user) as Partial<User>;
  await updateDoc(userDoc, cleanUser);
};

export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await deleteDoc(userDoc);
};

export const subscribeToUsers = (callback: (users: User[]) => void, apartment?: string) => {
  let usersQuery = query(collection(db, 'users'), where('isApproved', '==', true));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  return onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  });
};

export const subscribeToAllUsers = (callback: (users: User[]) => void, apartment?: string) => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  return onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  });
};
