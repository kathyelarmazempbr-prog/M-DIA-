import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase incorporada para funcionamento completo no GitHub Pages e local
export const firebaseConfig = {
  projectId: "media-plus-3ce69",
  appId: "1:935592312397:web:03f4015be370c3d46ea604",
  apiKey: "AIzaSyA7umu8vftacc6Rh_JbiN-tiNL3rghjjjM",
  authDomain: "media-plus-3ce69.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "media-plus-3ce69.firebasestorage.app",
  messagingSenderId: "935592312397",
  measurementId: "G-K18PZQF4GS"
};

let app: any = null;
let dbInstance: any = null;
let storageInstance: any = null;
let authInstance: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  try {
    dbInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true
    });
  } catch (e) {
    dbInstance = getFirestore(app);
  }
  storageInstance = getStorage(app);
  authInstance = getAuth(app);
  console.log(`[FIREBASE CONECTADO] Projeto ativo no GitHub Pages/Nuvem: ${firebaseConfig.projectId}`);
} catch (err) {
  console.warn("Erro ao conectar ao Firebase:", err);
}

export const db = dbInstance;
export const storage = storageInstance;
export const auth = authInstance;

export default app;

