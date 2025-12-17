'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { signInAnonymously } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseStorage } from '@/app/config/firebase';

let signInPromise: Promise<void> | null = null;

async function ensureSignedIn() {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then(() => undefined)
      .finally(() => {
        signInPromise = null;
      });
  }
  await signInPromise;
}

const mimeToExt: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function normalizeFolder(folder?: string) {
  const f = (folder || 'uploads').trim();
  return f.replace(/^\/+/, '').replace(/\/+$/, '') || 'uploads';
}

function inferExtension(file: File): string | null {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 10 && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const fromMime = file.type ? mimeToExt[file.type] : undefined;
  return fromMime || null;
}

export async function uploadImage(file: File, folder?: string): Promise<string> {
  if (!file) throw new Error('Arquivo não informado para upload.');

  try {
    await ensureSignedIn();
  } catch (err) {
    throw new Error(
      `Falha ao autenticar no Firebase para upload. Verifique se o provedor "Anonymous" está habilitado no Firebase Auth e se as regras do Storage permitem escrita para usuários autenticados. Detalhe: ${
        err instanceof Error ? err.message : 'erro desconhecido'
      }`,
    );
  }

  const safeFolder = normalizeFolder(folder);
  const ext = inferExtension(file);
  const filename = ext ? `${uuidv4()}.${ext}` : uuidv4();
  const fullPath = `${safeFolder}/${filename}`;

  const storage = getFirebaseStorage();
  const storageRef = ref(storage, fullPath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
  });

  return await getDownloadURL(storageRef);
}


