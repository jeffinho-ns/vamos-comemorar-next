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

function requirePublicEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

function getFirebaseConfig() {
  return {
    apiKey: requirePublicEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: requirePublicEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: requirePublicEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: requirePublicEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requirePublicEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requirePublicEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
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


