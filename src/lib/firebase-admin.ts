import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Robust Firebase Admin Database fetcher.
 * Handles both local development (with service account) and 
 * production (with default cloud credentials).
 */
export function getAdminDb() {
  const apps = getApps();
  let app;

  if (apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zip-sma';
    
    // 1. Try to use service account if available (usually local dev)
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Firebase Admin: Initializing with Service Account Credentials');
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } catch (err) {
        // If it was somehow initialized between the check and now, use the existing one
        app = getApp();
      }
    } else {
      // 2. Default initialization (Works automatically in Firebase Cloud Functions / GCP)
      console.log('Firebase Admin: Initializing with Default Credentials');
      try {
        app = initializeApp();
      } catch (err) {
        app = getApp();
      }
    }
  } else {
    app = apps[0];
  }

  return getFirestore(app);
}
