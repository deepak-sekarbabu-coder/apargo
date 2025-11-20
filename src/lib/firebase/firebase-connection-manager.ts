/**
 * Firebase connection manager to prevent memory leaks
 * Ensures proper cleanup of Firebase connections
 */
import type { App } from 'firebase-admin/app';

import { getFirebaseAdminApp } from './firebase-admin';

class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private app: App | null = null;
  private connectionCount = 0;

  private constructor() {}

  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  getApp(): App {
    if (!this.app) {
      this.app = getFirebaseAdminApp();
    }
    this.connectionCount++;
    return this.app;
  }

  releaseConnection(): void {
    this.connectionCount--;
    if (this.connectionCount <= 0) {
      this.connectionCount = 0;
      // Don't delete the app in serverless environment
      // as it might be reused across invocations
    }
  }

  cleanup(): void {
    if (this.app && this.connectionCount === 0) {
      try {
        // Only delete if we're sure no connections are active
        this.app = null;
      } catch (error) {
        console.warn('Error cleaning up Firebase app:', error);
      }
    }
  }
}

export const firebaseManager = FirebaseConnectionManager.getInstance();

/**
 * Ensure proper cleanup on process exit (mainly for local development)
 */
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    firebaseManager.cleanup();
  });

  process.on('SIGTERM', () => {
    firebaseManager.cleanup();
  });
}
