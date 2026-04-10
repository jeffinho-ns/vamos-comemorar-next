const PLACEHOLDER_IMAGE_URL = '/placeholder-cardapio.svg';

const imageUrlIndex = new Map<string, string>();
let warmPromise: Promise<void> | null = null;
const preloadedImages = new Set<string>();
const INDEX_CACHE_KEY = 'cardapio:image-url-index:v1';
const INDEX_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas
let cacheHydrated = false;

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isCloudinaryUrl(value: string) {
  return value.includes('res.cloudinary.com') || value.includes('cloudinary.com');
}

function normalizeKey(value: string) {
  return value.trim().replace(/^\/+/, '');
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractPublicImagesKey(urlValue: string): string | null {
  const marker = '/public/images/';
  const idx = urlValue.indexOf(marker);
  if (idx < 0) return null;
  const raw = urlValue.slice(idx + marker.length).split('?')[0].trim();
  if (!raw) return null;
  return normalizeKey(safeDecode(raw));
}

function hydrateIndexFromCache() {
  if (cacheHydrated) return;
  cacheHydrated = true;
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(INDEX_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      ts?: number;
      entries?: Array<[string, string]>;
    };
    const ts = Number(parsed?.ts || 0);
    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    if (!ts || Date.now() - ts > INDEX_CACHE_TTL_MS || entries.length === 0) return;

    for (const [key, value] of entries) {
      if (typeof key === 'string' && typeof value === 'string') {
        imageUrlIndex.set(key, value);
      }
    }
  } catch {
    // Ignora cache inválido e continua fluxo normal.
  }
}

function persistIndexToCache() {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(imageUrlIndex.entries());
    window.localStorage.setItem(
      INDEX_CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        entries,
      }),
    );
  } catch {
    // Falha de quota/permissão não deve quebrar render.
  }
}

export function indexCardapioImageUrl(filename: unknown, url: unknown) {
  if (typeof filename !== 'string' || typeof url !== 'string') return;
  const key = normalizeKey(filename);
  const u = url.trim();
  if (!key || !u) return;
  if (!isHttpUrl(u)) return;
  if (isCloudinaryUrl(u)) return;

  imageUrlIndex.set(key, u);
  const last = key.split('/').pop();
  if (last) imageUrlIndex.set(last, u);
}

export function resolveCardapioImageUrl(value?: string | null): string {
  hydrateIndexFromCache();
  if (!value || typeof value !== 'string') return PLACEHOLDER_IMAGE_URL;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return PLACEHOLDER_IMAGE_URL;

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  // Se for Cloudinary, não usar. Tenta resolver pelo nome do arquivo no índice.
  if (isCloudinaryUrl(trimmed)) {
    const last = trimmed.split('?')[0]?.split('/').pop()?.trim();
    if (last) {
      const mapped = imageUrlIndex.get(last);
      if (mapped) return mapped;
    }
    return PLACEHOLDER_IMAGE_URL;
  }

  // URL absoluta (Firebase/Unsplash/etc)
  if (isHttpUrl(trimmed)) {
    // URLs legadas via proxy /public/images/ podem virar 404 em alguns ambientes.
    // Tenta remapear pelo índice (filename/objectPath -> URL real). Se não achar, retorna placeholder
    // para permitir fallback de coverImages nos componentes.
    const publicImagesKey = extractPublicImagesKey(trimmed);
    if (publicImagesKey) {
      const byExact = imageUrlIndex.get(publicImagesKey);
      if (byExact) return byExact;

      const last = publicImagesKey.split('/').pop();
      if (last) {
        const byLast = imageUrlIndex.get(last);
        if (byLast) return byLast;
      }
      return PLACEHOLDER_IMAGE_URL;
    }

    return trimmed;
  }

  // filename/objectPath: tentar resolver no índice
  const key = normalizeKey(trimmed);
  const byExact = imageUrlIndex.get(key);
  if (byExact) return byExact;

  const last = key.split('/').pop();
  if (last) {
    const byLast = imageUrlIndex.get(last);
    if (byLast) return byLast;
  }

  return PLACEHOLDER_IMAGE_URL;
}

export async function warmCardapioImageIndex(apiBaseUrl: string) {
  hydrateIndexFromCache();
  if (imageUrlIndex.size > 0) return;
  if (warmPromise) return warmPromise;
  warmPromise = (async () => {
    const res = await fetch(`${apiBaseUrl}/gallery/images`);
    if (!res.ok) return;
    const data = await res.json();
    const images = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.images)
        ? data.images
        : [];
    for (const img of images) {
      if (img?.filename && img?.url) {
        indexCardapioImageUrl(img.filename, img.url);
      }
    }
    persistIndexToCache();
  })().finally(() => {
    warmPromise = null;
  });
  return warmPromise;
}

export function getCardapioPlaceholderUrl() {
  return PLACEHOLDER_IMAGE_URL;
}

export function preloadCardapioImages(urls: Array<string | null | undefined>, max = 8) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  if (!Array.isArray(urls) || urls.length === 0 || max <= 0) return;

  let loaded = 0;
  for (const raw of urls) {
    if (loaded >= max) break;
    const resolved = resolveCardapioImageUrl(raw || null);
    if (!resolved || resolved === PLACEHOLDER_IMAGE_URL) continue;
    if (preloadedImages.has(resolved)) continue;

    preloadedImages.add(resolved);
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = resolved;
    loaded += 1;
  }
}


