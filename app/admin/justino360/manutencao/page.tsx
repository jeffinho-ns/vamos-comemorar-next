"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { AssetCard } from "../../../components/justino360/AssetCard";
import { AssetForm, type AssetFormValues } from "../../../components/justino360/AssetForm";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import {
  MaintenanceTicketCard,
  type TicketUpdate,
} from "../../../components/justino360/MaintenanceTicketCard";
import {
  MaintenanceTicketForm,
  type TicketFormValues,
} from "../../../components/justino360/MaintenanceTicketForm";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import { MAINTENANCE_KIND_LABEL } from "../../../lib/justino360/labels";
import type {
  J360Asset,
  J360Maintenance,
  J360MaintenanceMetrics,
  J360Sector,
} from "../../../lib/justino360/types";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "alert";
}) {
  const highlight =
    tone === "alert" && Number(value) > 0 ? "text-red-300" : "text-amber-400";
  return (
    <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${highlight}`}>{value}</p>
    </div>
  );
}

export default function AdminManutencaoPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [assets, setAssets] = useState<J360Asset[]>([]);
  const [tickets, setTickets] = useState<J360Maintenance[]>([]);
  const [sectors, setSectors] = useState<J360Sector[]>([]);
  const [metrics, setMetrics] = useState<J360MaintenanceMetrics | null>(null);
  const [sectorFilter, setSectorFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    const query = sectorFilter ? `?sector_id=${sectorFilter}` : "";
    const res = await j360Fetch<J360Asset[]>(`/assets${query}`);
    if (res.success && res.data) setAssets(res.data);
    else setError(res.message || "Não foi possível carregar os equipamentos.");
  }, [sectorFilter]);

  const loadQueue = useCallback(async () => {
    const [queue, stats] = await Promise.all([
      j360Fetch<J360Maintenance[]>("/maintenance?open=1"),
      j360Fetch<J360MaintenanceMetrics>("/maintenance-metrics"),
    ]);
    if (queue.success && queue.data) setTickets(queue.data);
    if (stats.success && stats.data) setMetrics(stats.data);
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadAssets(), loadQueue()]);
    setLoading(false);
  }, [loadAssets, loadQueue]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    j360Fetch<J360Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, []);

  async function createAsset(values: AssetFormValues) {
    setBusy(true);
    const res = await j360Fetch("/assets", {
      method: "POST",
      body: JSON.stringify(values),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível cadastrar o equipamento.");
      return false;
    }
    setError(null);
    setNotice(`Equipamento "${values.name}" cadastrado.`);
    await loadAssets();
    return true;
  }

  async function openTicket({ asset_id, ...rest }: TicketFormValues) {
    setBusy(true);
    const res = await j360Fetch(`/assets/${asset_id}/maintenance`, {
      method: "POST",
      body: JSON.stringify(rest),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível abrir o chamado.");
      return false;
    }
    setError(null);
    setNotice(`Chamado de ${MAINTENANCE_KIND_LABEL[rest.kind]} aberto.`);
    await loadAll();
    return true;
  }

  async function updateTicket(id: number, update: TicketUpdate) {
    setBusy(true);
    const res = await j360Fetch(`/maintenance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível atualizar o chamado.");
      return false;
    }
    setError(null);
    setNotice(update.status === "concluida" ? "Chamado concluído." : "Chamado atualizado.");
    await loadAll();
    return true;
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Manutenção de equipamentos">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
            {error}
          </div>
        )}
        {notice && !error && (
          <p className="mb-4 text-sm text-emerald-300" role="status">
            {notice}
          </p>
        )}

        {metrics && (
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Chamados abertos" value={metrics.abertos} tone="alert" />
            <Metric label="Concluídos (30 dias)" value={metrics.concluidos_30d} />
            <Metric
              label="Tempo médio (h)"
              value={metrics.tempo_medio_horas ?? "—"}
            />
            <Metric
              label="Preventivas vencidas"
              value={metrics.preventivas_vencidas}
              tone="alert"
            />
          </section>
        )}

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <AssetForm sectors={sectors} busy={busy} onSubmit={createAsset} />
          <MaintenanceTicketForm assets={assets} busy={busy} onSubmit={openTicket} />
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Chamados em aberto</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Carregando…</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum chamado em aberto.</p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <MaintenanceTicketCard
                  key={t.id}
                  ticket={t}
                  busy={busy}
                  onUpdate={updateTicket}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Equipamentos</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="asset-filter" className="text-xs text-gray-400">
                Setor
              </label>
              <select
                id="asset-filter"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="rounded-lg bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10"
              >
                <option value="">Todos</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ul className="space-y-3">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </ul>
          {assets.length === 0 && !loading && (
            <p className="text-sm text-gray-400">Nenhum equipamento neste filtro.</p>
          )}
        </section>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
