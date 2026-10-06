import 'dotenv/config';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!projectId && !usingEmulator) {
  throw new Error('Set FIREBASE_PROJECT_ID before starting Rupio.');
}

const appOptions = usingEmulator
  ? { projectId: projectId || 'demo-mockpay' }
  : { credential: applicationDefault(), projectId };
const firebaseApp = getApps()[0] || initializeApp(appOptions);

export const db = getFirestore(firebaseApp);
