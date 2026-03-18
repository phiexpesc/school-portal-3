import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - User's project
const firebaseConfig = {
  apiKey: "AIzaSyBN-EdkB55wZERcSG_a3VIWu4Kg8caQu7A",
  authDomain: "azmovie-cloud.firebaseapp.com",
  projectId: "azmovie-cloud",
  storageBucket: "azmovie-cloud.firebasestorage.app",
  messagingSenderId: "505489860753",
  appId: "1:505489860753:web:dc6579c539ed5646633730"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for better performance
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported by browser');
    }
  });
} catch (error) {
  console.log('Persistence setup error:', error);
}

// Initialize Auth
export const auth = getAuth(app);

// Test Firebase connection
export async function testFirebaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to read from a collection to test connection
    const testRef = collection(db, 'users');
    await getDocs(testRef);
    console.log('Firebase connection successful');
    return { success: true };
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    if (error?.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please check Firestore security rules.' };
    } else if (error?.code === 'not-found') {
      return { success: false, error: 'Database not found. Please ensure Firestore is enabled.' };
    } else if (error?.code === 'unavailable') {
      return { success: false, error: 'Firebase service unavailable. Check internet connection.' };
    }
    return { success: false, error: error?.message || 'Unknown Firebase error' };
  }
}

export default app;
