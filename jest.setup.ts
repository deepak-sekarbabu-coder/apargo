// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn((auth: any, callback: (user: any) => void) => {
      // Simulate no user initially
      process.nextTick(() => callback(null));
      return jest.fn();
    }),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    signInWithPopup: jest.fn(),
  };

  return {
    getAuth: jest.fn(() => mockAuth),
    onAuthStateChanged: mockAuth.onAuthStateChanged,
    signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
    signOut: mockAuth.signOut,
    signInWithPopup: mockAuth.signInWithPopup,
    GoogleAuthProvider: jest.fn(() => ({})),
  };
});

jest.mock('firebase/firestore', () => {
  // Create mock document and collection references
  const mockDocRef = {
    id: 'mock-doc-id',
    path: 'mock-path',
  };

  const mockCollectionRef = {
    id: 'mock-collection',
    path: 'mock-path',
  };

  // Define getDoc separately to avoid duplicate property name issue
  const getDoc = jest.fn(async (docRef: any) => ({
    exists: true,
    data: () => ({}),
    id: 'mock-doc-id',
  }));

  return {
    getFirestore: jest.fn(() => ({})),
    initializeFirestore: jest.fn(() => ({})),
    collection: jest.fn(() => mockCollectionRef),
    doc: jest.fn(() => mockDocRef),
    addDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc, // Use the separately defined getDoc
    getDocs: jest.fn(async (query: any) => ({
      docs: [
        // Return at least one mock document to prevent issues when tests expect data
        {
          id: 'mock-apartment-id',
          data: () => ({
            name: 'Mock Apartment',
            members: ['user1', 'user2'],
          }),
        },
      ],
      empty: false,
      forEach: jest.fn(),
    })),
    query: jest.fn((query: any) => query),
    where: jest.fn((field: any, operator: any, value: any) => ({ field, operator, value })),
    orderBy: jest.fn((field: any, direction: any) => ({ field, direction })),
    limit: jest.fn((count: any) => ({ count })),
    onSnapshot: jest.fn((reference: any, callback: (snapshot: any) => void) => {
      // Immediately call the callback with empty data to simulate Firebase subscription
      process.nextTick(() => callback({ docs: [], forEach: jest.fn() }));
      return jest.fn(); // Return unsubscribe function
    }),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    arrayUnion: jest.fn((...values: any[]) => ({ values, type: 'array-union' })),
    arrayRemove: jest.fn((...values: any[]) => ({ values, type: 'array-remove' })),
    increment: jest.fn((value: any) => ({ value, type: 'increment' })),
  };
});

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onMessage: jest.fn(() => jest.fn()),
}));

// Mock browser globals that might be used in Firebase code
global.window = {
  ...global.window,
  // Add any browser-specific properties if needed
} as any;

// Mock localStorage if used
Object.defineProperty(global.window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock console to prevent test output pollution (optional)
global.console = {
  ...global.console,
  warn: jest.fn(),
  error: jest.fn(),
};
