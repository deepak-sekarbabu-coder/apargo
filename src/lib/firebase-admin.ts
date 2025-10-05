import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is the service account JSON object. In a production environment, you'd
// want to load this from a secure source or environment variables.
// Check for both IDX and standard environment variables
const serviceAccountString =
  process.env.IDX_FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminApp: App | null = null;
let initializationAttempted = false;
let initializationError: string | null = null;

// Check if we're in a build environment (static generation)
const isBuildTime =
  process.env.NODE_ENV === 'production' && !process.env.NETLIFY && !process.env.VERCEL;
const isStaticGeneration = process.env.NEXT_PHASE === 'phase-production-build';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App | null {
  if (initializationAttempted) {
    return adminApp;
  }

  initializationAttempted = true;

  // Skip initialization during build time static generation if no credentials
  if ((isBuildTime || isStaticGeneration) && !hasCredentials()) {
    initializationError = 'Build-time environment - Firebase Admin not initialized';
    return null;
  }

  try {
    if (getApps().length === 0) {
      let serviceAccount;

      // Try individual environment variables first (more secure)
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
      ) {
        serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`,
        };
      } else if (serviceAccountString) {
        // Fallback to JSON string
        serviceAccount = JSON.parse(serviceAccountString);
      } else {
        const errorMessage =
          'Firebase service account credentials are not set in the environment. ' +
          'Either set individual variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) ' +
          'or set FIREBASE_SERVICE_ACCOUNT_JSON with the complete JSON.';
        initializationError = errorMessage;
        throw new Error(errorMessage);
      }

      // Ensure private_key has correct newline characters.
      if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      adminApp = getApps()[0];
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Firebase Admin SDK initialization failed:', errorMessage);
    initializationError = errorMessage;
    // We don't re-throw here to avoid crashing the server on build,
    // but the app will not function correctly without a successful initialization.
    // The functions that use it will fail at runtime.
  }

  return adminApp;
}

// Helper function to check if credentials are available
function hasCredentials(): boolean {
  return !!(
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL) ||
    serviceAccountString
  );
}

export const getFirebaseAdminApp = (): App => {
  // Try to initialize if not already attempted
  const app = initializeFirebaseAdmin();

  if (!app) {
    // Provide more context about why initialization failed
    const errorDetails = initializationError || 'Unknown initialization error';
    console.error('Firebase Admin initialization failed:', errorDetails);
    console.error('Environment check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasServiceAccountJson: !!serviceAccountString,
    });
    throw new Error(
      `Firebase Admin SDK has not been initialized. ${errorDetails}. ` +
        'Check the server logs for initialization errors and ensure all required environment variables are set.'
    );
  }

  // Additional check to ensure the app is properly configured
  try {
    // This will throw if the app is not properly initialized
    getAuth(app);
  } catch (error) {
    console.error('Firebase Admin Auth service is not available:', error);
    throw new Error('Firebase Admin Auth service is not properly configured');
  }

  return app;
};

// Export a function to check if Firebase Admin is available (useful for conditional logic)
export const isFirebaseAdminAvailable = (): boolean => {
  const app = initializeFirebaseAdmin();
  return app !== null;
};

// Export initialization error for debugging
export const getInitializationError = (): string | null => {
  return initializationError;
};
