import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithPopup,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ActivityHistory } from '../types';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../constants';

let appInstance;
if (!getApps().length) {
  appInstance = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
} else {
  appInstance = getApp();
}

export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);

export async function initAnonymousAuth(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(formatUserProfile(user));
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(formatUserProfile(cred.user));
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign in fallback:', err);
          // Fallback to local session user
          resolve({
            uid: 'local_user_' + Date.now(),
            isAnonymous: true,
            displayName: 'Khách Lovira',
            email: null,
            photoURL: null,
            settings: DEFAULT_ACCESSIBILITY_SETTINGS,
          });
        }
      }
    });
  });
}

function formatUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName || (user.isAnonymous ? 'Khách Lovira' : 'Người dùng'),
    email: user.email,
    photoURL: user.photoURL,
    settings: DEFAULT_ACCESSIBILITY_SETTINGS,
  };
}

export async function linkGoogleAccount(): Promise<UserProfile | null> {
  if (!auth.currentUser) return null;
  const provider = new GoogleAuthProvider();
  try {
    const cred = await linkWithPopup(auth.currentUser, provider);
    return formatUserProfile(cred.user);
  } catch (error) {
    console.error('[Firebase Auth] Error linking Google account:', error);
    throw error;
  }
}

export async function saveActivityToFirestore(
  userId: string,
  activity: Omit<ActivityHistory, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const colRef = collection(db, 'users', userId, 'activities');
    const docRef = await addDoc(colRef, {
      ...activity,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('[Firestore] Save activity note:', error);
    return `local_${Date.now()}`;
  }
}

export async function fetchActivitiesFromFirestore(
  userId: string,
  maxCount = 20
): Promise<ActivityHistory[]> {
  try {
    const colRef = collection(db, 'users', userId, 'activities');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        preview: data.preview,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        data: data.data || {},
      };
    });
  } catch (error) {
    console.warn('[Firestore] Fetch activities note:', error);
    return [];
  }
}
