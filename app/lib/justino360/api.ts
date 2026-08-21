/** Justino360 — client API (Seu Justino = establishment_id 1) */

export const JUSTINO360_ESTABLISHMENT_ID = 1;

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

export async function j360Fetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const sep = path.includes("?") ? "&" : "?";
  const url = `${API_URL}/api/justino360${path}${sep}establishment_id=${JUSTINO360_ESTABLISHMENT_ID}`;
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

export interface J360UploadResult {
  url: string;
  object_path?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
}

/** Espelha os limites da API (routes/justino360/upload.js). */
export const J360_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

/**
 * Accept amigável para iOS/Android (lista longa de MIME quebra o picker em Safari).
 * A validação real fica em resolveUploadMime / API.
 */
export const J360_UPLOAD_ACCEPT =
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
  "3gp": "video/3gpp",
  "3gpp": "video/3gpp",
  pdf: "application/pdf",
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/3gpp",
  "application/pdf",
]);

function extensionOf(name: string): string {
  const raw = name.split(".").pop() || "";
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

/** Resolve MIME real: type vazio / image/jpg / octet-stream → extensão. */
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
  const name = file.name?.includes(".") ? file.name : `evidencia.${ext}`;
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

/** Upload de evidência via API → Firebase Storage (não Cloudinary). */
export async function j360Upload(
  file: File,
): Promise<{ success: boolean; data?: J360UploadResult; message?: string }> {
  const mime = resolveUploadMime(file);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return {
      success: false,
      message:
        "Tipo de arquivo não permitido. Use foto (JPG/PNG/WEBP/HEIC), vídeo (MP4/MOV/WEBM) ou PDF.",
    };
  }
  if (file.size > J360_UPLOAD_MAX_BYTES) {
    return { success: false, message: "Arquivo acima de 15 MB." };
  }

  const payload = withResolvedType(file, mime === "image/jpg" ? "image/jpeg" : mime);
  const form = new FormData();
  form.append("file", payload);
  return j360Fetch<J360UploadResult>("/upload", { method: "POST", body: form });
}
