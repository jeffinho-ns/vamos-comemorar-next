"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../components/AdminSaasGuard";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";
import type { J360DashboardData } from "../../lib/justino360/types";

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "alert";
}) {
  const highlight = tone === "alert" && value > 0 ? "text-red-300" : "text-amber-400";
  const content = (
    <>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight}`}>{value}</p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10"
      >
        {content}
      </Link>
    );
  }
  return <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">{content}</div>;
}

export default function Justino360AdminPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [data, setData] = useState<J360DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await j360Fetch<J360DashboardData>("/dashboard");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar os indicadores.");
    } else {
      setError(null);
      setData(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Dashboard da gestão">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="mt-2 rounded bg-white/10 px-3 py-1 text-sm"
            >
              Tentar de novo
            </button>
          </div>
        )}
        {loading && !data ? (
          <p className="text-gray-400">Carregando indicadores…</p>
        ) : data ? (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Checklists concluídos hoje"
                value={data.checklists_concluidos_hoje}
                href="/admin/justino360/checklists"
              />
              <Stat
                label="Checklists não iniciados hoje"
                value={data.checklists_nao_iniciados_hoje}
                href="/admin/justino360/checklists"
                tone="alert"
              />
              <Stat
                label="Checklists atrasados"
                value={data.checklists_atrasados}
                href="/admin/justino360/checklists"
                tone="alert"
              />
              <Stat
                label="Ocorrências abertas"
                value={data.ocorrencias_abertas}
                href="/admin/justino360/ocorrencias"
              />
              <Stat
                label="Ocorrências alta/crítica"
                value={data.ocorrencias_criticas}
                href="/admin/justino360/ocorrencias"
                tone="alert"
              />
              <Stat
                label="Ocorrências resolvidas hoje"
                value={data.ocorrencias_solucionadas_hoje}
                href="/admin/justino360/ocorrencias"
              />
              <Stat
                label="Tarefas abertas"
                value={data.tarefas_abertas}
                href="/admin/justino360/tarefas"
              />
              <Stat
                label="Tarefas atrasadas"
                value={data.tarefas_atrasadas}
                href="/admin/justino360/tarefas"
                tone="alert"
              />
              <Stat
                label="Tarefas concluídas hoje"
                value={data.tarefas_concluidas_hoje}
                href="/admin/justino360/tarefas"
              />
              <Stat
                label="Treinamentos pendentes"
                value={data.treinamentos_pendentes}
                href="/admin/justino360/treinamentos"
              />
              <Stat
                label="Comunicados sem ciência"
                value={data.comunicados_sem_ciencia}
                href="/admin/justino360/comunicados"
              />
              <Stat
                label="Manutenções abertas"
                value={data.manutencoes_abertas ?? 0}
                href="/admin/justino360/manutencao"
                tone="alert"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <h2 className="mb-3 text-lg font-medium">Demandas por setor</h2>
                <ul className="space-y-2">
                  {data.por_setor.map((s) => (
                    <li
                      key={s.sector}
                      className="flex justify-between border-b border-white/5 py-2 text-sm"
                    >
                      <span>{s.sector}</span>
                      <span className="text-gray-400">
                        {s.tasks_open} tarefas · {s.incidents_open} ocorrências
                      </span>
                    </li>
                  ))}
                  {data.por_setor.length === 0 && (
                    <p className="text-sm text-gray-400">Nenhum setor cadastrado.</p>
                  )}
                </ul>
              </div>
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <h2 className="mb-3 text-lg font-medium">Problemas recorrentes (30d)</h2>
                {data.problemas_recorrentes.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma recorrência detectada.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.problemas_recorrentes.map((p) => (
                      <li
                        key={p.title}
                        className="flex justify-between border-b border-white/5 py-2 text-sm"
                      >
                        <span>{p.title}</span>
                        <span className="text-amber-400">{p.times}x</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
