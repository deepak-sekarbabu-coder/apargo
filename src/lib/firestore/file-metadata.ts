import {
  DocumentData,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { FileMetadata } from '../core/types';
import { db } from '../firebase/firebase';

export const getFileMetadata = async (id: string): Promise<FileMetadata | null> => {
  const fileDoc = doc(db, 'fileMetadata', id);
  const fileSnapshot = await getDoc(fileDoc);
  if (fileSnapshot.exists()) {
    return { id: fileSnapshot.id, ...fileSnapshot.data() } as FileMetadata;
  }
  return null;
};

export const getFileMetadataByCategory = async (
  category: FileMetadata['category']
): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('category', '==', category),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getFileMetadataByUploader = async (userId: string): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('uploadedBy', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getFileMetadataByAge = async (cutoffDate: string): Promise<FileMetadata[]> => {
  const metadataQuery = query(
    collection(db, 'fileMetadata'),
    where('uploadedAt', '<', cutoffDate),
    orderBy('uploadedAt', 'desc')
  );
  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const getAllFileMetadata = async (limitCount?: number): Promise<FileMetadata[]> => {
  let metadataQuery = query(collection(db, 'fileMetadata'), orderBy('uploadedAt', 'desc'));

  if (limitCount) {
    metadataQuery = query(metadataQuery, limit(limitCount));
  }

  const snapshot = await getDocs(metadataQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
};

export const addFileMetadata = async (
  metadata: Omit<FileMetadata, 'id'>
): Promise<FileMetadata> => {
  const metadataCol = collection(db, 'fileMetadata');
  const docRef = await addDoc(metadataCol, metadata);
  return { id: docRef.id, ...metadata } as FileMetadata;
};

export const updateFileMetadata = async (
  id: string,
  metadata: Partial<FileMetadata>
): Promise<void> => {
  const metadataDoc = doc(db, 'fileMetadata', id);
  await updateDoc(metadataDoc, metadata);
};

export const deleteFileMetadata = async (id: string): Promise<void> => {
  const metadataDoc = doc(db, 'fileMetadata', id);
  await deleteDoc(metadataDoc);
};

export const subscribeToFileMetadata = (
  callback: (files: FileMetadata[]) => void,
  category?: FileMetadata['category'],
  userId?: string
) => {
  let metadataQuery = query(collection(db, 'fileMetadata'), orderBy('uploadedAt', 'desc'));

  if (category) {
    metadataQuery = query(metadataQuery, where('category', '==', category));
  }

  if (userId) {
    metadataQuery = query(metadataQuery, where('uploadedBy', '==', userId));
  }

  return onSnapshot(metadataQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FileMetadata);
    callback(files);
  });
};
