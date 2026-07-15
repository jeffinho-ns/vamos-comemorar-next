"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getApiUrl } from "../config/api";
import { canonicalSessionRole } from "../utils/adminRole";
import { AUTH_CHANGED_EVENT, ensureAuthSessionFromStorage } from "../utils/authSession";
import { safeGetItem } from "../utils/safeStorage";
import {
  filterEstablishmentListForUser,
  filterEstablishmentPermissionsForUser,
  filterEstablishmentsByUserScope,
  normalizeUserEmail,
} from "../utils/establishmentAccessRules";

export const USE_GLOBAL_CONTEXT = true;

export interface AppUser {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
  created_at?: string;
  cnpj?: string;
  endereco_empresa?: string;
  dark_mode?: boolean;
  foto_perfil?: string | null;
  foto_perfil_url?: string | null;
  empresa?: string;
  [key: string]: unknown;
}

export interface AppPermission {
  id: number;
  user_id: number;
  user_email: string;
  establishment_id: number;
  establishment_name?: string;
  can_edit_os: boolean;
  can_edit_operational_detail: boolean;
  can_view_os: boolean;
  can_download_os: boolean;
  can_view_operational_detail: boolean;
  can_create_os: boolean;
  can_create_operational_detail: boolean;
  can_manage_reservations: boolean;
  can_manage_checkins: boolean;
  can_view_reports: boolean;
  can_create_edit_reservations?: boolean;
  can_manage_whatsapp?: boolean;
  can_configure_ia?: boolean;
  can_view_cardapio?: boolean;
  can_create_cardapio?: boolean;
  can_edit_cardapio?: boolean;
  can_delete_cardapio?: boolean;
  is_active: boolean;
}

export interface AppEstablishment {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  status?: string;
  cnpj?: string;
  /** Módulos habilitados no Super Admin. null/undefined = sem configuração (tudo liberado). */
  enabledModules?: string[] | null;
}

interface AppContextValue {
  isLoading: boolean;
  hasError: boolean;
  user: AppUser | null;
  role: string;
  userEmail: string;
  token: string | null;
  myPermissions: AppPermission[];
  establishments: AppEstablishment[];
  error: string | null;
  refetchAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
const GLOBAL_FETCH_TIMEOUT_MS = 45000;

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const hit = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.split("=").slice(1).join("=").trim()) : "";
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = GLOBAL_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeRole(value: string | undefined): string {
  return canonicalSessionRole(value);
}

function parseEnabledModules(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function mapBar(item: Record<string, unknown>): AppEstablishment {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? "Sem nome"),
    email: String(item.email ?? "Não informado"),
    phone: String(item.phone ?? "Não informado"),
    logo: String(item.logoUrl ?? item.logo ?? "default-logo.png"),
    address: String(item.address ?? "Endereço não informado"),
    status: String(item.status ?? "active"),
    cnpj: String(item.cnpj ?? ""),
    enabledModules: parseEnabledModules(item.enabled_modules),
  };
}

function mapPlace(item: Record<string, unknown>): AppEstablishment {
  const street = String(item.street ?? "");
  const number = String(item.number ?? "");
  const composedAddress = street
    ? `${street}${number ? `, ${number}` : ""}`
    : "Endereço não informado";
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? "Sem nome"),
    email: String(item.email ?? "Não informado"),
    phone: String(item.phone ?? "Não informado"),
    logo: String(item.logo ?? "default-logo.png"),
    address: composedAddress,
    status: String(item.status ?? "active"),
    cnpj: String(item.cnpj ?? ""),
    enabledModules: parseEnabledModules(item.enabled_modules),
  };
}

function mergeEstablishments(
  bars: AppEstablishment[],
  places: AppEstablishment[],
): AppEstablishment[] {
  const map = new Map<string, AppEstablishment>();
  for (const item of bars) {
    const key = item.id || item.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, item);
  }
  // Places sobrescrevem bars com o mesmo id (permissões usam ids de `places`).
  // Ex.: place 4 = Oh Freguês, bar 4 = Pracinha — sem isso aparece o estabelecimento errado.
  for (const item of places) {
    const key = item.id || item.name.trim().toLowerCase();
    map.set(key, item);
  }
  return Array.from(map.values());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [myPermissions, setMyPermissions] = useState<AppPermission[]>([]);
  const [establishments, setEstablishments] = useState<AppEstablishment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasFetchedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const loadAll = useCallback(async (force = false) => {
    if (!USE_GLOBAL_CONTEXT) return;
    if (inFlightRef.current) return inFlightRef.current;
    if (hasFetchedRef.current && !force) return;
    const run = (async () => {
      const isFirstLoad = !hasFetchedRef.current;
      hasFetchedRef.current = true;
      // Só bloqueia a tela inteira no primeiro carregamento (evita piscar em refetch).
      if (isFirstLoad && !force) {
        setIsLoading(true);
      }
      setError(null);
      setHasError(false);

      ensureAuthSessionFromStorage();

      // Regra simples e previsivel:
      // 1) cookie e fonte primaria
      // 2) localStorage apenas fallback
      const cookieToken = readCookie("authToken");
      const storageToken =
        typeof window !== "undefined" ? safeGetItem("authToken") : "";
      const resolvedToken = cookieToken || storageToken;
      if (!resolvedToken) {
        setUser(null);
        setRole("");
        setUserEmail("");
        setToken(null);
        setMyPermissions([]);
        setEstablishments([]);
        setIsLoading(false);
        return;
      }

      const apiUrl = getApiUrl();
      const headers = { Authorization: `Bearer ${resolvedToken}` };

      const [userRes, permissionsRes, barsRes, placesRes] = await Promise.allSettled([
        fetchWithTimeout(`${apiUrl}/api/users/me`, { headers }),
        fetchWithTimeout(`${apiUrl}/api/establishment-permissions/my-permissions`, { headers }),
        fetchWithTimeout(`${apiUrl}/api/bars`, { headers }),
        fetchWithTimeout(`${apiUrl}/api/places`, { headers }),
      ]);

      let effectiveEmail = normalizeUserEmail(readCookie("userEmail"));
      let effectiveRole = normalizeRole(readCookie("role"));

      if (userRes.status === "fulfilled" && userRes.value.ok) {
        const userData = (await userRes.value.json()) as AppUser;
        const normalizedRole = normalizeRole(String(userData.role || ""));
        const normalizedEmail = normalizeUserEmail(String(userData.email || ""));
        effectiveEmail = normalizedEmail || effectiveEmail;
        effectiveRole = normalizedRole || effectiveRole;
        setUser(userData);
        setRole(normalizedRole);
        setUserEmail(normalizedEmail);
        if (typeof window !== "undefined") {
          if (normalizedRole) localStorage.setItem("role", normalizedRole);
          if (normalizedEmail) localStorage.setItem("userEmail", normalizedEmail);
        }
      } else {
        const fallbackRole = normalizeRole(
          readCookie("role") || safeGetItem("role"),
        );
        const fallbackEmail = normalizeUserEmail(
          readCookie("userEmail") || safeGetItem("userEmail"),
        );
        setUser(null);
        setRole(fallbackRole);
        setUserEmail(fallbackEmail);
        if (fallbackRole || fallbackEmail) {
          setError(null);
          setHasError(false);
        } else {
          setError("Falha ao carregar dados do usuario.");
          setHasError(true);
        }
      }

      let scopedPermissions: AppPermission[] = [];
      if (permissionsRes.status === "fulfilled" && permissionsRes.value.ok) {
        const permsData = (await permissionsRes.value.json()) as {
          success?: boolean;
          data?: AppPermission[];
        };
        const raw =
          permsData.success && Array.isArray(permsData.data) ? permsData.data : [];
        scopedPermissions = filterEstablishmentPermissionsForUser(
          effectiveEmail,
          raw,
        );
        setMyPermissions(scopedPermissions);
      } else {
        // Fallback seguro exigido: permissao vazia em caso de erro
        setMyPermissions([]);
      }

      const barsPayload =
        barsRes.status === "fulfilled" && barsRes.value.ok
          ? await barsRes.value.json()
          : [];
      const placesPayload =
        placesRes.status === "fulfilled" && placesRes.value.ok
          ? await placesRes.value.json()
          : [];
      const barsMapped = Array.isArray(barsPayload)
        ? barsPayload.map((item) => mapBar(item as Record<string, unknown>))
        : [];
      const placeList: unknown[] = Array.isArray(placesPayload)
        ? placesPayload
        : Array.isArray(placesPayload?.data)
          ? placesPayload.data
          : [];
      const placesMapped = placeList.map((item: unknown) =>
        mapPlace(item as Record<string, unknown>),
      );
      const merged = mergeEstablishments(barsMapped, placesMapped);
      setEstablishments(
        filterEstablishmentsByUserScope(
          effectiveEmail,
          effectiveRole,
          scopedPermissions,
          merged,
        ),
      );
      setToken(resolvedToken);
    })()
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados globais");
        setHasError(true);
        setMyPermissions([]);
        setEstablishments([]);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
        inFlightRef.current = null;
      });
    inFlightRef.current = run;
    return run;
  }, []);

  /** Referência estável — evita loop em hooks que dependem de refetchAll/fetchEstablishments. */
  const refetchAll = useCallback(() => loadAll(true), [loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAuthChanged = () => {
      hasFetchedRef.current = false;
      void loadAll(true);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, [loadAll]);

  const value = useMemo<AppContextValue>(
    () => ({
      isLoading,
      hasError,
      user,
      role,
      userEmail,
      token,
      myPermissions,
      establishments,
      error,
      refetchAll,
    }),
    [
      isLoading,
      hasError,
      user,
      role,
      userEmail,
      token,
      myPermissions,
      establishments,
      error,
      refetchAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return {
      isLoading: false,
      hasError: false,
      user: null,
      role: "",
      userEmail: "",
      token: null,
      myPermissions: [],
      establishments: [],
      error: null,
      refetchAll: async () => undefined,
    } satisfies AppContextValue;
  }
  return ctx;
}
