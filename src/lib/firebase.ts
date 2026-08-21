import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function getOrEnsureAuthUser(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  
  return new Promise<User | null>((resolve) => {
    let settled = false;

    // Check if onAuthStateChanged fires with an existing user session
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !settled) {
        settled = true;
        unsubscribe();
        resolve(user);
      }
    });

    // Grace period for session resolution
    setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(auth.currentUser || null);
      }
    }, 350);
  });
}

export async function ensureAuthUser(): Promise<string | null> {
  try {
    const user = await getOrEnsureAuthUser();
    return user ? user.uid : (auth.currentUser?.uid || null);
  } catch (err) {
    console.warn('[Firebase Auth] ensureAuthUser note:', err);
    return auth.currentUser ? auth.currentUser.uid : null;
  }
}

export async function getAuthIdToken(forceRefresh: boolean = false): Promise<string> {
  let user = auth.currentUser;
  if (!user) {
    user = await getOrEnsureAuthUser();
  }
  if (!user) {
    throw new Error("Usuário não autenticado no Firebase. Por favor, conecte-se com o Google para continuar.");
  }
  return await user.getIdToken(forceRefresh);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection active.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('[Firebase] Client is offline or unreachable.');
    }
    return false;
  }
}

// User sign in helper using popup
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('[Firebase Auth] Google login error:', err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function sanitizeId(rawId: string): string {
  if (!rawId) return `id_${Date.now()}`;
  const sanitized = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return (sanitized || `id_${Date.now()}`).substring(0, 120);
}

import { calculateRetentionUntil, RETENTION_POLICIES } from './data-retention-client';

// Helpers for persisting audits, start mode projects, and digital twins
export async function saveDiagnosisToFirestore(diagnosisData: any, userId?: string): Promise<string | null> {
  const currentUser = auth.currentUser;
  const uid = userId || currentUser?.uid;
  const rawId = diagnosisData.id || diagnosisData.meta?.diagnosticId || `diag_${Date.now()}`;
  const docId = sanitizeId(rawId);

  // Security & Minimization: ensure no raw base64 images exist in the persisted document
  const { print1, print2, print3, ...sanitizedData } = diagnosisData;

  const payload = {
    ...sanitizedData,
    id: docId,
    userId: uid || 'local_user',
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIAGNOSIS_DAYS),
    updatedAt: new Date().toISOString()
  };

  // Cache locally
  try {
    localStorage.setItem(`instascore_diagnosis_${docId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('[Diagnosis] Local cache error:', e);
  }

  // Cloud sync only if authenticated with a real Firebase UID
  if (!uid || !currentUser) {
    return docId;
  }

  const docRef = doc(db, 'diagnoses', docId);
  try {
    await setDoc(docRef, { ...payload, userId: uid }, { merge: true });
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `diagnoses/${docId}`);
    return null;
  }
}

export async function saveStartProjectToFirestore(projectData: any, userId?: string): Promise<string | null> {
  const currentUser = auth.currentUser;
  const uid = userId || currentUser?.uid;
  const rawId = projectData.id || `start_${Date.now()}`;
  const docId = sanitizeId(rawId);

  const payload = {
    ...projectData,
    id: docId,
    userId: uid || 'local_user',
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.START_PROJECT_DAYS),
    updatedAt: new Date().toISOString()
  };

  // Cache locally
  try {
    localStorage.setItem(`instascore_start_${docId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('[StartProject] Local cache error:', e);
  }

  // Cloud sync only if authenticated with a real Firebase UID
  if (!uid || !currentUser) {
    return docId;
  }

  const docRef = doc(db, 'start_projects', docId);
  try {
    await setDoc(docRef, { ...payload, userId: uid }, { merge: true });
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `start_projects/${docId}`);
    return null;
  }
}

export async function saveDigitalTwinToFirestore(twinData: any, userId?: string): Promise<string | null> {
  const currentUser = auth.currentUser;
  const uid = userId || currentUser?.uid;
  const rawId = twinData.id || `twin_${twinData.handle || 'user'}`;
  const docId = sanitizeId(rawId);

  const payload = {
    ...twinData,
    id: docId,
    userId: uid || 'local_user',
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIGITAL_TWIN_DAYS),
    updatedAt: new Date().toISOString()
  };

  // Cache locally
  try {
    localStorage.setItem(`instascore_digital_twin_${docId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('[DigitalTwin] Local cache error:', e);
  }

  // Cloud sync only if authenticated with a real Firebase UID
  if (!uid || !currentUser) {
    return docId;
  }

  const docRef = doc(db, 'digital_twins', docId);
  try {
    await setDoc(docRef, { ...payload, userId: uid }, { merge: true });
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `digital_twins/${docId}`);
    return null;
  }
}

