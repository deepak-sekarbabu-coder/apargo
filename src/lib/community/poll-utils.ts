import { Poll, User } from '../core/types';
import { listenToPolls } from '../firestore/polls';

/**
 * Checks if a user has any active polls they haven't participated in yet
 * @param user The current user
 * @returns A promise that resolves to an array of polls the user hasn't voted on
 */


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
    return () => { };
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

