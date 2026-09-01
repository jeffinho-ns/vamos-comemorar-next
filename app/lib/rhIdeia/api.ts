/** Ideia RH — client API (Grupo Ideia Um, escopo organizacional). */

import type { IriUploadResult } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://api.agilizaiapp.com.br";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    null
  );
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): string {
  const base = `${API_URL}/api/rh-ideia${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `${base}${path.includes("?") ? "&" : "?"}${qs}` : base;
}

export async function iriFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, string | number | undefined | null>,
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const url = buildUrl(path, query);
  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => ({
    success: false,
    message: "Resposta inválida da API",
  }));
  if (!res.ok) {
    return {
      success: false,
      message: json.message || json.error || `Erro ${res.status}`,
    };
  }
  return json;
}

/** Espelha limites da API (routes/rh-ideia/upload). */
export const IRI_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

export const IRI_UPLOAD_ACCEPT =
  "image/*,video/*,application/pdf,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,.pdf";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
]);

function extensionOf(name: string): string {
  const raw = name.split(".").pop() || "";
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

export function resolveUploadMime(file: Pick<File, "name" | "type">): string {
  let mime = String(file.type || "")
    .trim()
    .toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";
  if (!mime || mime === "application/octet-stream") {
    mime = EXT_TO_MIME[extensionOf(file.name)] || "";
  }
  return mime;
}

function withResolvedType(file: File, mime: string): File {
  const ext =
    extensionOf(file.name) ||
    (mime === "image/jpeg"
      ? "jpg"
      : mime === "video/quicktime"
        ? "mov"
        : mime.split("/")[1]?.replace("jpeg", "jpg") || "bin");
  const name = file.name?.includes(".") ? file.name : `anexo.${ext}`;
  if (file.type && file.type.toLowerCase() === mime && name === file.name) {
    return file;
  }
  if (!mime) return file;
  try {
    return new File([file], name, {
      type: mime,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function iriUpload(
  file: File,
): Promise<{ success: boolean; data?: IriUploadResult; message?: string }> {
  const mime = resolveUploadMime(file);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return {
      success: false,
      message:
        "Tipo de arquivo não permitido. Use foto (JPG/PNG/WEBP/HEIC), vídeo (MP4/MOV/WEBM) ou PDF.",
    };
  }
  if (file.size > IRI_UPLOAD_MAX_BYTES) {
    return { success: false, message: "Arquivo acima de 15 MB." };
  }

  const payload = withResolvedType(file, mime === "image/jpg" ? "image/jpeg" : mime);
  const form = new FormData();
  form.append("file", payload);
  return iriFetch<IriUploadResult>("/upload", { method: "POST", body: form });
}
