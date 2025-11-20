// Script to replace environment variables in service worker files during build
// This is necessary because service workers can't access process.env directly
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EnvVars {
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
}

// Get environment variables
const envVars: EnvVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all required environment variables are present
const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    // In development, warn but don't fail immediately to allow local development
    if (process.env.NODE_ENV === 'development' || !process.env.CI) {
        console.warn('Missing required environment variables for service worker:', missingVars);
        console.warn('Service worker may not function correctly without these variables.');
    } else {
        // In CI/production builds, fail if environment variables are missing
        console.error(
            'Missing required environment variables for service worker in production build:',
            missingVars
        );
        process.exit(1);
    }
}

// Read the service worker files
const publicSwPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
const firebaseSwPath = path.join(__dirname, '../firebase/firebase-messaging-sw.js');

try {
    // Read files
    let publicSwContent = fs.readFileSync(publicSwPath, 'utf8');
    let firebaseSwContent = fs.readFileSync(firebaseSwPath, 'utf8');

    // Replace environment variables with actual values or keep as undefined if not set
    Object.entries(envVars).forEach(([key, value]) => {
        const placeholder = `self.__${key}`;
        const replacement = value ? JSON.stringify(value) : 'undefined';

        // Replace the placeholders in both files
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        publicSwContent = publicSwContent.replace(regex, replacement);
        firebaseSwContent = firebaseSwContent.replace(regex, replacement);
    });

    // Write back the updated files
    fs.writeFileSync(publicSwPath, publicSwContent);
    fs.writeFileSync(firebaseSwPath, firebaseSwContent);

    console.log('Environment variables successfully replaced in service worker files');
} catch (error) {
    console.error('Error replacing environment variables in service worker files:', error);
    process.exit(1);
}
