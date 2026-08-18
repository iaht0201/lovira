import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { AccessibilitySettings, UserProfile, ActivityHistory, ActivityType } from '../types';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../constants';

import rawConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

let firebaseInitialized = false;

try {
  const config = rawConfig as Record<string, any>;
  if (config && config.apiKey) {
    if (!getApps().length) {
      app = initializeApp(config as any);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app, config.firestoreDatabaseId);
    firebaseInitialized = true;
    console.log('Firebase initialized successfully with project config.');
  }
} catch (e) {
  console.warn('Firebase config loading notice:', e);
}

export { auth, db, firebaseInitialized };

// LocalStorage Keys for fallback persistence
const LOCAL_USER_KEY = 'lovira_local_user_v1';
const LOCAL_SETTINGS_KEY = 'lovira_local_settings_v1';
const LOCAL_HISTORY_KEY = 'lovira_local_history_v1';

// Helper to get or create anonymous local ID if Firebase is offline
function getLocalUid(): string {
  let uid = localStorage.getItem(LOCAL_USER_KEY);
  if (!uid) {
    uid = 'anon_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(LOCAL_USER_KEY, uid);
  }
  return uid;
}

export async function initAnonymousUser(): Promise<{ uid: string; isAnonymous: boolean; profile: UserProfile }> {
  if (firebaseInitialized && auth) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, async (user) => {
        unsubscribe();
        if (user) {
          const profile = await getUserProfile(user.uid, user);
          resolve({ uid: user.uid, isAnonymous: user.isAnonymous, profile });
        } else {
          try {
            const cred = await signInAnonymously(auth!);
            const profile = await getUserProfile(cred.user.uid, cred.user);
            resolve({ uid: cred.user.uid, isAnonymous: true, profile });
          } catch (err) {
            console.info('Firebase Anonymous Auth is restricted on this project. Operating seamlessly in local guest mode.');
            const uid = getLocalUid();
            const profile = getLocalProfile(uid);
            resolve({ uid, isAnonymous: true, profile });
          }
        }
      });
    });
  } else {
    // Local fallback
    const uid = getLocalUid();
    const profile = getLocalProfile(uid);
    return { uid, isAnonymous: true, profile };
  }
}

function getLocalProfile(uid: string): UserProfile {
  const savedSettingsStr = localStorage.getItem(LOCAL_SETTINGS_KEY);
  let settings = DEFAULT_ACCESSIBILITY_SETTINGS;
  if (savedSettingsStr) {
    try {
      settings = { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(savedSettingsStr) };
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
  }
  return {
    uid,
    isAnonymous: true,
    displayName: null,
    email: null,
    photoURL: null,
    settings,
  };
}

export async function getUserProfile(uid: string, userObj?: User | null): Promise<UserProfile> {
  if (firebaseInitialized && db) {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid,
          isAnonymous: userObj ? userObj.isAnonymous : true,
          displayName: userObj?.displayName || data.displayName || null,
          email: userObj?.email || data.email || null,
          photoURL: userObj?.photoURL || data.photoURL || null,
          settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...(data.settings || {}) },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid,
          isAnonymous: userObj ? userObj.isAnonymous : true,
          displayName: userObj?.displayName || null,
          email: userObj?.email || null,
          photoURL: userObj?.photoURL || null,
          settings: DEFAULT_ACCESSIBILITY_SETTINGS,
        };
        await setDoc(ref, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return newProfile;
      }
    } catch (e) {
      console.warn('Error reading user profile from Firestore:', e);
    }
  }
  return getLocalProfile(uid);
}

export async function saveUserSettings(uid: string, settings: AccessibilitySettings): Promise<void> {
  // Always update local storage for immediate synchronous access
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));

  if (firebaseInitialized && db) {
    try {
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, {
        settings,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not save settings to Firestore:', e);
    }
  }
}

export async function linkGoogleAccount(): Promise<{ success: boolean; user?: User; message?: string }> {
  if (!firebaseInitialized || !auth) {
    return { success: false, message: 'Dịch vụ Firebase chưa được cấu hình trên hệ thống này.' };
  }

  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return { success: false, message: 'Chưa có người dùng hiện tại.' };
  }

  if (!currentUser.isAnonymous) {
    return { success: true, user: currentUser, message: 'Tài khoản đã được liên kết với Google.' };
  }

  try {
    const result = await linkWithPopup(currentUser, provider);
    // Update profile in firestore
    const ref = doc(db!, 'users', result.user.uid);
    await updateDoc(ref, {
      isAnonymous: false,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      updatedAt: serverTimestamp(),
    });
    return { success: true, user: result.user, message: 'Liên kết tài khoản Google thành công!' };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (errorObj.code === 'auth/credential-already-in-use') {
      return {
        success: false,
        message: 'Tài khoản Google này đã được sử dụng với một tài khoản Lovira khác. Bạn có muốn đăng nhập vào tài khoản đó không?',
      };
    }
    return {
      success: false,
      message: errorObj.message || 'Chưa thể liên kết tài khoản Google. Vui lòng thử lại sau.',
    };
  }
}

export async function saveActivityHistory(
  uid: string,
  type: ActivityType,
  title: string,
  preview: string,
  data: Record<string, unknown>
): Promise<ActivityHistory> {
  const newActivity: ActivityHistory = {
    id: 'act_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    type,
    title,
    preview,
    createdAt: new Date().toISOString(),
    data,
  };

  // Local storage fallback
  try {
    const existingStr = localStorage.getItem(LOCAL_HISTORY_KEY);
    const existingList: ActivityHistory[] = existingStr ? JSON.parse(existingStr) : [];
    existingList.unshift(newActivity);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(existingList.slice(0, 50)));
  } catch (e) {
    console.warn('Error saving local history:', e);
  }

  if (firebaseInitialized && db) {
    try {
      const historyCol = collection(db, 'users', uid, 'history');
      await setDoc(doc(historyCol, newActivity.id), {
        type,
        title,
        preview,
        createdAt: serverTimestamp(),
        data,
      });
    } catch (e) {
      console.warn('Error saving history to Firestore:', e);
    }
  }

  return newActivity;
}

export async function getActivityHistory(uid: string): Promise<ActivityHistory[]> {
  if (firebaseInitialized && db) {
    try {
      const historyCol = collection(db, 'users', uid, 'history');
      const q = query(historyCol, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items: ActivityHistory[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        let dateStr = new Date().toISOString();
        if (d.createdAt && typeof d.createdAt.toDate === 'function') {
          dateStr = d.createdAt.toDate().toISOString();
        } else if (typeof d.createdAt === 'string') {
          dateStr = d.createdAt;
        }
        items.push({
          id: docSnap.id,
          type: d.type as ActivityType,
          title: d.title || 'Hoạt động',
          preview: d.preview || '',
          createdAt: dateStr,
          data: d.data || {},
        });
      });
      if (items.length > 0) return items;
    } catch (e) {
      console.warn('Error reading history from Firestore, fallback to local storage:', e);
    }
  }

  // Fallback
  try {
    const existingStr = localStorage.getItem(LOCAL_HISTORY_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    return [];
  }
}

export async function deleteActivityHistoryItem(uid: string, historyId: string): Promise<void> {
  // Update local storage
  try {
    const existingStr = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (existingStr) {
      const list: ActivityHistory[] = JSON.parse(existingStr);
      const filtered = list.filter((item) => item.id !== historyId);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('Error deleting local history item:', e);
  }

  if (firebaseInitialized && db) {
    try {
      const itemRef = doc(db, 'users', uid, 'history', historyId);
      await deleteDoc(itemRef);
    } catch (e) {
      console.warn('Error deleting history item from Firestore:', e);
    }
  }
}

export const deleteActivityItem = deleteActivityHistoryItem;

export const initAnonymousAuth = initAnonymousUser;

export async function clearActivityHistory(uid: string): Promise<void> {
  localStorage.removeItem(LOCAL_HISTORY_KEY);
  if (firebaseInitialized && db) {
    try {
      const historyCol = collection(db, 'users', uid, 'history');
      const snap = await getDocs(historyCol);
      const deletePromises: Promise<void>[] = [];
      snap.forEach((d) => {
        deletePromises.push(deleteDoc(d.ref));
      });
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Error clearing history in Firestore:', e);
    }
  }
}
