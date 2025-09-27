import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    // For development, use a simpler configuration without service account credentials
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // If initialization fails, create a dummy app for development
    try {
      initializeApp({
        projectId: 'kotakun-dev-project',
      }, 'dev-app');
    } catch (devError) {
      console.error('Development Firebase app initialization failed:', devError);
    }
  }
}

export const admin = {
  firestore: () => getFirestore(),
};