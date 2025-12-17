import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase Client SDK
 *
 * IMPORTANTE:
 * - Este módulo pode ser carregado durante SSR/prerender (build do Next).
 * - Para evitar erro no build, NÃO inicializamos Firebase em nível de módulo.
 * - Só inicializamos quando realmente precisarmos (e apenas no browser).
 */

function isBrowser() {
  return typeof window !== 'undefined';
}

function getFirebaseConfig() {
  // IMPORTANTE:
  // No Next.js, variáveis NEXT_PUBLIC_* só são injetadas no bundle client quando acessadas
  // de forma ESTÁTICA. NÃO use process.env[name] (dinâmico) aqui, senão vira undefined.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing: string[] = [];
  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes no Vercel: ${missing.join(', ')}`);
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

let cachedApp: FirebaseApp | null = null;
export function getFirebaseApp(): FirebaseApp {
  if (!isBrowser()) {
    throw new Error('Firebase Client SDK não pode ser inicializado no servidor (SSR/prerender).');
  }
  if (!cachedApp) {
    cachedApp = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  }
  return cachedApp;
}

let cachedStorage: FirebaseStorage | null = null;
export function getFirebaseStorage(): FirebaseStorage {
  if (!cachedStorage) {
    cachedStorage = getStorage(getFirebaseApp());
  }
  return cachedStorage;
}

let cachedAuth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
  }
  return cachedAuth;
}


