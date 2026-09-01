"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../components/AdminSaasGuard";
import { IRI_FIELD, RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriDashboardData, IriEstablishment } from "../../lib/rhIdeia/types";

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
  const highlight = tone === "alert" && Number(value) > 0 ? "text-red-300" : "text-teal-400";
  const content = (
    <>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight}`}>
        {value}
        {suffix && <span className="ml-1 text-lg font-normal text-slate-400">{suffix}</span>}
      </p>
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

export default function RhIdeiaAdminDashboardPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  const [data, setData] = useState<IriDashboardData | null>(null);
  const [establishments, setEstablishments] = useState<IriEstablishment[]>([]);
  const [establishmentId, setEstablishmentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    iriFetch<IriEstablishment[]>("/establishments").then((res) => {
      if (res.success && res.data) setEstablishments(res.data);
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

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaShell mode="admin" title="Dashboard RH">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-400" htmlFor="iri-est-filter">
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
          <p className="text-slate-400">Carregando indicadores…</p>
        ) : data ? (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Comunicados sem ciência"
                value={data.comunicados_sem_ciencia}
                href="/admin/rh-ideia/comunicados"
                tone="alert"
              />
              <Stat
                label="Treinamentos pendentes"
                value={data.treinamentos_pendentes}
                href="/admin/rh-ideia/treinamentos"
              />
              <Stat
                label="Treinamentos vencidos"
                value={data.treinamentos_vencidos}
                href="/admin/rh-ideia/treinamentos"
                tone="alert"
              />
              <Stat label="Colaboradores ativos" value={data.colaboradores_ativos} />
            </section>

            <section className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
              <h2 className="mb-3 text-lg font-medium">Ciência por unidade</h2>
              {data.por_unidade.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma unidade com dados ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {data.por_unidade.map((unit) => (
                    <li
                      key={unit.establishment_id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-200">{unit.establishment_name}</span>
                      <span className="text-slate-400">
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
