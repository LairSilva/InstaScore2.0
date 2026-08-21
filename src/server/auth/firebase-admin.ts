import { initializeApp, getApps, App, ServiceAccount } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { AuthenticatedUser } from "./types";
import fs from "fs";
import path from "path";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;

function resolveProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return process.env.GOOGLE_CLOUD_PROJECT;
  }
  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }

  // Try reading from firebase-applet-config.json
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);
      if (config.projectId) {
        return config.projectId;
      }
    }
  } catch (err) {
    console.warn("[FirebaseAdmin] Failed to read firebase-applet-config.json:", err);
  }

  return "gen-lang-client-0841913154";
}

function resolveFirestoreDatabaseId(): string {
  if (process.env.FIRESTORE_DATABASE_ID) {
    return process.env.FIRESTORE_DATABASE_ID;
  }
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);
      if (config.firestoreDatabaseId) {
        return config.firestoreDatabaseId;
      }
    }
  } catch (err) {
    console.warn("[FirebaseAdmin] Failed to read firestoreDatabaseId from config:", err);
  }
  return "ai-studio-instascoreai-c9d99461-7aa9-47a7-aff5-dede15dc2ebe";
}

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = resolveProjectId();
  
  // Initialize with projectId. Firebase Admin can verify tokens using Google's public certificates.
  adminApp = initializeApp({
    projectId,
  });

  return adminApp;
}

export function getFirebaseAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }
  const app = getFirebaseAdminApp();
  adminAuth = getAuth(app);
  return adminAuth;
}

export function isFirestoreAdminConfigured(): boolean {
  return Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.USE_FIREBASE_ADMIN_CREDENTIALS === "true"
  );
}

export function getFirebaseAdminFirestore(): Firestore | null {
  if (!isFirestoreAdminConfigured()) {
    return null;
  }
  if (adminFirestore) {
    return adminFirestore;
  }
  const app = getFirebaseAdminApp();
  const dbId = resolveFirestoreDatabaseId();
  try {
    adminFirestore = getFirestore(app, dbId);
  } catch (e) {
    console.warn("[FirebaseAdmin] Custom databaseId instantiation fallback to default:", e);
    adminFirestore = getFirestore(app);
  }
  return adminFirestore;
}

/**
 * Verifies a Firebase ID token and returns structured AuthenticatedUser.
 * Throws an error if the token is invalid, expired, or malformed.
 */
export async function verifyFirebaseToken(token: string): Promise<AuthenticatedUser> {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }

  const auth = getFirebaseAuth();
  const decodedToken: DecodedIdToken = await auth.verifyIdToken(token);

  const isAdminClaim = Boolean(
    decodedToken.admin === true || 
    decodedToken.role === "admin" || 
    decodedToken.isAdmin === true
  );

  const user: AuthenticatedUser = {
    uid: decodedToken.uid,
    email: decodedToken.email,
    email_verified: Boolean(decodedToken.email_verified),
    admin: isAdminClaim,
    role: (decodedToken.role as string) || (isAdminClaim ? "admin" : "user"),
    authTime: decodedToken.auth_time,
    issuer: decodedToken.iss,
  };

  return user;
}
