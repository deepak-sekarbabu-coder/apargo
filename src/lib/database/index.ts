// Database abstraction layer
// This module provides a unified interface for database operations
// Currently implemented with Firebase, but can be easily swapped
import { FirebaseDatabaseService } from './firebase-impl';

export type {
  DatabaseService,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  QueryBuilder,
  Subscription,
  WhereFilter,
  DocumentData,
} from './interfaces';

// Export synchronous database service instance
export const database = new FirebaseDatabaseService();

