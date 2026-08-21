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
export const J360_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif," +
  "video/mp4,video/quicktime,video/webm,video/3gpp,application/pdf";

const J360_UPLOAD_MIME = new Set(J360_UPLOAD_ACCEPT.split(","));

/** Upload de evidência via API → Firebase Storage (não Cloudinary). */
export async function j360Upload(
  file: File,
): Promise<{ success: boolean; data?: J360UploadResult; message?: string }> {
  if (!J360_UPLOAD_MIME.has(file.type)) {
    return {
      success: false,
      message: "Tipo de arquivo não permitido. Use foto, vídeo (MP4/MOV/WEBM) ou PDF.",
    };
  }
  if (file.size > J360_UPLOAD_MAX_BYTES) {
    return { success: false, message: "Arquivo acima de 15 MB." };
  }

  const form = new FormData();
  form.append("file", file);
  return j360Fetch<J360UploadResult>("/upload", { method: "POST", body: form });
}
