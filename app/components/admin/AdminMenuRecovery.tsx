"use client";

import { useEffect } from "react";
import { useEntitlements } from "../../context/EntitlementsContext";
import { clearAuthSession } from "../../utils/authSession";

const RELOAD_KEY = "admin-entitlements-reloaded";

/**
 * Quando as permissões não carregam, o menu do admin fica só com o nome do painel.
 * Recarrega uma vez. Se a segunda tentativa também falhar, manda para o login.
 */
export default function AdminMenuRecovery() {
  const { loading, failed, unauthorized } = useEntitlements();

  useEffect(() => {
    if (loading || typeof window === "undefined") return;

    if (unauthorized) {
      sessionStorage.removeItem(RELOAD_KEY);
      clearAuthSession({ notify: false });
      window.location.assign("/login");
      return;
    }

    if (!failed) {
      sessionStorage.removeItem(RELOAD_KEY);
      return;
    }

    if (sessionStorage.getItem(RELOAD_KEY) === "1") {
      sessionStorage.removeItem(RELOAD_KEY);
      clearAuthSession({ notify: false });
      window.location.assign("/login");
      return;
    }

    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }, [loading, failed, unauthorized]);

  return null;
}
