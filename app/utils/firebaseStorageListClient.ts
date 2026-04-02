import { getFirebaseStorage } from "@/app/config/firebase";
import { list, ref } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

/** Extensões comuns de imagem no Storage (inclui HEIC de iPhone). */
const IMAGE_EXT =
  /\.(jpe?g|png|webp|gif|avif|svg|bmp|heic|heif|tiff?|ico)$/i;

const LIST_PAGE_SIZE = 1000;

/** Se `list` na raiz for negado pelas regras, estes prefixos costumam continuar permitidos. */
const FALLBACK_PREFIXES = ["cardapio", "galeria", "uploads", "users"];

function folderRef(storage: FirebaseStorage, path?: string) {
  const p = path?.trim();
  return p ? ref(storage, p) : ref(storage);
}

/**
 * Percorre todo o prefixo de forma recursiva. Falhas numa subpasta não cancelam as restantes.
 */
async function listPrefixRecursive(
  storage: FirebaseStorage,
  path?: string,
): Promise<string[]> {
  const out: string[] = [];
  const r = folderRef(storage, path);
  let pageToken: string | undefined;
  do {
    const res = await list(r, { maxResults: LIST_PAGE_SIZE, pageToken });
    for (const p of res.prefixes) {
      try {
        out.push(...(await listPrefixRecursive(storage, p.fullPath)));
      } catch (e) {
        console.warn(`[Firebase Storage] pasta "${p.fullPath}":`, e);
      }
    }
    for (const it of res.items) {
      if (IMAGE_EXT.test(it.name)) out.push(it.fullPath);
    }
    pageToken = res.nextPageToken;
  } while (pageToken);
  return out;
}

async function listKnownPrefixesOnly(storage: FirebaseStorage): Promise<string[]> {
  const all: string[] = [];
  for (const root of FALLBACK_PREFIXES) {
    try {
      all.push(...(await listPrefixRecursive(storage, root)));
    } catch (e) {
      console.warn(`[Firebase Storage] prefixo "${root}":`, e);
    }
  }
  try {
    const rootRef = ref(storage);
    let pageToken: string | undefined;
    do {
      const res = await list(rootRef, { maxResults: LIST_PAGE_SIZE, pageToken });
      for (const it of res.items) {
        if (IMAGE_EXT.test(it.name)) all.push(it.fullPath);
      }
      pageToken = res.nextPageToken;
    } while (pageToken);
  } catch (e) {
    console.warn("[Firebase Storage] ficheiros na raiz do bucket:", e);
  }
  return all;
}

/**
 * Lista todas as imagens: percorre o bucket inteiro a partir da raiz (todas as pastas).
 * Se a raiz não puder ser listada, tenta só prefixos habituais + ficheiros na raiz.
 */
export async function listAllImageObjectPathsClient(): Promise<string[]> {
  const storage = getFirebaseStorage();
  let all: string[] = [];
  try {
    all = await listPrefixRecursive(storage);
  } catch (e) {
    console.warn(
      "[Firebase Storage] listagem global a partir da raiz falhou — fallback por pastas:",
      e,
    );
    all = await listKnownPrefixesOnly(storage);
  }
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}
