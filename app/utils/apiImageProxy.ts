/**
 * Imagens: link direto no Firebase Storage
 * (https://firebasestorage.googleapis.com/v0/b/agilizaiapp-img.firebasestorage.app/o/...).
 * Converte URLs do proxy da API (/public/images/...) e nomes soltos para esse formato.
 */

const DEFAULT_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://api.agilizaiapp.com.br"
).replace(/\/+$/, "");

/** Bucket padrão do projeto (pode sobrescrever com NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET). */
const DEFAULT_FIREBASE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "agilizaiapp-img.firebasestorage.app";

/**
 * Entrega de imagens do Storage (path lógico no bucket inalterado):
 * - `direct` (padrão): URL pública Firebase (?alt=media).
 * - `app_proxy`: mesma origem `/api/media/<path>` — cache no edge/Vercel, allowlist no servidor (blindagem sem mudar pastas no bucket).
 */
function imageDeliveryMode(): "direct" | "app_proxy" {
  const v = (
    process.env.NEXT_PUBLIC_IMAGE_DELIVERY || "direct"
  ).toLowerCase();
  return v === "app_proxy" ? "app_proxy" : "direct";
}

/**
 * URL final para exibir/download: Firebase direto ou proxy do próprio Next (conforme env).
 */
export function storageObjectPathToDeliverableUrl(
  objectPath: string,
  bucket: string = DEFAULT_FIREBASE_BUCKET,
): string {
  const clean = normalizeObjectPathKey(objectPath);
  if (!clean || !bucket) return "";
  if (imageDeliveryMode() === "app_proxy") {
    return `/api/media/${clean}`;
  }
  return storageObjectPathToFirebaseUrl(clean, bucket);
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

function normalizeObjectPathKey(value: string) {
  return value.trim().split(/[?#]/)[0]?.replace(/^\/+/, "") || "";
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/**
 * Extrai o object path no bucket a partir de URL pública do Firebase/GCS ou gs://
 */
export function extractStorageObjectPathFromUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  if (raw.startsWith("gs://")) {
    const path = raw.replace(/^gs:\/\/[^/]+\//, "");
    const key = normalizeObjectPathKey(decodeSafe(path));
    return key || null;
  }

  if (!isHttpUrl(raw)) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    if (host.includes("firebasestorage.googleapis.com")) {
      const marker = "/o/";
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        const encodedPath = url.pathname.slice(idx + marker.length);
        const key = normalizeObjectPathKey(decodeSafe(encodedPath));
        return key || null;
      }
    }

    if (host === "storage.googleapis.com") {
      const pathWithoutSlash = url.pathname.replace(/^\/+/, "");
      if (!pathWithoutSlash) return null;

      const downloadMarker = "/o/";
      const downloadIdx = pathWithoutSlash.indexOf(downloadMarker);
      if (
        pathWithoutSlash.startsWith("download/storage/v1/") &&
        downloadIdx >= 0
      ) {
        const encodedPath = pathWithoutSlash.slice(
          downloadIdx + downloadMarker.length,
        );
        const key = normalizeObjectPathKey(decodeSafe(encodedPath));
        return key || null;
      }

      const [, ...rest] = pathWithoutSlash.split("/");
      if (rest.length > 0) {
        const key = normalizeObjectPathKey(decodeSafe(rest.join("/")));
        return key || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function storageObjectPathToProxyUrl(
  objectPath: string,
  apiOrigin: string = DEFAULT_ORIGIN,
): string {
  const clean = normalizeObjectPathKey(objectPath);
  if (!clean) return "";
  const origin = normalizeOrigin(apiOrigin);
  return `${origin}/public/images/${encodeURIComponent(clean)}`;
}

/** URL pública ?alt=media no Firebase (path do objeto, ex.: cardapio/items/uuid.jpg). */
export function storageObjectPathToFirebaseUrl(
  objectPath: string,
  bucket: string = DEFAULT_FIREBASE_BUCKET,
): string {
  const clean = normalizeObjectPathKey(objectPath);
  if (!clean || !bucket) return "";
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(clean)}?alt=media`;
}

/**
 * Expande nome/arquivo solto para object path em cardapio/items (alinhado à API).
 */
export function expandBasenameToCardapioItemsObjectPath(basename: string): string {
  const clean = basename.trim().replace(/^\/+/, "");
  if (!clean) return "";
  if (clean.includes("/")) return clean;

  const uuidFile =
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\.[a-z0-9]+)$/i.exec(
      clean,
    );
  if (uuidFile) {
    return `cardapio/items/${uuidFile[1]}${uuidFile[2]}`;
  }

  const nanoidVariants =
    /^([A-Za-z0-9]{10})((?:_full|_medium|_thumb))?(\.[a-z0-9]+)$/i.exec(clean);
  if (nanoidVariants) {
    const id = nanoidVariants[1];
    const variant = nanoidVariants[2];
    const ext = nanoidVariants[3] || ".webp";
    // Sem sufixo explícito: o ficheiro no bucket costuma ser ex. ABC123.webp (não ABC123_full.webp).
    if (variant) {
      return `cardapio/items/${id}${variant}${ext}`;
    }
    return `cardapio/items/${id}${ext}`;
  }

  return `cardapio/items/${clean}`;
}

const PUBLIC_IMAGES_MARKER = "/public/images/";

/** Extrai o object path após /public/images/ ou public/images/ (case-insensitive). */
function sliceAfterPublicImages(pathOrHref: string): string | null {
  const lower = pathOrHref.toLowerCase();
  let idx = lower.indexOf(PUBLIC_IMAGES_MARKER);
  let skip = PUBLIC_IMAGES_MARKER.length;
  if (idx < 0) {
    const alt = "public/images/";
    idx = lower.indexOf(alt);
    if (idx < 0) return null;
    skip = alt.length;
  }
  const rest = pathOrHref.slice(idx + skip);
  const noQuery = rest.split("?")[0]?.split("#")[0] ?? "";
  const decoded = decodeSafe(noQuery);
  return decoded ? normalizeObjectPathKey(decoded) : null;
}

function objectPathFromApiPublicImagesUrl(
  trimmed: string,
  _apiOrigin: string,
): string | null {
  const loose = extractPublicImagesObjectKeyLoose(trimmed);
  if (loose) return loose;
  try {
    if (isHttpUrl(trimmed)) {
      const u = new URL(trimmed);
      const fromPath = sliceAfterPublicImages(u.pathname);
      if (fromPath) return fromPath;
    }
  } catch {
    // ignore
  }
  // Relativo, "//host/...", ou URL atípica: busca no texto inteiro
  return sliceAfterPublicImages(trimmed);
}

/**
 * Extrai a chave do objeto após public/images mesmo com path encoded (%2F),
 * duplo encoding, ou texto solto (evita vazar URL da API para o optimizer do Next).
 */
function extractPublicImagesObjectKeyLoose(s: string): string | null {
  if (!s || typeof s !== "string") return null;
  const patterns = [
    /\/public\/images\/([^?#"'>\s]+)/i,
    /public%2Fimages%2F([^?#&"'>\s]+)/i,
    /public%252Fimages%252F([^?#&"'>\s]+)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m?.[1]) continue;
    let piece = m[1];
    for (let i = 0; i < 4; i++) {
      try {
        const next = decodeURIComponent(piece);
        if (next === piece) break;
        piece = next;
      } catch {
        break;
      }
    }
    const key = normalizeObjectPathKey(piece.split(/[&#]/)[0] ?? "");
    if (key) return key;
  }
  return null;
}

export function isLikelyApiPublicImagesHttpUrl(s: string): boolean {
  if (!isHttpUrl(s)) return false;
  const L = s.toLowerCase();
  return (
    L.includes("/public/images/") ||
    L.includes("public%2fimages%2f") ||
    L.includes("/public%2fimages/") ||
    L.includes("public%252fimages%252f")
  );
}

/**
 * Garante que URLs do proxy HTTP da API (/public/images/) não vão parar no next/image
 * (índice da galeria, lookups por filename, etc.).
 */
export function ensureDeliverableImageUrl(
  raw: string | null | undefined,
  apiOrigin: string = DEFAULT_ORIGIN,
): string {
  if (raw == null || typeof raw !== "string") return "";
  const t = raw.trim().replace(/^\uFEFF/, "");
  if (!t) return "";
  if (!isHttpUrl(t)) return t;
  const origin = normalizeOrigin(apiOrigin);
  const L = t.toLowerCase();
  const apiHostLeak =
    isLikelyApiPublicImagesHttpUrl(t) ||
    ((L.includes("api.agilizaiapp.com.br") ||
      L.includes("vamos-comemorar-api.onrender.com") ||
      L.includes("onrender.com")) &&
      (L.includes("public/images") || L.includes("public%2fimages")));
  if (!apiHostLeak) return t;
  const r = rewriteRemoteImageToApiProxy(t, origin);
  const rStillLeaky =
    r &&
    isHttpUrl(r) &&
    (isLikelyApiPublicImagesHttpUrl(r) ||
      /\/public\/images\//i.test(r) ||
      (r.toLowerCase().includes("api.") && r.toLowerCase().includes("public")));
  if (r && !rStillLeaky) return r;
  const m = rewriteToAppMediaProxy(t, origin);
  if (m.startsWith("/api/media/")) return m;
  const loose = extractPublicImagesObjectKeyLoose(t);
  if (loose) {
    const op = loose.includes("/")
      ? loose
      : expandBasenameToCardapioItemsObjectPath(loose);
    return mediaProxyUrlFromStorageKey(op);
  }
  return (r && !rStillLeaky ? r : "") || m || t;
}

/** Converte chave extraída em URL segura para o Next (Firebase ou /api/media). */
function deliverableFromPublicImagesKey(
  key: string,
  apiOrigin: string,
  trimmedSource: string,
): string {
  const objectPath = key.includes("/")
    ? key
    : expandBasenameToCardapioItemsObjectPath(key);
  const out = storageObjectPathToDeliverableUrl(objectPath);
  if (out) return out;
  const viaApp = rewriteToAppMediaProxy(trimmedSource, apiOrigin);
  if (viaApp.startsWith("/api/media/")) return viaApp;
  return mediaProxyUrlFromStorageKey(objectPath);
}

function isCloudinaryUrlString(s: string): boolean {
  const l = s.toLowerCase();
  return l.includes("res.cloudinary.com") || l.includes("cloudinary.com");
}

/** Path interno do Storage → URL do proxy do Next (admin / telas com cache na origem). */
export function mediaProxyUrlFromStorageKey(key: string): string {
  const clean = normalizeObjectPathKey(key);
  if (!clean) return "";
  return `/api/media/${clean}`;
}

/**
 * Converte qualquer referência (URL API, Firebase, filename) em `/api/media/...`
 * quando o alvo é o Firebase Storage. Cloudinary e data/blob permanecem.
 */
export function rewriteToAppMediaProxy(
  raw: string | null | undefined,
  apiOrigin: string = DEFAULT_ORIGIN,
): string {
  if (raw == null || typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (isCloudinaryUrlString(trimmed)) return trimmed;

  try {
    if (isHttpUrl(trimmed)) {
      const u = new URL(trimmed);
      if (u.pathname.startsWith("/api/media/")) {
        return `${u.pathname}${u.search || ""}`;
      }
    }
  } catch {
    // ignore
  }

  const origin = normalizeOrigin(apiOrigin);

  const fromFs = extractStorageObjectPathFromUrl(trimmed);
  if (fromFs) return mediaProxyUrlFromStorageKey(fromFs);

  const fromProxyPath = objectPathFromApiPublicImagesUrl(trimmed, origin);
  if (fromProxyPath) {
    const objectPath = fromProxyPath.includes("/")
      ? fromProxyPath
      : expandBasenameToCardapioItemsObjectPath(fromProxyPath);
    return mediaProxyUrlFromStorageKey(objectPath);
  }

  if (
    !isHttpUrl(trimmed) &&
    !trimmed.startsWith("/") &&
    !trimmed.startsWith("public/")
  ) {
    const expanded = expandBasenameToCardapioItemsObjectPath(trimmed);
    if (expanded) return mediaProxyUrlFromStorageKey(expanded);
  }

  if (isHttpUrl(trimmed) && /\/public\/images\//i.test(trimmed)) {
    const blunt = trimmed.match(/\/public\/images\/([^?#]+)/i);
    if (blunt?.[1]) {
      const decoded = normalizeObjectPathKey(decodeSafe(blunt[1]));
      if (decoded) {
        const objectPath = decoded.includes("/")
          ? decoded
          : expandBasenameToCardapioItemsObjectPath(decoded);
        return mediaProxyUrlFromStorageKey(objectPath);
      }
    }
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("/api/")) {
    const withOrigin = `${origin}${trimmed}`;
    const fromAbs = objectPathFromApiPublicImagesUrl(withOrigin, origin);
    if (fromAbs) {
      const objectPath = fromAbs.includes("/")
        ? fromAbs
        : expandBasenameToCardapioItemsObjectPath(fromAbs);
      return mediaProxyUrlFromStorageKey(objectPath);
    }
  }

  return trimmed;
}

function normalizeAdminGallerySingleSrc(
  raw: string,
  apiOrigin: string,
): string {
  const origin = normalizeOrigin(apiOrigin);
  const t = raw.trim().replace(/^\uFEFF/, "");
  if (!t || t === "null" || t === "undefined") return "";

  let u = rewriteToAppMediaProxy(t, origin);
  if (!u || u === t) {
    const alt = rewriteRemoteImageToApiProxy(t, origin);
    if (alt && alt !== t) u = alt;
  }
  if (!u) return "";

  if (u.startsWith("//")) u = `https:${u}`;

  if (u.startsWith("/public/images/")) {
    const via = rewriteToAppMediaProxy(`${origin}${u}`, origin);
    if (via.startsWith("/api/media/")) return via;
    const fix = ensureDeliverableImageUrl(`${origin}${u}`, origin);
    if (fix) return fix;
    return `${origin}${u}`;
  }

  if (u.startsWith("/uploads/") || u.startsWith("/api/cardapio/")) {
    return `${origin}${u}`;
  }

  if (u.startsWith("/") && !u.startsWith("/api/media/")) {
    return u;
  }

  return u;
}

export function resolveAdminGalleryImageUrl(
  img: {
    url?: string | null;
    fullUrl?: string | null;
    mediumUrl?: string | null;
    thumbUrl?: string | null;
    filename?: string | null;
  },
  apiOrigin: string = DEFAULT_ORIGIN,
): string {
  const candidates = [
    img.url,
    img.fullUrl,
    img.mediumUrl,
    img.thumbUrl,
  ];
  for (const c of candidates) {
    if (c == null || typeof c !== "string") continue;
    const out = normalizeAdminGallerySingleSrc(c, apiOrigin);
    if (out) return out;
  }
  if (img.filename != null && typeof img.filename === "string") {
    const out = normalizeAdminGallerySingleSrc(img.filename, apiOrigin);
    if (out) return out;
  }
  return "";
}

/**
 * Lista ordenada de URLs para a grelha admin: tenta vários paths no bucket (cardapio/items, galeria/, raiz, uploads).
 * Usar com <img onError> para passar ao candidato seguinte quando o Storage não tiver o objecto no primeiro path.
 */
export function resolveAdminGalleryImageUrlCandidates(
  img: {
    url?: string | null;
    fullUrl?: string | null;
    mediumUrl?: string | null;
    thumbUrl?: string | null;
    filename?: string | null;
  },
  apiOrigin: string = DEFAULT_ORIGIN,
): string[] {
  const origin = normalizeOrigin(apiOrigin);
  const seen = new Set<string>();
  const list: string[] = [];

  const push = (s: string) => {
    const t = s.trim();
    if (!t || t === "null" || t === "undefined" || seen.has(t)) return;
    seen.add(t);
    list.push(t);
  };

  // Path completo no bucket (listagem Firebase): URL pública primeiro em modo direct;
  // em app_proxy coincide com /api/media/ mas a rota agora aceita qualquer prefixo seguro.
  if (img.filename != null && typeof img.filename === "string") {
    const cleanPath = normalizeObjectPathKey(img.filename);
    if (
      cleanPath &&
      cleanPath.includes("/") &&
      !/^https?:\/\//i.test(img.filename.trim())
    ) {
      push(storageObjectPathToDeliverableUrl(cleanPath));
      push(mediaProxyUrlFromStorageKey(cleanPath));
    }
  }

  push(resolveAdminGalleryImageUrl(img, apiOrigin));

  for (const key of ["url", "fullUrl", "mediumUrl", "thumbUrl"] as const) {
    const c = img[key];
    if (c == null || typeof c !== "string") continue;
    push(normalizeAdminGallerySingleSrc(c, origin));
  }

  if (img.filename != null && typeof img.filename === "string") {
    push(normalizeAdminGallerySingleSrc(img.filename, origin));
    const clean = img.filename.trim().replace(/^\/+/, "");
    if (clean && clean.includes("/") && !/^https?:\/\//i.test(clean)) {
      push(storageObjectPathToFirebaseUrl(clean));
    }
    if (clean && !clean.includes("/") && !/^https?:\/\//i.test(clean)) {
      push(mediaProxyUrlFromStorageKey(`galeria/${clean}`));
      push(mediaProxyUrlFromStorageKey(`uploads/${clean}`));
      push(mediaProxyUrlFromStorageKey(`cardapio/bars/${clean}`));
      if (/^[A-Za-z0-9._-]+\.[A-Za-z0-9]+$/.test(clean)) {
        push(mediaProxyUrlFromStorageKey(clean));
      }
      const expanded = expandBasenameToCardapioItemsObjectPath(clean);
      if (expanded) push(mediaProxyUrlFromStorageKey(expanded));
    }
  }

  return list;
}

/**
 * Garante URL direta do Firebase quando aplicável; converte proxy /public/images/ e filenames soltos.
 * Mantém Cloudinary, data:, blob: e outras URLs HTTP externas (exceto proxy da própria API).
 */
export function rewriteRemoteImageToApiProxy(
  raw: string | null | undefined,
  apiOrigin: string = DEFAULT_ORIGIN,
): string {
  if (raw == null || typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return "";

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const origin = normalizeOrigin(apiOrigin);

  try {
    if (isHttpUrl(trimmed)) {
      const u = new URL(trimmed);
      const host = u.hostname.toLowerCase();
      if (
        host.includes("firebasestorage.googleapis.com") ||
        host === "storage.googleapis.com"
      ) {
        if (imageDeliveryMode() === "app_proxy") {
          const key = extractStorageObjectPathFromUrl(trimmed);
          if (key) {
            const viaApp = storageObjectPathToDeliverableUrl(key);
            if (viaApp) return viaApp;
          }
        }
        return trimmed;
      }
    }
  } catch {
    // ignore
  }

  const fromProxyPath = objectPathFromApiPublicImagesUrl(trimmed, origin);
  if (fromProxyPath) {
    const objectPath = fromProxyPath.includes("/")
      ? fromProxyPath
      : expandBasenameToCardapioItemsObjectPath(fromProxyPath);
    const out = storageObjectPathToDeliverableUrl(objectPath);
    if (out) return out;
    const mp = mediaProxyUrlFromStorageKey(objectPath);
    if (mp) return mp;
    const viaApp = rewriteToAppMediaProxy(trimmed, origin);
    if (viaApp && viaApp.startsWith("/api/media/")) return viaApp;
    if (isHttpUrl(trimmed) && !isLikelyApiPublicImagesHttpUrl(trimmed)) {
      return trimmed;
    }
    return mp || "";
  }

  if (
    !isHttpUrl(trimmed) &&
    !trimmed.startsWith("/") &&
    !trimmed.startsWith("public/")
  ) {
    const expanded = expandBasenameToCardapioItemsObjectPath(trimmed);
    if (expanded) {
      const out = storageObjectPathToDeliverableUrl(expanded);
      if (out) return out;
    }
  }

  // Fallback: URL HTTP com /public/images/ (incl. path com %2F) — nunca devolver a URL da API ao next/image.
  if (isLikelyApiPublicImagesHttpUrl(trimmed)) {
    const k = extractPublicImagesObjectKeyLoose(trimmed);
    if (k) return deliverableFromPublicImagesKey(k, origin, trimmed);
    const viaApp = rewriteToAppMediaProxy(trimmed, origin);
    if (viaApp && viaApp.startsWith("/api/media/")) return viaApp;
    return "";
  }

  if (isHttpUrl(trimmed) && /\/public\/images\//i.test(trimmed)) {
    const blunt = trimmed.match(/\/public\/images\/([^?#]+)/i);
    if (blunt?.[1]) {
      const decoded = normalizeObjectPathKey(decodeSafe(blunt[1]));
      if (decoded) {
        const objectPath = decoded.includes("/")
          ? decoded
          : expandBasenameToCardapioItemsObjectPath(decoded);
        const out = storageObjectPathToDeliverableUrl(objectPath);
        if (out) return out;
        const mp = mediaProxyUrlFromStorageKey(objectPath);
        if (mp) return mp;
      }
    }
    const viaApp = rewriteToAppMediaProxy(trimmed, origin);
    if (viaApp && viaApp.startsWith("/api/media/")) return viaApp;
  }

  return trimmed;
}

/** Alias semântico: não usa mais o proxy HTTP da API. */
export function rewriteRemoteImageToPublicUrl(
  raw: string | null | undefined,
  apiOrigin?: string,
): string {
  return rewriteRemoteImageToApiProxy(raw, apiOrigin);
}

export function getDefaultApiImageOrigin() {
  return DEFAULT_ORIGIN;
}
