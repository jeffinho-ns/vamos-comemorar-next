"use client";

/**
 * EntitlementsContext — camada ADITIVA e INERTE para o modo SaaS multi-tenant.
 *
 * FAIL-OPEN por padrão: enquanto `NEXT_PUBLIC_SAAS_MODE !== "on"`, o valor é
 * `allowAll = true` (tudo liberado) e NENHUMA requisição é feita. Ou seja, a UI
 * atual não muda em nada — mesmo que o provider não esteja montado, o valor
 * default do contexto já libera tudo.
 *
 * Quando a Fase 3/4 for ligada: montar <EntitlementsProvider> dentro do
 * AppProvider (app/layout.tsx) e definir NEXT_PUBLIC_SAAS_MODE=on. Aí ele
 * busca /api/me/entitlements e passa a refletir módulos/permissões reais.
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

export interface Entitlements {
  allowAll: boolean;
  modules: string[];
  permissions: string[];
  organizationId: number | null;
  /** Usuário legado (UEP) sem permissões finas — espelha a API. */
  legacyScoped?: boolean;
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

const EntitlementsContext = createContext<EntitlementsContextValue>({
  entitlements: ALLOW_ALL,
  loading: false,
  refresh: async () => {},
});

function isSaasMode(): boolean {
  return String(process.env.NEXT_PUBLIC_SAAS_MODE || "").toLowerCase() === "on";
}

function readToken(): string {
  if (typeof window === "undefined") return "";
  const fromCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];
  return fromCookie || localStorage.getItem("authToken") || "";
}

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const [entitlements, setEntitlements] = useState<Entitlements>(ALLOW_ALL);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return isSaasMode() && !!readToken();
  });

  const refresh = useCallback(async () => {
    // Inerte fora do modo SaaS: mantém allowAll e não chama a API.
    if (!isSaasMode()) {
      setEntitlements(ALLOW_ALL);
      return;
    }
    const token = readToken();
    if (!token) {
      setEntitlements(ALLOW_ALL);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/me/entitlements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json?.data as Entitlements | undefined;
      setEntitlements(
        data && typeof data.allowAll === "boolean"
          ? {
              allowAll: data.allowAll,
              modules: Array.isArray(data.modules) ? data.modules : [],
              permissions: Array.isArray(data.permissions) ? data.permissions : [],
              organizationId: data.organizationId ?? null,
              legacyScoped: data.legacyScoped === true,
            }
          : ALLOW_ALL,
      );
    } catch {
      // Fail-open: na dúvida, não trava a UI do cliente.
      setEntitlements(ALLOW_ALL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
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

export { ALLOW_ALL };
