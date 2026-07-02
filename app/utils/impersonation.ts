import { getApiUrl } from "@/app/config/api";
import {
  notifyAuthChanged,
  setAuthSessionCookies,
} from "./authSession";

const BACKUP_KEY = "impersonationBackup";
const META_KEY = "impersonationMeta";

export type ImpersonationMeta = {
  impersonatorName: string;
  impersonatorEmail: string;
  targetName: string;
  targetEmail: string;
};

export function isImpersonating(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(META_KEY);
}

export function getImpersonationMeta(): ImpersonationMeta | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationMeta;
  } catch {
    return null;
  }
}

export function applyImpersonationSession(params: {
  token: string;
  user: { id: number; name: string; email: string; role: string };
  impersonator: { id: number; name: string; email: string };
}) {
  if (typeof window === "undefined") return;

  const backup = {
    authToken: localStorage.getItem("authToken"),
    userId: localStorage.getItem("userId"),
    role: localStorage.getItem("role"),
    userName: localStorage.getItem("userName"),
    userEmail: localStorage.getItem("userEmail"),
    promoterId: localStorage.getItem("promoterId"),
    promoterCodigo: localStorage.getItem("promoterCodigo"),
    isSuperAdmin: document.cookie.includes("isSuperAdmin=1"),
  };
  sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

  const meta: ImpersonationMeta = {
    impersonatorName: params.impersonator.name || params.impersonator.email,
    impersonatorEmail: params.impersonator.email,
    targetName: params.user.name || params.user.email,
    targetEmail: params.user.email,
  };
  sessionStorage.setItem(META_KEY, JSON.stringify(meta));

  localStorage.setItem("authToken", params.token);
  localStorage.setItem("userId", String(params.user.id));
  localStorage.setItem("role", params.user.role);
  localStorage.setItem("userName", params.user.name || "");
  localStorage.setItem("userEmail", params.user.email);

  setAuthSessionCookies({
    authToken: params.token,
    role: params.user.role,
    userEmail: params.user.email,
    isSuperAdmin: false,
  });

  notifyAuthChanged();
}

export async function endImpersonationSession(): Promise<void> {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("authToken");
  const res = await fetch(`${getApiUrl()}/api/users/impersonate/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Não foi possível encerrar o modo suporte.");
  }

  sessionStorage.removeItem(META_KEY);
  sessionStorage.removeItem(BACKUP_KEY);

  localStorage.setItem("authToken", data.token);
  localStorage.setItem("userId", String(data.userId));
  localStorage.setItem("role", data.role);
  localStorage.setItem("userName", data.nome || "");
  if (data.email) {
    localStorage.setItem("userEmail", data.email);
  }

  setAuthSessionCookies({
    authToken: data.token,
    role: data.role,
    userEmail: data.email,
    isSuperAdmin: !!data.isSuperAdmin,
  });

  notifyAuthChanged();
}
