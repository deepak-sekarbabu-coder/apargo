import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { app } from './firebase';

const storage = getStorage(app);

export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err: unknown) {
    // Provide a clearer hint when bucket config is wrong or rules block
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Firebase Storage upload failed:', err);
    if (msg.includes('storage') || msg.includes('bucket')) {
      throw new Error(
        'Upload failed. Verify Firebase Storage bucket is set to ".firebasestorage.app" and storage rules allow authenticated writes.'
      );
    }
    throw new Error('Upload failed. Please try again.');
  }
}
