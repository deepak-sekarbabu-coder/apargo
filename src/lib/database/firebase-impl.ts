import type {
  CollectionReference,
  DatabaseService,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryBuilder,
  QuerySnapshot,
  Subscription,
  WhereFilter,
} from './interfaces';

// Initialization
let firestoreModule: any;
let db: any;
let isInitialized = false;

// Initialize asynchronously for compatibility
const initPromise = (async () => {
  if (typeof window === 'undefined') {
    // Server-side: use Firebase Admin SDK
    try {
      const adminFirestore = await import('firebase-admin/firestore');
      const firebaseAdmin = await import('../firebase-admin');
      db = adminFirestore.getFirestore(firebaseAdmin.getFirebaseAdminApp());
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin Firestore:', error);
    }
  } else {
    // Client-side: initialize asynchronously
    try {
      firestoreModule = await import('firebase/firestore');
      const { db: clientDb } = await import('../firebase');
      db = clientDb;
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Client Firestore:', error);
    }
  }
})();

// Firebase-specific implementations
class FirebaseDocumentSnapshot<T = DocumentData> implements DocumentSnapshot<T> {
  constructor(private snapshot: any) {}

  get id(): string {
    return this.snapshot.id;
  }

  get exists(): boolean {
    return typeof window === 'undefined'
      ? this.snapshot.exists // Admin SDK
      : this.snapshot.exists(); // Client SDK
  }

  data(): T | undefined {
    const data =
      typeof window === 'undefined'
        ? this.snapshot.data() // Admin SDK
        : this.snapshot.data(); // Client SDK
    return data ? (data as T) : undefined;
  }
}

class FirebaseQuerySnapshot<T = DocumentData> implements QuerySnapshot<T> {
  constructor(private snapshot: any) {}

  get empty(): boolean {
    return this.snapshot.empty;
  }

  get docs(): DocumentSnapshot<T>[] {
    return this.snapshot.docs.map((doc: any) => new FirebaseDocumentSnapshot<T>(doc));
  }
}

class FirebaseDocumentReference<T = DocumentData> implements DocumentReference<T> {
  constructor(
    private collectionName: string,
    private docId: string
  ) {}

  get id(): string {
    return this.docId;
  }

  async get(): Promise<DocumentSnapshot<T>> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      const docRef = db.doc(`${this.collectionName}/${this.docId}`);
      const snapshot = await docRef.get();
      return new FirebaseDocumentSnapshot<T>(snapshot);
    } else {
      // Client-side: Client SDK
      const { doc, getDoc } = firestoreModule;
      const docRef = doc(db, this.collectionName, this.docId);
      const snapshot = await getDoc(docRef);
      return new FirebaseDocumentSnapshot<T>(snapshot);
    }
  }

  async set(data: T): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      const docRef = db.doc(`${this.collectionName}/${this.docId}`);
      await docRef.set(data);
    } else {
      // Client-side: Client SDK
      const { doc, setDoc } = firestoreModule;
      const docRef = doc(db, this.collectionName, this.docId);
      await setDoc(docRef, data);
    }
  }

  async update(data: Partial<T>): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      const docRef = db.doc(`${this.collectionName}/${this.docId}`);
      await docRef.update(data);
    } else {
      // Client-side: Client SDK
      const { doc, updateDoc } = firestoreModule;
      const docRef = doc(db, this.collectionName, this.docId);
      await updateDoc(docRef, data);
    }
  }

  async delete(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      const docRef = db.doc(`${this.collectionName}/${this.docId}`);
      await docRef.delete();
    } else {
      // Client-side: Client SDK
      const { doc, deleteDoc } = firestoreModule;
      const docRef = doc(db, this.collectionName, this.docId);
      await deleteDoc(docRef);
    }
  }
}

class FirebaseQueryBuilder<T = DocumentData> implements QueryBuilder<T> {
  private filters: WhereFilter[] = [];

  constructor(private collectionName: string) {}

  where(filter: WhereFilter): QueryBuilder<T> {
    this.filters.push(filter);
    return this;
  }

  async get(): Promise<QuerySnapshot<T>> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      let queryRef = db.collection(this.collectionName);

      for (const filter of this.filters) {
        queryRef = queryRef.where(filter.field, filter.operator, filter.value);
      }

      const snapshot = await queryRef.get();
      return new FirebaseQuerySnapshot<T>(snapshot);
    } else {
      // Client-side: Client SDK
      const { collection, query, where, getDocs } = firestoreModule;
      const collectionRef = collection(db, this.collectionName);
      let q = query(collectionRef);

      for (const filter of this.filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }

      const snapshot = await getDocs(q);
      return new FirebaseQuerySnapshot<T>(snapshot);
    }
  }
}

class FirebaseCollectionReference<T = DocumentData> implements CollectionReference<T> {
  constructor(private collectionName: string) {}

  doc(id?: string): DocumentReference<T> {
    if (!id) {
      // Generate a new ID - Firebase handles this differently, but we'll use a simple approach
      id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return new FirebaseDocumentReference<T>(this.collectionName, id);
  }

  async add(data: T): Promise<DocumentReference<T>> {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK
      if (!isInitialized) {
        await initPromise;
      }
      const docRef = db.collection(this.collectionName).doc();
      await docRef.set(data);
      return new FirebaseDocumentReference<T>(this.collectionName, docRef.id);
    } else {
      // Client-side: Client SDK
      const { collection, addDoc } = firestoreModule;
      const collectionRef = collection(db, this.collectionName);
      const docRef = await addDoc(collectionRef, data);
      return new FirebaseDocumentReference<T>(this.collectionName, docRef.id);
    }
  }

  query(): QueryBuilder<T> {
    return new FirebaseQueryBuilder<T>(this.collectionName);
  }
}

class FirebaseSubscription implements Subscription {
  constructor(private unsubscribeFn: () => void) {}

  unsubscribe(): void {
    this.unsubscribeFn();
  }
}

export class FirebaseDatabaseService implements DatabaseService {
  collection<T = DocumentData>(name: string): CollectionReference<T> {
    return new FirebaseCollectionReference<T>(name);
  }

  subscribeToCollection<T = DocumentData>(
    collectionName: string,
    callback: (snapshot: QuerySnapshot<T>) => void,
    filters: WhereFilter[] = []
  ): Subscription {
    if (typeof window === 'undefined') {
      // Server-side: Admin SDK doesn't support real-time subscriptions
      // Return a no-op subscription for SSR compatibility
      console.warn('Real-time subscriptions are not supported on the server-side');
      return new FirebaseSubscription(() => {});
    } else {
      // Client-side: Client SDK
      const { collection, query, where, onSnapshot } = firestoreModule;
      const collectionRef = collection(db, collectionName);
      let q = query(collectionRef);

      for (const filter of filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }

      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const wrappedSnapshot = new FirebaseQuerySnapshot<T>(snapshot);
        callback(wrappedSnapshot);
      });

      return new FirebaseSubscription(unsubscribe);
    }
  }
}

// Export the synchronous database service class
