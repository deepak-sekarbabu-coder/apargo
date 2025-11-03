import { database, type DocumentSnapshot, type QuerySnapshot } from '../database';
import { removeUndefined } from '../firestore-utils';
import type { User } from '../types';

export const getUsers = async (apartment?: string): Promise<User[]> => {
  const usersCollection = database.collection<User>('users');
  let queryBuilder = usersCollection.query().where({ field: 'isApproved', operator: '==', value: true });
  if (apartment) {
    queryBuilder = queryBuilder.where({ field: 'apartment', operator: '==', value: apartment });
  }
  const userSnapshot = await queryBuilder.get();
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getAllUsers = async (apartment?: string): Promise<User[]> => {
  const usersCollection = database.collection<User>('users');
  let queryBuilder = usersCollection.query();
  if (apartment) {
    queryBuilder = queryBuilder.where({ field: 'apartment', operator: '==', value: apartment });
  }
  const userSnapshot = await queryBuilder.get();
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getUser = async (id: string): Promise<User | null> => {
  const userDoc = database.collection<User>('users').doc(id);
  const userSnapshot = await userDoc.get();
  if (userSnapshot.exists) {
    return { id: userSnapshot.id, ...userSnapshot.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersCollection = database.collection<User>('users');
  const queryBuilder = usersCollection.query().where({ field: 'email', operator: '==', value: email });
  try {
    const userSnapshot = await queryBuilder.get();
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
  const usersCollection = database.collection<User>('users');
  const cleanUser = removeUndefined({ ...user, isApproved: false });
  const docRef = await usersCollection.add(cleanUser);
  return { id: docRef.id, ...cleanUser } as User;
};

export const approveUser = async (id: string): Promise<void> => {
  const userDoc = database.collection<User>('users').doc(id);
  await userDoc.update({ isApproved: true });
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const userDoc = database.collection<User>('users').doc(id);
  const cleanUser = removeUndefined(user) as Partial<User>;
  await userDoc.update(cleanUser);
};

export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = database.collection<User>('users').doc(id);
  await userDoc.delete();
};

export const subscribeToUsers = async (callback: (users: User[]) => void, apartment?: string) => {
  const filters = [{ field: 'isApproved', operator: '==' as const, value: true }];
  if (apartment) {
    filters.push({ field: 'apartment', operator: '==' as const, value: apartment });
  }
  return database.subscribeToCollection<User>('users', (snapshot: QuerySnapshot<User>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  }, filters);
};

export const subscribeToAllUsers = async (callback: (users: User[]) => void, apartment?: string) => {
  const filters: Array<{ field: string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any'; value: any }> = [];
  if (apartment) {
    filters.push({ field: 'apartment', operator: '==', value: apartment });
  }
  return database.subscribeToCollection<User>('users', (snapshot: QuerySnapshot<User>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  }, filters);
};
