"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSaasGuard } from "../../components/AdminSaasGuard";
import { IriBarChart, IriBarMeter, IriRingChart } from "../../components/rhIdeia/RhIdeiaCharts";
import { IriTeamIllustration } from "../../components/rhIdeia/RhIdeiaIllustrations";
import { WeekPeopleBoard } from "../../components/rhIdeia/WeekPeopleBoard";
import { IRI_FIELD, RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_SECONDARY,
  IRI_CARD,
  IRI_MUTED,
  IRI_SOFT,
} from "../../components/rhIdeia/ui";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type {
  IriDashboardData,
  IriEstablishment,
  IriTeamRow,
} from "../../lib/rhIdeia/types";

function Stat({
  label,
  value,
  href,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  href?: string;
  suffix?: string;
  tone?: "alert";
}) {
  const highlight =
    tone === "alert" && Number(value) > 0 ? "text-rose-600" : "text-teal-700";
  const content = (
    <>
      <p className={`text-sm ${IRI_MUTED}`}>{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${highlight}`}>
        {value}
        {suffix && <span className={`ml-1 text-lg font-normal ${IRI_MUTED}`}>{suffix}</span>}
      </p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={`${IRI_CARD} block transition hover:border-teal-300 hover:shadow-md`}
      >
        {content}
      </Link>
    );
  }
  return <div className={IRI_CARD}>{content}</div>;
}

function manualComplete(row: IriTeamRow): boolean {
  return (
    row.term_accepted &&
    row.quiz_passed &&
    row.chapters_required > 0 &&
    row.chapters_read >= row.chapters_required
  );
}

export default function RhIdeiaAdminDashboardPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  const [data, setData] = useState<IriDashboardData | null>(null);
  const [team, setTeam] = useState<IriTeamRow[]>([]);
  const [establishments, setEstablishments] = useState<IriEstablishment[]>([]);
  const [establishmentId, setEstablishmentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    iriFetch<IriEstablishment[]>("/establishments").then((res) => {
      if (res.success && res.data) setEstablishments(res.data);
    });
    iriFetch<IriTeamRow[]>("/playbook/team").then((res) => {
      if (res.success && res.data) setTeam(res.data);
    });
  }, [allowed]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await iriFetch<IriDashboardData>(
      "/dashboard",
      {},
      establishmentId ? { establishment_id: establishmentId } : undefined,
    );
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar os indicadores.");
      setData(null);
    } else {
      setError(null);
      setData(res.data);
    }
    setLoading(false);
  }, [establishmentId]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const filteredTeam = useMemo(() => {
    if (!establishmentId) return team;
    return team.filter((row) => String(row.establishment_id) === establishmentId);
  }, [team, establishmentId]);

  const manualRate = useMemo(() => {
    if (filteredTeam.length === 0) return null;
    const done = filteredTeam.filter(manualComplete).length;
    return Math.round((done / filteredTeam.length) * 100);
  }, [filteredTeam]);

  const semCiencia = data?.comunicados_sem_ciencia ?? data?.comunicados_sem_ciencia_total ?? 0;
  const treinosPendentes = data?.treinamentos_pendentes ?? data?.atribuicoes_pendentes ?? 0;
  const treinosVencidos = data?.treinamentos_vencidos ?? data?.atribuicoes_vencidas ?? 0;
  const unidades = data?.por_unidade ?? [];
  const chartMax = Math.max(semCiencia, treinosPendentes, treinosVencidos, 1);

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaShell mode="admin" title="Dashboard RH">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className={`text-sm ${IRI_SOFT}`} htmlFor="iri-est-filter">
            Filtrar por unidade
          </label>
          <select
            id="iri-est-filter"
            className={IRI_FIELD}
            value={establishmentId}
            onChange={(e) => setEstablishmentId(e.target.value)}
          >
            <option value="">Todas as unidades (consolidado)</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className={`mb-4 ${IRI_ALERT}`} role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className={`mt-2 ${IRI_BTN_SECONDARY}`}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {loading && !data ? (
          <p className={IRI_MUTED}>Carregando indicadores…</p>
        ) : data ? (
          <div className="space-y-8">
            <section className={`${IRI_CARD} relative overflow-hidden`}>
              <div className="absolute right-2 top-2 opacity-90">
                <IriTeamIllustration className="h-24 w-24" />
              </div>
              <h2 className="relative text-lg font-semibold text-slate-900">Panorama</h2>
              <p className={`relative mt-1 text-sm ${IRI_MUTED}`}>
                Pendências do grupo e conclusão do manual operacional.
              </p>
              <div className="relative mt-5 grid gap-6 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <IriBarMeter
                      label="Sem ciência"
                      value={semCiencia}
                      max={chartMax}
                      tone={semCiencia > 0 ? "rose" : "teal"}
                      href="/admin/rh-ideia/comunicados"
                    />
                    <IriBarMeter
                      label="Treinos pendentes"
                      value={treinosPendentes}
                      max={chartMax}
                      tone="indigo"
                      href="/admin/rh-ideia/treinamentos"
                    />
                    <IriBarMeter
                      label="Treinos vencidos"
                      value={treinosVencidos}
                      max={chartMax}
                      tone={treinosVencidos > 0 ? "amber" : "teal"}
                      href="/admin/rh-ideia/treinamentos"
                    />
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                    <IriBarChart
                      items={[
                        {
                          label: "Sem ciência",
                          value: semCiencia,
                          tone: "rose",
                        },
                        {
                          label: "Pendentes",
                          value: treinosPendentes,
                          tone: "indigo",
                        },
                        {
                          label: "Vencidos",
                          value: treinosVencidos,
                          tone: "amber",
                        },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                  {manualRate === null ? (
                    <p className={`text-sm ${IRI_MUTED}`}>
                      Sem dados de equipe do manual para calcular conclusão.
                    </p>
                  ) : (
                    <IriRingChart
                      value={manualRate}
                      label="Conclusão do manual"
                      hint={`${filteredTeam.filter(manualComplete).length} de ${filteredTeam.length} pessoas`}
                      tone={manualRate >= 80 ? "teal" : manualRate >= 50 ? "indigo" : "amber"}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Comunicados sem ciência"
                value={semCiencia}
                href="/admin/rh-ideia/comunicados"
                tone="alert"
              />
              <Stat
                label="Treinamentos pendentes"
                value={treinosPendentes}
                href="/admin/rh-ideia/treinamentos"
              />
              <Stat
                label="Treinamentos vencidos"
                value={treinosVencidos}
                href="/admin/rh-ideia/treinamentos"
                tone="alert"
              />
              <Stat label="Colaboradores ativos" value={data.colaboradores_ativos ?? unidades.reduce((sum, unit) => sum + (unit.staff_count || 0), 0)} />
            </section>

            <WeekPeopleBoard />

            <section className={IRI_CARD}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Ciência por unidade</h2>
              {unidades.length === 0 ? (
                <p className={`text-sm ${IRI_MUTED}`}>Nenhuma unidade com dados ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {unidades.map((unit) => (
                    <li
                      key={unit.establishment_id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 py-2 text-sm last:border-0"
                    >
                      <span className="font-medium text-slate-800">{unit.establishment_name}</span>
                      <span className={IRI_MUTED}>
                        {unit.ack_rate}% ciência · {unit.pending_trainings} treino(s) pendente(s)
                        {unit.staff_count > 0 && ` · ${unit.staff_count} colaboradores`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </RhIdeiaShell>
    </AdminSaasGuard>
  );
}
