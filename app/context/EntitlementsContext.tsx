"use client";

/**
 * EntitlementsContext — módulos e casas da organização do usuário logado.
 *
 * Tenant autenticado nunca começa em allowAll: isso vazava o menu da empresa
 * antiga para uma organização nova. Superadmin continua com acesso total.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiUrl } from "../config/api";
import { AUTH_CHANGED_EVENT } from "../utils/authSession";
import { readAuthToken } from "../utils/readAuthToken";
import { readSuperAdminFromCookie } from "../utils/superAdminAccess";

export interface Entitlements {
  allowAll: boolean;
  modules: string[];
  permissions: string[];
  organizationId: number | null;
  /** IDs operacionais (place/bar) permitidos ao usuário. */
  establishmentIds?: number[];
  /** Usuário legado (UEP) sem permissões finas — espelha a API. */
  legacyScoped?: boolean;
  /** Membership role account_admin na org — pode gerenciar /admin/equipe. */
  isAccountAdmin?: boolean;
}

interface EntitlementsContextValue {
  entitlements: Entitlements;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ALLOW_ALL: Entitlements = {
  allowAll: true,
  modules: ["*"],
  permissions: ["*"],
  organizationId: null,
};

const DENY_ALL: Entitlements = {
  allowAll: false,
  modules: [],
  permissions: [],
  organizationId: null,
  establishmentIds: [],
};

function contractEntitlements(data: Entitlements): Entitlements {
  if (data.allowAll) return data;
  const modules = Array.isArray(data.modules)
    ? data.modules.filter((key) => key && key !== "*")
    : [];
  const allowed = new Set(modules);
  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter((key) => {
        const idx = key.indexOf(":");
        const moduleKey = idx > 0 ? key.slice(0, idx) : key;
        return allowed.has(moduleKey);
      })
    : [];
  return { ...data, modules, permissions };
}

const EntitlementsContext = createContext<EntitlementsContextValue>({
  entitlements: DENY_ALL,
  loading: false,
  refresh: async () => {},
});

function readToken(): string {
  if (typeof window === "undefined") return "";
  return readAuthToken();
}

function initialEntitlements(): Entitlements {
  if (typeof window === "undefined") return DENY_ALL;
  if (readSuperAdminFromCookie()) return ALLOW_ALL;
  if (readToken()) return DENY_ALL;
  return ALLOW_ALL;
}

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const [entitlements, setEntitlements] = useState<Entitlements>(initialEntitlements);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!readToken() && !readSuperAdminFromCookie();
  });

  const ENTITLEMENTS_TIMEOUT_MS = 20000;

  const refresh = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setEntitlements(ALLOW_ALL);
      setLoading(false);
      return;
    }
    if (readSuperAdminFromCookie()) {
      setEntitlements(ALLOW_ALL);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ENTITLEMENTS_TIMEOUT_MS);
    try {
      const res = await fetch(`${getApiUrl()}/api/me/entitlements`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json?.data as Entitlements | undefined;
      if (data && typeof data.allowAll === "boolean") {
        setEntitlements(
          contractEntitlements({
            allowAll: data.allowAll,
            modules: Array.isArray(data.modules) ? data.modules : [],
            permissions: Array.isArray(data.permissions) ? data.permissions : [],
            organizationId: data.organizationId ?? null,
            establishmentIds: Array.isArray(data.establishmentIds)
              ? data.establishmentIds.map(Number).filter((n) => n > 0)
              : [],
            legacyScoped: data.legacyScoped === true,
            isAccountAdmin: data.isAccountAdmin === true,
          }),
        );
      } else {
        setEntitlements(DENY_ALL);
      }
    } catch {
      setEntitlements(readSuperAdminFromCookie() ? ALLOW_ALL : DENY_ALL);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAuthChanged = () => {
      void refresh();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refresh]);

  const value = useMemo<EntitlementsContextValue>(
    () => ({ entitlements, loading, refresh }),
    [entitlements, loading, refresh],
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements(): EntitlementsContextValue {
  return useContext(EntitlementsContext);
}

export { ALLOW_ALL, DENY_ALL };
