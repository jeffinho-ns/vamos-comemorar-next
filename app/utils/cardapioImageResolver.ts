const PLACEHOLDER_IMAGE_URL = '/placeholder-cardapio.svg';

const imageUrlIndex = new Map<string, string>();
let warmPromise: Promise<void> | null = null;

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isCloudinaryUrl(value: string) {
  return value.includes('res.cloudinary.com') || value.includes('cloudinary.com');
}

function normalizeKey(value: string) {
  return value.trim().replace(/^\/+/, '');
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
  if (isHttpUrl(trimmed)) return trimmed;

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
  if (warmPromise) return warmPromise;
  warmPromise = (async () => {
    const res = await fetch(`${apiBaseUrl}/gallery/images`);
    if (!res.ok) return;
    const data = await res.json();
    const images = Array.isArray(data?.images) ? data.images : [];
    for (const img of images) {
      if (img?.filename && img?.url) {
        indexCardapioImageUrl(img.filename, img.url);
      }
    }
  })().finally(() => {
    warmPromise = null;
  });
  return warmPromise;
}

export function getCardapioPlaceholderUrl() {
  return PLACEHOLDER_IMAGE_URL;
}


