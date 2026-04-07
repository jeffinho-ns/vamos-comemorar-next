'use client';

import {
  ref,
  uploadBytes,
  getDownloadURL,
  list,
  type StorageReference,
} from 'firebase/storage';
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

const CARDAPIO_ITEMS_FOLDER = 'cardapio/items';

const DEFAULT_LIST_MAX_FILES = 2500;
const DEFAULT_LIST_MAX_DEPTH = 14;

const IMAGE_FILE_RE = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

/** Evita 3 entradas por imagem (nanoid _full / _medium / _thumb). */
function skipCardapioItemGalleryVariant(leafName: string): boolean {
  return /^[A-Za-z0-9]{10}_(medium|thumb)\.webp$/i.test(leafName);
}

function leafNameOfStorageRef(itemRef: StorageReference): string {
  const fp = itemRef.fullPath;
  const i = fp.lastIndexOf('/');
  return i >= 0 ? fp.slice(i + 1) : fp;
}

function shouldIncludeGalleryFile(itemRef: StorageReference): boolean {
  const leaf = leafNameOfStorageRef(itemRef);
  if (!IMAGE_FILE_RE.test(leaf)) return false;
  if (
    itemRef.fullPath.startsWith('cardapio/items/') &&
    skipCardapioItemGalleryVariant(leaf)
  ) {
    return false;
  }
  return true;
}

export type ListStoragePrefixOptions = {
  /** Entrar nas subpastas retornadas por `list()` (prefixes). */
  recursive?: boolean;
  maxFiles?: number;
  maxDepth?: number;
};

async function collectImagePathsFromPrefix(
  prefix: string,
  options?: ListStoragePrefixOptions,
): Promise<string[]> {
  await ensureSignedIn();
  const storage = getFirebaseStorage();
  const normalized = prefix.replace(/^\/+|\/+$/g, '');
  const recursive = options?.recursive ?? false;
  const maxFiles = Math.min(options?.maxFiles ?? DEFAULT_LIST_MAX_FILES, 6000);
  const maxDepth = Math.min(options?.maxDepth ?? DEFAULT_LIST_MAX_DEPTH, 24);

  const paths: string[] = [];

  async function walk(path: string, depth: number): Promise<void> {
    if (paths.length >= maxFiles || depth > maxDepth) return;

    const listRef = ref(storage, path);
    let pageToken: string | undefined;

    do {
      const page = await list(listRef, { maxResults: 1000, pageToken });

      for (const itemRef of page.items) {
        if (paths.length >= maxFiles) break;
        if (!shouldIncludeGalleryFile(itemRef)) continue;
        paths.push(itemRef.fullPath);
      }

      if (recursive && depth < maxDepth) {
        for (const p of page.prefixes) {
          if (paths.length >= maxFiles) break;
          await walk(p.fullPath, depth + 1);
        }
      }

      pageToken = page.nextPageToken;
    } while (pageToken && paths.length < maxFiles);
  }

  await walk(normalized, 0);
  return paths;
}

/**
 * Só enumera caminhos (sem getDownloadURL) — rápido para pastas grandes; use paginação + resolve no cliente.
 */
export async function listImagePathsFromStoragePrefix(
  prefix: string,
  options?: ListStoragePrefixOptions,
): Promise<string[]> {
  try {
    return await collectImagePathsFromPrefix(prefix, options);
  } catch (err) {
    throw new Error(
      `Falha ao autenticar ou listar o Storage. Detalhe: ${
        err instanceof Error ? err.message : 'erro desconhecido'
      }`,
    );
  }
}

/**
 * Obtém URL de download só para os caminhos pedidos (ex.: uma página da galeria).
 */
export async function getDownloadURLsForStoragePaths(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  await ensureSignedIn();
  const storage = getFirebaseStorage();
  const out: Record<string, string> = {};
  await Promise.all(
    paths.map(async (p) => {
      try {
        const r = ref(storage, p);
        out[p] = await getDownloadURL(r);
      } catch {
        /* silencioso: arquivo pode ter sido apagado */
      }
    }),
  );
  return out;
}

/**
 * Lista imagens e já resolve todas as URLs (pode ser lento em pastas enormes).
 * Prefira `listImagePathsFromStoragePrefix` + `getDownloadURLsForStoragePaths` em lotes.
 */
export async function listFilesFromStoragePrefix(
  prefix: string,
  options?: ListStoragePrefixOptions,
): Promise<{ fullPath: string; url: string }[]> {
  const pathList = await listImagePathsFromStoragePrefix(prefix, options);
  const chunkSize = 25;
  const results: { fullPath: string; url: string }[] = [];
  for (let i = 0; i < pathList.length; i += chunkSize) {
    const chunk = pathList.slice(i, i + chunkSize);
    const urls = await getDownloadURLsForStoragePaths(chunk);
    for (const p of chunk) {
      const u = urls[p];
      if (u) results.push({ fullPath: p, url: u });
    }
  }
  return results;
}

/**
 * Lista só `cardapio/items/` (sem subpastas extras).
 */
export async function listCardapioItemsFromStorage(): Promise<
  { fullPath: string; url: string }[]
> {
  return listFilesFromStoragePrefix(CARDAPIO_ITEMS_FOLDER, {
    recursive: false,
  });
}
