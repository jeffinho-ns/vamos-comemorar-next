"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  endImpersonationSession,
  getImpersonationMeta,
  isImpersonating,
} from "../utils/impersonation";

export default function ImpersonationBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [meta, setMeta] = useState<ReturnType<typeof getImpersonationMeta>>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(isImpersonating());
      setMeta(getImpersonationMeta());
    };
    sync();
    window.addEventListener("auth:changed", sync);
    return () => window.removeEventListener("auth:changed", sync);
  }, []);

  if (!visible || !meta) return null;

  const handleEnd = async () => {
    setLoading(true);
    try {
      await endImpersonationSession();
      router.push("/superadmin");
    } catch {
      alert("Erro ao sair do modo suporte. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-amber-700 bg-amber-950 px-4 py-2 text-sm text-amber-100">
      <p>
        <strong>Modo suporte:</strong> você está acessando como{" "}
        <span className="font-semibold">{meta.targetName}</span> ({meta.targetEmail}
        ). Iniciado por {meta.impersonatorName}.
      </p>
      <button
        type="button"
        onClick={handleEnd}
        disabled={loading}
        className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "Saindo…" : "Encerrar impersonate"}
      </button>
    </div>
  );
}
