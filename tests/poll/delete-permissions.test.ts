import { deletePoll } from '../../src/lib/firestore';

// Mock firebase/app before importing firestore.ts
jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [1]),
  initializeApp: jest.fn(() => ({})),
}));

// Mock firebase/firestore used inside firestore.ts
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, _col, id) => ({ id })),
  getDoc: jest.fn(async ref => {
    if (ref.id === 'missing') {
      return { exists: () => false } as any;
    }
    return {
      exists: () => true,
      data: () => ({ createdBy: ref.id === 'pollByOwner' ? 'owner1' : 'otherCreator' }),
    } as any;
  }),
  deleteDoc: jest.fn(async () => {}),
}));

// Mock firebase/auth minimal usage
jest.mock('firebase/auth', () => ({ getAuth: jest.fn(() => ({})) }));

// Mock messaging
jest.mock('firebase/messaging', () => ({ getMessaging: jest.fn(() => ({})) }));

const { getDoc, deleteDoc } = jest.requireMock('firebase/firestore');

describe('deletePoll authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('allows creator to delete own poll', async () => {
    await expect(
      deletePoll('pollByOwner', { id: 'owner1', role: 'admin' })
    ).resolves.toBeUndefined();
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('blocks different admin from deleting others poll', async () => {
    await expect(deletePoll('pollByOwner', { id: 'admin2', role: 'admin' })).rejects.toThrow(
      /permission/i
    );
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it('allows incharge to delete others poll', async () => {
    await expect(
      deletePoll('pollByOwner', { id: 'incharge1', role: 'incharge' })
    ).resolves.toBeUndefined();
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('rejects when not authenticated', async () => {
    await expect(deletePoll('pollByOwner', undefined as any)).rejects.toThrow(/not authenticated/i);
  });

  it('throws not found for missing poll', async () => {
    await expect(deletePoll('missing', { id: 'owner1', role: 'admin' })).rejects.toThrow(
      /not found/i
    );
  });
});
