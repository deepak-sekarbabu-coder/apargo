export const getFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() =>
        Promise.resolve({ exists: true, data: () => ({ fcmToken: 'test-token' }) })
      ),
      update: jest.fn(() => Promise.resolve()),
    })),
    get: jest.fn(() =>
      Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          const doc = {
            id: 'test-user-id',
            data: () => ({
              apartment: 'T1',
              fcmToken: 'test-fcm-token',
              name: 'Test User',
            }),
          };
          callback(doc);
        },
      })
    ),
  })),
}));
