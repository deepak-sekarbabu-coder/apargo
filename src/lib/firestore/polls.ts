import {
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

import type { Poll } from '../core/types';
import { db } from '../firebase/firebase';
import { removeUndefined } from './firestore-utils';

export const getPolls = async (activeOnly = false): Promise<Poll[]> => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll);
};

export const listenToPolls = (cb: (polls: Poll[]) => void, activeOnly = false) => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  return onSnapshot(q, snapshot => {
    cb(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll));
  });
};

export const addPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'votes'>): Promise<Poll> => {
  const now = new Date().toISOString();
  const newPoll = removeUndefined({
    ...poll,
    createdAt: now,
    votes: {},
  });
  const pollsCol = collection(db, 'polls');
  const docRef = await addDoc(pollsCol, newPoll);
  return { id: docRef.id, ...newPoll } as Poll;
};

export const voteOnPoll = async (
  pollId: string,
  apartmentId: string,
  optionId: string
): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) throw new Error('Poll not found');
  const poll = pollSnap.data() as Poll;
  if (poll.votes && poll.votes[apartmentId]) {
    throw new Error('This apartment has already voted.');
  }
  const update = { [`votes.${apartmentId}`]: optionId };
  await updateDoc(pollDoc, update);
};

export const getPollResults = async (pollId: string): Promise<Poll | null> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) return null;
  return { id: pollSnap.id, ...pollSnap.data() } as Poll;
};

export const closePoll = async (pollId: string): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  await updateDoc(pollDoc, { isActive: false });
};

// Secure delete: only creator or incharge role may delete a poll.
// Admins can only delete their own polls (data ownership rule).
export const deletePoll = async (
  pollId: string,
  currentUser?: { id: string; role?: string }
): Promise<void> => {
  if (!currentUser) {
    throw new Error('Not authenticated');
  }
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) throw new Error('Poll not found');
  const pollData = pollSnap.data() as Poll;
  const isOwner = pollData.createdBy === currentUser.id;
  const isIncharge = currentUser.role === 'incharge';
  if (!isOwner && !isIncharge) {
    throw new Error('You do not have permission to delete this poll');
  }
  await deleteDoc(pollDoc);
};
