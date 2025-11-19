import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { listenToPolls } from '../firestore/polls';
import { Poll, PollNotification, User } from '../core/types';

/**
 * Checks if a user has any active polls they haven't participated in yet
 * @param user The current user
 * @returns A promise that resolves to an array of polls the user hasn't voted on
 */
export const getUnvotedPolls = async (user: User | null): Promise<Poll[]> => {
  if (!user || !user.apartment) return [];

  try {
    // Get all active polls
    const pollsCol = collection(db, 'polls');
    const q = query(pollsCol, where('isActive', '==', true));
    const snapshot = await getDocs(q);

    const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll);

    // Filter out polls the user has already voted on
    return polls.filter(poll => {
      // Check if user's apartment ID is in the votes object
      return !poll.votes || !poll.votes[user.apartment];
    });
  } catch (error) {
    console.error('Error checking for unvoted polls:', error);
    return [];
  }
};

/**
 * Sets up a listener for active polls that the user hasn't voted on
 * @param user The current user
 * @param callback Function to call with unvoted polls
 * @returns A function to unsubscribe from the listener
 */
export const listenToUnvotedPolls = (
  user: User | null,
  callback: (polls: Poll[]) => void
): (() => void) => {
  if (!user || !user.apartment) {
    callback([]);
    return () => {};
  }

  return listenToPolls(polls => {
    // Filter out polls the user has already voted on
    const unvotedPolls = polls.filter(poll => {
      return !poll.votes || !poll.votes[user.apartment];
    });
    callback(unvotedPolls);
  }, true); // true = active polls only
};

/**
 * Creates a notification object for an unvoted poll
 * @param poll The poll to create a notification for
 * @param apartmentId The user's apartment ID
 * @returns A notification object
 */
export const createPollNotification = (poll: Poll, apartmentId: string): PollNotification => {
  return {
    id: `poll-${poll.id}`,
    type: 'poll',
    title: 'New Community Poll',
    message: poll.question,
    toApartmentId: apartmentId,
    createdAt: poll.createdAt,
    // Poll-specific fields can be added here if needed
    relatedExpenseId: undefined,
    fromApartmentId: undefined,
  };
};
