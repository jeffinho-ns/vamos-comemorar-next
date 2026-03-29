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

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const hit = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.split("=").slice(1).join("=").trim()) : "";
}

function normalizeRole(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
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
  };
}

function mergeEstablishments(
  bars: AppEstablishment[],
  places: AppEstablishment[],
): AppEstablishment[] {
  const merged = [...bars, ...places];
  const map = new Map<string, AppEstablishment>();
  for (const item of merged) {
    const key = item.id || item.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, item);
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
      hasFetchedRef.current = true;
      // Refetch em background: não dispara "Carregando..." no layout (evita piscar tela inteira).
      if (!force) {
        setIsLoading(true);
      }
      setError(null);
      setHasError(false);

      // Regra simples e previsivel:
      // 1) cookie e fonte primaria
      // 2) localStorage apenas fallback
      const cookieToken = readCookie("authToken");
      const storageToken =
        typeof window !== "undefined" ? localStorage.getItem("authToken") || "" : "";
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
        fetch(`${apiUrl}/api/users/me`, { headers }),
        fetch(`${apiUrl}/api/establishment-permissions/my-permissions`, { headers }),
        fetch(`${apiUrl}/api/bars`, { headers }),
        fetch(`${apiUrl}/api/places`, { headers }),
      ]);

      if (userRes.status === "fulfilled" && userRes.value.ok) {
        const userData = (await userRes.value.json()) as AppUser;
        const normalizedRole = normalizeRole(String(userData.role || ""));
        const normalizedEmail = String(userData.email || "")
          .trim()
          .toLowerCase();
        setUser(userData);
        setRole(normalizedRole);
        setUserEmail(normalizedEmail);
        if (typeof window !== "undefined") {
          if (normalizedRole) localStorage.setItem("role", normalizedRole);
          if (normalizedEmail) localStorage.setItem("userEmail", normalizedEmail);
        }
      } else {
        setUser(null);
        setRole(normalizeRole(readCookie("role")));
        setUserEmail(readCookie("userEmail"));
        setError("Falha ao carregar dados do usuario.");
        setHasError(true);
      }

      if (permissionsRes.status === "fulfilled" && permissionsRes.value.ok) {
        const permsData = (await permissionsRes.value.json()) as {
          success?: boolean;
          data?: AppPermission[];
        };
        setMyPermissions(
          permsData.success && Array.isArray(permsData.data) ? permsData.data : [],
        );
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
      setEstablishments(mergeEstablishments(barsMapped, placesMapped));
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
