"use client";

import { useState } from "react";
import { j360Fetch } from "../../lib/justino360/api";
import {
  INCIDENT_STATUS_LABEL,
  MAINTENANCE_KIND_LABEL,
  MAINTENANCE_STATUS_LABEL,
  formatDate,
  formatDateTime,
  maintenanceStatusClass,
} from "../../lib/justino360/labels";
import type { J360Asset, J360AssetDetail } from "../../lib/justino360/types";

/** Equipamento do inventário, com histórico de manutenção e ocorrências sob demanda. */
export function AssetCard({ asset }: { asset: J360Asset }) {
  const [detail, setDetail] = useState<J360AssetDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preventiveOverdue =
    !!asset.next_maintenance_at &&
    asset.next_maintenance_at.slice(0, 10) < new Date().toISOString().slice(0, 10);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (detail) return;
    setLoading(true);
    const res = await j360Fetch<J360AssetDetail>(`/assets/${asset.id}`);
    setLoading(false);
    if (res.success && res.data) {
      setDetail(res.data);
      setError(null);
    } else {
      setError(res.message || "Não foi possível carregar o histórico.");
    }
  }

  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{asset.name}</p>
          <p className="mt-1 text-sm text-gray-400">
            {asset.location || "Sem local"} · {asset.sector_name || "Geral"}
            {asset.code ? ` · ${asset.code}` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {asset.last_maintenance_at
              ? `Última manutenção: ${formatDateTime(asset.last_maintenance_at)}`
              : "Sem manutenção registrada"}
            {asset.next_maintenance_at
              ? ` · Próxima preventiva: ${formatDate(asset.next_maintenance_at)}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {preventiveOverdue && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200 ring-1 ring-red-500/40">
                Preventiva vencida
              </span>
            )}
            <span className="text-sm text-amber-400">
              {asset.open_tickets ?? 0} abertos
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
          >
            {open ? "Ocultar histórico" : "Ver histórico"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-4 rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
          {loading && <p className="text-sm text-gray-400">Carregando histórico…</p>}
          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {detail && (
            <>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-200">Manutenções</h3>
                {detail.maintenance.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum chamado registrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.maintenance.map((m) => (
                      <li key={m.id} className="border-b border-white/5 pb-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{m.title}</span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 ring-1 ring-white/20">
                            {MAINTENANCE_KIND_LABEL[m.kind] || m.kind}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${maintenanceStatusClass(m.status)}`}
                          >
                            {MAINTENANCE_STATUS_LABEL[m.status] || m.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Aberto em {formatDateTime(m.created_at)}
                          {m.performed_at
                            ? ` · concluído em ${formatDateTime(m.performed_at)}`
                            : ""}
                        </p>
                        {m.resolution && (
                          <p className="mt-0.5 text-xs text-emerald-300">
                            Serviço: {m.resolution}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-200">
                  Ocorrências ligadas
                </h3>
                {detail.incidents.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Nenhuma ocorrência apontou para este equipamento.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.incidents.map((i) => (
                      <li key={i.id} className="border-b border-white/5 pb-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{i.title}</span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 ring-1 ring-white/20">
                            {INCIDENT_STATUS_LABEL[i.status] || i.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDateTime(i.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}
