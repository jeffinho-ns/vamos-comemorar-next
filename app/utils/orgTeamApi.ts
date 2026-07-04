import { getApiUrl } from "@/app/config/api";

export class OrgTeamApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function orgTeamFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${getApiUrl()}/api/org${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new OrgTeamApiError(body.error || `HTTP ${res.status}`, res.status);
  }
  return body.data as T;
}

export type OrgRole = { id: number; key: string; name: string; is_system?: boolean };
export type OrgEstablishment = {
  id: number;
  name: string;
  slug: string;
  legacy_place_id?: number | null;
  legacy_bar_id?: number | null;
};
export type OrgMembership = {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  role_key: string;
  role_name: string;
  establishment_id: number | null;
  establishment_name: string | null;
  is_active: boolean;
};

export const FACTORY_ROLE_OPTIONS = [
  { key: "account_admin", label: "Account Admin" },
  { key: "gerente_bar", label: "Gerente do Bar" },
  { key: "recepcao", label: "Recepção" },
  { key: "hostess", label: "Hostess" },
  { key: "promoter", label: "Promoter" },
] as const;
