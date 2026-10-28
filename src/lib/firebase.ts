import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import {
  AppStatePayload,
  ProductItem,
  SiteSettings,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  sanitizeSettings,
} from '../data/defaultConfig';

// User's Firebase Configuration for project "harbalife-calculator"
export const firebaseConfig = {
  apiKey: 'AIzaSyCP2Qo8HcBW44sGL-GMDm6A_2Z9rQKNNEY',
  authDomain: 'harbalife-calculator.firebaseapp.com',
  projectId: 'harbalife-calculator',
  storageBucket: 'harbalife-calculator.firebasestorage.app',
  messagingSenderId: '808694623864',
  appId: '1:808694623864:web:4e2cc01e5bc52162e2078d',
  measurementId: 'G-XZKD7FKG2C',
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app);
} catch (err) {
  console.warn('Firebase initialization warning:', err);
}

const STORE_COLLECTION = 'herbalife_store';
const STORE_DOC_ID = 'main';

export function subscribeToFirebaseStore(
  onData: (data: AppStatePayload) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!dbInstance) {
    return () => {};
  }
  try {
    const docRef = doc(dbInstance, STORE_COLLECTION, STORE_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.data() as Partial<AppStatePayload>;
          if (raw && Array.isArray(raw.products) && raw.products.length > 0) {
            onData({
              products: raw.products,
              settings: sanitizeSettings(raw.settings),
              updatedAt: raw.updatedAt || new Date().toISOString(),
            });
          }
        } else {
          // Automatically seed initial document into Firestore on first connection
          setDoc(
            docRef,
            {
              products: DEFAULT_PRODUCTS,
              settings: DEFAULT_SETTINGS,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch(() => {
            // ignore if rules are not open yet
          });
        }
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

export async function saveToFirebaseStore(
  products: ProductItem[],
  settings: SiteSettings
): Promise<{ ok: boolean; error?: string }> {
  if (!dbInstance) {
    return { ok: false, error: 'Firestore not initialized' };
  }
  try {
    const docRef = doc(dbInstance, STORE_COLLECTION, STORE_DOC_ID);
    const payload: AppStatePayload = {
      products,
      settings: sanitizeSettings(settings),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function fetchOnceFromFirebaseStore(): Promise<AppStatePayload | null> {
  if (!dbInstance) return null;
  try {
    const docRef = doc(dbInstance, STORE_COLLECTION, STORE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const raw = snap.data() as Partial<AppStatePayload>;
      if (raw && Array.isArray(raw.products) && raw.products.length > 0) {
        return {
          products: raw.products,
          settings: sanitizeSettings(raw.settings),
          updatedAt: raw.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // fallback if offline or rules not yet enabled
  }
  return null;
}
