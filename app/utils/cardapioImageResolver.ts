import {
  ensureDeliverableImageUrl,
  rewriteRemoteImageToApiProxy,
  rewriteToAppMediaProxy,
  isLikelyApiPublicImagesHttpUrl,
  expandBasenameToCardapioItemsObjectPath,
} from "@/app/utils/apiImageProxy";

const PLACEHOLDER_IMAGE_URL = "/placeholder-cardapio.svg";
const DEFAULT_API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://api.agilizaiapp.com.br"
).replace(/\/+$/, "");

const imageUrlIndex = new Map<string, string>();
let warmPromise: Promise<void> | null = null;
/** Evita voltar a buscar todas as páginas da galeria no mesmo origin. */
let warmDoneForOrigin: string | null = null;
let apiOrigin = DEFAULT_API_ORIGIN;

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isRootRelativeUrl(value: string) {
  return value.startsWith("/");
}

function isCloudinaryUrl(value: string) {
  return (
    value.includes("res.cloudinary.com") || value.includes("cloudinary.com")
  );
}

function normalizeKey(value: string) {
  return value.trim().split(/[?#]/)[0]?.replace(/^\/+/, "") || "";
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toAbsoluteImageUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (isHttpUrl(trimmed)) return trimmed;
  if (isRootRelativeUrl(trimmed) && apiOrigin) return `${apiOrigin}${trimmed}`;
  if (trimmed.startsWith("public/images/") && apiOrigin)
    return `${apiOrigin}/${trimmed}`;
  if (trimmed.startsWith("api/cardapio/public/images/") && apiOrigin)
    return `${apiOrigin}/${trimmed.replace(/^api\/cardapio\//, "")}`;
  return trimmed;
}

export function indexCardapioImageUrl(filename: unknown, url: unknown) {
  if (typeof filename !== "string" || typeof url !== "string") return;
  const key = normalizeKey(filename);
  let u = toAbsoluteImageUrl(url);
  u = rewriteRemoteImageToApiProxy(u, apiOrigin);
  u = ensureDeliverableImageUrl(u, apiOrigin);
  if (!key || !u) return;
  if (isHttpUrl(u) && isLikelyApiPublicImagesHttpUrl(u)) return;
  if (!isHttpUrl(u) && !isRootRelativeUrl(u)) return;
  if (isCloudinaryUrl(u)) return;

  imageUrlIndex.set(key, u);
  const last = key.split("/").pop();
  if (last) imageUrlIndex.set(last, u);
  const decodedKey = decodeSafe(key);
  if (decodedKey !== key) imageUrlIndex.set(decodedKey, u);
  const decodedLast = last ? decodeSafe(last) : "";
  if (decodedLast && decodedLast !== last) imageUrlIndex.set(decodedLast, u);
}

export function resolveCardapioImageUrl(value?: string | null): string {
  if (!value || typeof value !== "string") return PLACEHOLDER_IMAGE_URL;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined")
    return PLACEHOLDER_IMAGE_URL;

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:"))
    return trimmed;

  if (isCloudinaryUrl(trimmed)) {
    const last = trimmed.split("?")[0]?.split("/").pop()?.trim();
    if (last) {
      const mapped = imageUrlIndex.get(last);
      if (mapped) return ensureDeliverableImageUrl(mapped, apiOrigin);
      const mappedDecoded = imageUrlIndex.get(decodeSafe(last));
      if (mappedDecoded)
        return ensureDeliverableImageUrl(mappedDecoded, apiOrigin);
      const fromBasename = rewriteRemoteImageToApiProxy(last, apiOrigin);
      if (fromBasename && fromBasename !== last) {
        return ensureDeliverableImageUrl(fromBasename, apiOrigin);
      }
    }
    return PLACEHOLDER_IMAGE_URL;
  }

  const proxied = rewriteRemoteImageToApiProxy(trimmed, apiOrigin);
  if (proxied !== trimmed) return ensureDeliverableImageUrl(proxied, apiOrigin);

  if (isRootRelativeUrl(trimmed)) {
    return ensureDeliverableImageUrl(toAbsoluteImageUrl(trimmed), apiOrigin);
  }

  if (isHttpUrl(trimmed)) {
    if (
      /\/public\/images\//i.test(trimmed) ||
      trimmed.toLowerCase().includes("public%2fimages")
    ) {
      const appMedia = rewriteToAppMediaProxy(trimmed, apiOrigin);
      if (appMedia.startsWith("/api/media/")) return appMedia;
      const fixed = ensureDeliverableImageUrl(trimmed, apiOrigin);
      if (fixed !== trimmed) return fixed;
    }
    return ensureDeliverableImageUrl(trimmed, apiOrigin);
  }

  const key = normalizeKey(trimmed);
  const byExact = imageUrlIndex.get(key);
  if (byExact) return ensureDeliverableImageUrl(byExact, apiOrigin);
  const byDecodedExact = imageUrlIndex.get(decodeSafe(key));
  if (byDecodedExact) return ensureDeliverableImageUrl(byDecodedExact, apiOrigin);

  const last = key.split("/").pop();
  if (last) {
    const byLast = imageUrlIndex.get(last);
    if (byLast) return ensureDeliverableImageUrl(byLast, apiOrigin);
    const byDecodedLast = imageUrlIndex.get(decodeSafe(last));
    if (byDecodedLast) return ensureDeliverableImageUrl(byDecodedLast, apiOrigin);
  }

  return PLACEHOLDER_IMAGE_URL;
}

/**
 * URLs finais para `<Image src>` — tenta na ordem: valor original resolvido,
 * paths típicos no Storage (cardapio/items, galeria, uploads, bars), placeholder.
 */
export function getCardapioImageSrcCandidates(
  raw: string | null | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const pushResolved = (logical: string | null | undefined) => {
    if (logical == null || typeof logical !== "string") return;
    const t = logical.trim();
    if (!t || t === "null" || t === "undefined") return;
    const u = rewriteRemoteImageToApiProxy(resolveCardapioImageUrl(t));
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  };

  pushResolved(raw ?? null);

  const trimmed = raw?.trim();
  if (trimmed && trimmed !== "null" && trimmed !== "undefined") {
    const clean = normalizeKey(trimmed);
    if (clean && !isHttpUrl(clean)) {
      const paths: string[] = [];
      if (!clean.includes("/")) {
        const exp = expandBasenameToCardapioItemsObjectPath(clean);
        if (exp) paths.push(exp);
        paths.push(
          `galeria/${clean}`,
          `uploads/${clean}`,
          `cardapio/bars/${clean}`,
        );
        if (/^[A-Za-z0-9._-]+\.[A-Za-z0-9]+$/.test(clean)) paths.push(clean);
      }
      const pathSeen = new Set<string>();
      for (const p of paths) {
        if (!p || pathSeen.has(p)) continue;
        pathSeen.add(p);
        pushResolved(p);
      }
    }
  }

  const ph = rewriteRemoteImageToApiProxy(PLACEHOLDER_IMAGE_URL);
  if (!seen.has(ph)) out.push(ph);
  return out;
}

export async function warmCardapioImageIndex(apiBaseUrl: string) {
  let originKey: string;
  try {
    originKey = new URL(apiBaseUrl).origin;
  } catch {
    originKey = DEFAULT_API_ORIGIN;
  }
  apiOrigin = originKey;

  if (warmDoneForOrigin === originKey && imageUrlIndex.size > 0) {
    return;
  }
  if (warmPromise) return warmPromise;

  if (warmDoneForOrigin && warmDoneForOrigin !== originKey) {
    imageUrlIndex.clear();
    warmDoneForOrigin = null;
  }

  warmPromise = (async () => {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    let anySuccess = false;

    do {
      const res = await fetch(
        `${apiBaseUrl}/gallery/images?page=${page}&limit=${limit}`,
      );
      if (!res.ok) break;

      anySuccess = true;
      const data = await res.json();
      const images = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.images)
          ? data.images
          : [];

      for (const img of images) {
        if (!img?.filename) continue;
        if (typeof img.url === "string" && img.url) {
          indexCardapioImageUrl(img.filename, img.url);
        }
        if (
          typeof img.fullUrl === "string" &&
          img.fullUrl &&
          img.fullUrl !== img.url
        ) {
          indexCardapioImageUrl(img.filename, img.fullUrl);
        }
        if (
          typeof img.mediumUrl === "string" &&
          img.mediumUrl &&
          img.mediumUrl !== img.url &&
          img.mediumUrl !== img.fullUrl
        ) {
          indexCardapioImageUrl(img.filename, img.mediumUrl);
        }
      }

      const total =
        typeof data?.total === "number" && data.total >= 0
          ? data.total
          : images.length;
      totalPages =
        typeof data?.totalPages === "number" && data.totalPages >= 1
          ? data.totalPages
          : Math.max(1, Math.ceil(total / limit));
      page += 1;
      if (page > 500) break;
    } while (page <= totalPages);

    if (anySuccess) warmDoneForOrigin = originKey;
  })().finally(() => {
    warmPromise = null;
  });

  return warmPromise;
}

export function getCardapioPlaceholderUrl() {
  return PLACEHOLDER_IMAGE_URL;
}
