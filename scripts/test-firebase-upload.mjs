import fs from 'node:fs';
import path from 'node:path';

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const firebaseConfig = {
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: requireEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

const fileArg = process.argv[2] || 'test.jpg';
const folderArg = process.argv[3] || 'smoke-test';

const filePath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(filePath)) {
  throw new Error(`Arquivo não encontrado: ${filePath}`);
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

try {
  await signInAnonymously(auth);
  console.log('✅ Firebase Auth: signed in anonymously');
} catch (e) {
  console.error('❌ Firebase Auth: failed to sign in anonymously');
  throw e;
}

const bytes = fs.readFileSync(filePath);
const ext = path.extname(filePath) || '.jpg';
const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
const objectPath = `${folderArg.replace(/^\/+/, '').replace(/\/+$/, '')}/${filename}`;

const storageRef = ref(storage, objectPath);
await uploadBytes(storageRef, bytes, {
  contentType: 'image/jpeg',
});

const url = await getDownloadURL(storageRef);
console.log('✅ Upload OK');
console.log('Path:', objectPath);
console.log('URL:', url);


