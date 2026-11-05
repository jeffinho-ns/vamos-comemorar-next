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
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getApiUrl } from "../config/api";
import { parseMenuAccessKeys } from "../config/adminMenuAccess";
import { AUTH_CHANGED_EVENT } from "../utils/authSession";
import { parseBiMenuAccess } from "../utils/biJustinoAccess";
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
  /** Menu salvo (entitlements ∪ UEP). Vazio/ausente = comportamento legado. */
  menuAccess?: string[];
  /** Páginas do BI Seu Justino (entitlements ∪ UEP bi_menu_access). */
  biMenuAccess?: string[];
}

interface EntitlementsContextValue {
  entitlements: Entitlements;
  loading: boolean;
  /** A API ou a rede falhou depois das tentativas. Não é um contrato vazio de verdade. */
  failed: boolean;
  /** Token ausente, inválido ou expirado. */
  unauthorized: boolean;
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
  failed: false,
  unauthorized: false,
  refresh: async () => {},
});

const ENTITLEMENTS_TIMEOUT_MS = 10000;
const ENTITLEMENTS_ATTEMPTS = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const [failed, setFailed] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const runId = useRef(0);

  const refresh = useCallback(async () => {
    const myRun = ++runId.current;
    const stale = () => myRun !== runId.current;
    const token = readToken();
    if (!token) {
      setEntitlements(ALLOW_ALL);
      setFailed(false);
      setUnauthorized(false);
      setLoading(false);
      return;
    }
    if (readSuperAdminFromCookie()) {
      setEntitlements(ALLOW_ALL);
      setFailed(false);
      setUnauthorized(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    setUnauthorized(false);

    for (let attempt = 1; attempt <= ENTITLEMENTS_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), ENTITLEMENTS_TIMEOUT_MS);
      try {
        const res = await fetch(`${getApiUrl()}/api/me/entitlements`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (stale()) return;
        if (res.status === 401 || res.status === 403) {
          setEntitlements(DENY_ALL);
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.data as
          | (Entitlements & { menu_access?: unknown; bi_menu_access?: unknown })
          | undefined;
        if (!data || typeof data.allowAll !== "boolean") {
          throw new Error("payload_invalido");
        }
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
            menuAccess: parseMenuAccessKeys(data.menuAccess ?? data.menu_access),
            biMenuAccess: parseBiMenuAccess(data.biMenuAccess ?? data.bi_menu_access),
          }),
        );
        setFailed(false);
        setLoading(false);
        return;
      } catch {
        if (stale()) return;
        if (attempt < ENTITLEMENTS_ATTEMPTS) {
          await sleep(700);
          if (stale()) return;
          continue;
        }
        setEntitlements(readSuperAdminFromCookie() ? ALLOW_ALL : DENY_ALL);
        setFailed(!readSuperAdminFromCookie());
      } finally {
        window.clearTimeout(timer);
      }
    }
    if (!stale()) setLoading(false);
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
    () => ({ entitlements, loading, failed, unauthorized, refresh }),
    [entitlements, loading, failed, unauthorized, refresh],
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
