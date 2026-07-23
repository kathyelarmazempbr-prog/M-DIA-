import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let dbInstance: any = null;
let storageInstance: any = null;
let authInstance: any = null;

try {
  if (firebaseConfig && (firebaseConfig as any).apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance =
      firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    storageInstance = getStorage(app);
    authInstance = getAuth(app);
  }
} catch (err) {
  console.warn("Erro ao conectar ao Firebase (modo offline ativado):", err);
}

export const db = dbInstance;
export const storage = storageInstance;
export const auth = authInstance;

export default app;

