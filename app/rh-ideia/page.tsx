"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { RhIdeiaShell } from "../components/rhIdeia/RhIdeiaShell";
import { useSaasAccess } from "../hooks/useSaasAccess";
import { iriFetch } from "../lib/rhIdeia/api";
import type { IriHomeData } from "../lib/rhIdeia/types";

function Section({
  title,
  href,
  hint,
  children,
}: {
  title: string;
  href?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        {href && (
          <Link href={href} className="text-sm text-teal-400 hover:underline">
            Ver todos
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "alert" && value > 0 ? "text-red-300" : "text-teal-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function RhIdeiaStaffHomePage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [data, setData] = useState<IriHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await iriFetch<IriHomeData>("/home");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar suas pendências.");
    } else {
      setError(null);
      setData(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white">
        <p className="text-slate-400">Sem acesso ao Ideia RH.</p>
      </div>
    );
  }

  const pendingAck =
    data?.pending_ack_count ??
    data?.comunicados.filter((c) => c.requires_ack && !c.acked_at).length ??
    0;
  const pendingTrainings =
    data?.pending_training_count ??
    data?.treinamentos.filter((t) => t.status === "pendente" || t.status === "vencido").length ??
    0;

  return (
    <RhIdeiaShell mode="staff" title="Minhas pendências">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
          {error}
        </div>
      )}

      {loading && !data ? (
        <p className="text-slate-400">Carregando…</p>
      ) : data ? (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <Summary label="Comunicados sem ciência" value={pendingAck} tone="alert" />
            <Summary label="Treinamentos pendentes" value={pendingTrainings} tone="alert" />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Comunicados" href="/rh-ideia/comunicados">
              <ul className="space-y-2">
                {data.comunicados.map((c) => (
                  <li key={c.id} className="border-b border-white/5 py-2 text-sm">
                    <span className="font-medium">{c.title}</span>
                    <span className="ml-2 text-slate-500">
                      {c.acked_at
                        ? "ciência ok"
                        : c.requires_ack
                          ? "aguardando ciência"
                          : "comunicado"}
                    </span>
                  </li>
                ))}
                {data.comunicados.length === 0 && (
                  <p className="text-sm text-slate-400">Nenhum comunicado pendente.</p>
                )}
              </ul>
            </Section>

            <Section title="Treinamentos" href="/rh-ideia/treinamentos">
              <ul className="space-y-2">
                {data.treinamentos.map((t) => (
                  <li key={t.id} className="border-b border-white/5 py-2 text-sm">
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-2 text-slate-500">
                      {t.status}
                      {t.is_mandatory && " · obrigatório"}
                    </span>
                  </li>
                ))}
                {data.treinamentos.length === 0 && (
                  <p className="text-sm text-slate-400">Nenhum treinamento pendente.</p>
                )}
              </ul>
            </Section>
          </div>
        </div>
      ) : null}
    </RhIdeiaShell>
  );
}
