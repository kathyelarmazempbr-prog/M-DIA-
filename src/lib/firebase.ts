import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa o Firebase (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Obtém o Firestore considerando o ID de banco configurado
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Serviços do Firebase
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
