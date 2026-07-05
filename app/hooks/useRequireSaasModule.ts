"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSaasAccess } from "./useSaasAccess";
import { useEntitlements } from "../context/EntitlementsContext";
import { isSaasModeEnabled } from "../utils/saasMode";

/**
 * Redireciona para /acesso-negado quando SaaS está on e o usuário não tem o módulo.
 * Fail-open com allowAll ou legacyScoped (UEP sem memberships).
 */
export function useRequireSaasModule(allowed: boolean) {
  const router = useRouter();
  const { entitlementsLoading } = useSaasAccess();
  const { entitlements } = useEntitlements();
  const { allowAll, legacyScoped } = entitlements;
  const saasOn = isSaasModeEnabled();

  useEffect(() => {
    if (!saasOn || entitlementsLoading || allowAll || legacyScoped) return;
    if (!allowed) router.replace("/acesso-negado");
  }, [saasOn, entitlementsLoading, allowAll, legacyScoped, allowed, router]);

  const guardLoading =
    saasOn && entitlementsLoading && !allowAll && !legacyScoped && !allowed;

  const blocked =
    saasOn && !entitlementsLoading && !allowed && !allowAll && !legacyScoped;

  return { guardLoading, blocked };
}
