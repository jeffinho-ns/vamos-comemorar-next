"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { IriBarChart, IriBarMeter } from "../components/rhIdeia/RhIdeiaCharts";
import { IriNotebookIllustration } from "../components/rhIdeia/RhIdeiaIllustrations";
import { MyEvaluation } from "../components/rhIdeia/MyEvaluation";
import { RhIdeiaShell } from "../components/rhIdeia/RhIdeiaShell";
import { IRI_ALERT, IRI_CARD, IRI_DENIED, IRI_LINK, IRI_MUTED } from "../components/rhIdeia/ui";
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
    <section className={IRI_CARD}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {hint && <p className={`text-xs ${IRI_MUTED}`}>{hint}</p>}
        </div>
        {href && (
          <Link href={href} className={`text-sm ${IRI_LINK}`}>
            Ver todos
          </Link>
        )}
      </div>
      {children}
    </section>
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
      <div className={IRI_DENIED}>
        <p>Sem acesso ao Ideia RH.</p>
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
  const chartMax = Math.max(pendingAck, pendingTrainings, 1);

  return (
    <RhIdeiaShell mode="staff" title="Minhas pendências">
      {error && (
        <div className={`mb-4 ${IRI_ALERT}`} role="alert">
          {error}
        </div>
      )}

      {loading && !data ? (
        <p className={IRI_MUTED}>Carregando…</p>
      ) : data ? (
        <div className="space-y-6">
          <section className={`${IRI_CARD} relative overflow-hidden`}>
            <div className="absolute -right-2 -top-2 opacity-80">
              <IriNotebookIllustration className="h-24 w-24" />
            </div>
            <h2 className="relative text-lg font-semibold text-slate-900">Resumo visual</h2>
            <p className={`relative mt-1 text-sm ${IRI_MUTED}`}>
              Comunicados e treinamentos que ainda pedem a sua atenção.
            </p>
            <div className="relative mt-5 grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <IriBarMeter
                  label="Comunicados sem ciência"
                  value={pendingAck}
                  max={chartMax}
                  tone={pendingAck > 0 ? "rose" : "teal"}
                />
                <IriBarMeter
                  label="Treinamentos pendentes"
                  value={pendingTrainings}
                  max={chartMax}
                  tone={pendingTrainings > 0 ? "amber" : "teal"}
                />
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                <IriBarChart
                  items={[
                    {
                      label: "Sem ciência",
                      value: pendingAck,
                      tone: pendingAck > 0 ? "rose" : "teal",
                    },
                    {
                      label: "Treinos",
                      value: pendingTrainings,
                      tone: pendingTrainings > 0 ? "amber" : "indigo",
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          <MyEvaluation />

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Comunicados" href="/rh-ideia/comunicados">
              <ul className="space-y-2">
                {data.comunicados.map((c) => (
                  <li key={c.id} className="border-b border-stone-100 py-2 text-sm last:border-0">
                    <span className="font-medium text-slate-900">{c.title}</span>
                    <span className={`ml-2 ${IRI_MUTED}`}>
                      {c.acked_at
                        ? "ciência ok"
                        : c.requires_ack
                          ? "aguardando ciência"
                          : "comunicado"}
                    </span>
                  </li>
                ))}
                {data.comunicados.length === 0 && (
                  <p className={`text-sm ${IRI_MUTED}`}>Nenhum comunicado pendente.</p>
                )}
              </ul>
            </Section>

            <Section title="Treinamentos" href="/rh-ideia/treinamentos">
              <ul className="space-y-2">
                {data.treinamentos.map((t) => (
                  <li key={t.id} className="border-b border-stone-100 py-2 text-sm last:border-0">
                    <span className="font-medium text-slate-900">{t.title}</span>
                    <span className={`ml-2 ${IRI_MUTED}`}>
                      {t.status}
                      {t.is_mandatory && " · obrigatório"}
                    </span>
                  </li>
                ))}
                {data.treinamentos.length === 0 && (
                  <p className={`text-sm ${IRI_MUTED}`}>Nenhum treinamento pendente.</p>
                )}
              </ul>
            </Section>
          </div>
        </div>
      ) : null}
    </RhIdeiaShell>
  );
}
