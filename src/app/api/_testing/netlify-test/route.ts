import { NextRequest, NextResponse } from 'next/server';

import { getInitializationError, isFirebaseAdminAvailable } from '@/lib/firebase/firebase-admin';

export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());

  // Check Firebase configuration
  const firebaseStatus = {
    adminAvailable: isFirebaseAdminAvailable(),
    initializationError: getInitializationError(),
    credentialsConfigured: {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasServiceAccountJson: !!(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.IDX_FIREBASE_SERVICE_ACCOUNT_JSON
      ),
      hasVapidKey: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    },
    configurationSummary: {
      projectId: process.env.FIREBASE_PROJECT_ID
        ? `Set (${process.env.FIREBASE_PROJECT_ID})`
        : 'Not set',
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? `Set (${process.env.FIREBASE_PRIVATE_KEY.substring(0, 50)}...)`
        : 'Not set',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        ? `Set (${process.env.FIREBASE_CLIENT_EMAIL})`
        : 'Not set',
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        ? `Set (${process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY.substring(0, 20)}...)`
        : 'Not set',
    },
  };

  return NextResponse.json(
    {
      message: 'Netlify API routing is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      netlifyContext: process.env.NETLIFY ? 'Netlify Environment' : 'Local Environment',
      url: request.url,
      headers: {
        host: headers.host,
        'x-forwarded-for': headers['x-forwarded-for'],
        'x-forwarded-proto': headers['x-forwarded-proto'],
        'x-netlify-id': headers['x-netlify-id'],
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: process.env.NETLIFY,
        NETLIFY_DEV: process.env.NETLIFY_DEV,
      },
      firebase: firebaseStatus,
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
