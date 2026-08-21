"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import {
  INCIDENT_STATUS_LABEL,
  PRIORITY_LABEL,
  formatDateTime,
  priorityClass,
} from "../../../lib/justino360/labels";
import type { J360Asset, J360Incident, Priority } from "../../../lib/justino360/types";

type Sector = { id: number; name: string };

const FILTERS = [
  { key: "abertas", label: "Abertas" },
  { key: "todas", label: "Todas" },
  { key: "solucionada", label: "Solucionadas" },
] as const;

export default function AdminOcorrenciasPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Incident[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [assets, setAssets] = useState<J360Asset[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("abertas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [sectorId, setSectorId] = useState("");
  const [assetId, setAssetId] = useState("");

  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [solution, setSolution] = useState("");

  const load = useCallback(async () => {
    const query =
      filter === "abertas" ? "?open=1" : filter === "solucionada" ? "?status=solucionada" : "";
    const res = await j360Fetch<J360Incident[]>(`/incidents${query}`);
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar as ocorrências.");
    } else {
      setError(null);
      setItems(res.data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    j360Fetch<Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
    j360Fetch<J360Asset[]>("/assets").then((res) => {
      if (res.success && res.data) setAssets(res.data);
    });
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await j360Fetch("/incidents", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        priority,
        sector_id: sectorId ? Number(sectorId) : undefined,
        asset_id: assetId ? Number(assetId) : undefined,
        create_task: true,
      }),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível registrar a ocorrência.");
      return;
    }
    setTitle("");
    setDescription("");
    setPriority("media");
    setSectorId("");
    setAssetId("");
    await load();
  }

  async function confirmResolve(id: number) {
    if (solution.trim().length < 3) {
      setError("Descreva a solução aplicada (mínimo 3 caracteres).");
      return;
    }
    setBusy(true);
    const res = await j360Fetch(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "solucionada", solution: solution.trim() }),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível encerrar a ocorrência.");
      return;
    }
    setResolvingId(null);
    setSolution("");
    setError(null);
    await load();
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Central de ocorrências">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
            {error}
          </div>
        )}

        <form
          onSubmit={onCreate}
          className="mb-8 space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
          <h2 className="font-medium">Nova ocorrência</h2>
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="Título (ex: freezer do bar sem gelar)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            required
          />
          <textarea
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="Descrição do que aconteceu"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={4000}
          />
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="inc-priority" className="mb-1 block text-xs text-gray-400">
                Prioridade
              </label>
              <select
                id="inc-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              >
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inc-sector" className="mb-1 block text-xs text-gray-400">
                Setor
              </label>
              <select
                id="inc-sector"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              >
                <option value="">Geral</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {assets.length > 0 && (
              <div>
                <label htmlFor="inc-asset" className="mb-1 block text-xs text-gray-400">
                  Equipamento
                </label>
                <select
                  id="inc-asset"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
                >
                  <option value="">Nenhum</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
          >
            Registrar (gera tarefa)
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setLoading(true);
                setFilter(f.key);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                filter === f.key
                  ? "bg-amber-500 text-gray-900"
                  : "bg-white/5 text-gray-200 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando…</p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{i.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(i.priority)}`}
                      >
                        {PRIORITY_LABEL[i.priority] || i.priority}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 ring-1 ring-white/20">
                        {INCIDENT_STATUS_LABEL[i.status] || i.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      {i.sector_name || "Geral"} · {formatDateTime(i.created_at)}
                      {i.created_by_name ? ` · por ${i.created_by_name}` : ""}
                    </p>
                    {i.description && (
                      <p className="mt-1 text-sm text-gray-300">{i.description}</p>
                    )}
                    {i.checklist_item_title && (
                      <p className="mt-1 text-xs text-gray-500">
                        Origem: checklist · {i.checklist_item_title}
                      </p>
                    )}
                    {i.solution && (
                      <p className="mt-1 text-xs text-emerald-300">Solução: {i.solution}</p>
                    )}
                    {i.evidence_url && (
                      <a
                        href={i.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-amber-300 underline"
                      >
                        Ver evidência
                      </a>
                    )}
                  </div>
                  {i.status !== "solucionada" && i.status !== "cancelada" && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolvingId(resolvingId === i.id ? null : i.id);
                        setSolution("");
                      }}
                      className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
                    >
                      Resolver
                    </button>
                  )}
                </div>

                {resolvingId === i.id && (
                  <div className="mt-3 space-y-2 rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
                    <label
                      htmlFor={`sol-${i.id}`}
                      className="block text-sm font-medium text-gray-200"
                    >
                      O que foi feito para resolver?
                    </label>
                    <textarea
                      id={`sol-${i.id}`}
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      rows={2}
                      maxLength={4000}
                      className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmResolve(i.id)}
                        disabled={busy}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-gray-900 disabled:opacity-50"
                      >
                        Encerrar ocorrência
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      As tarefas abertas dessa ocorrência são concluídas automaticamente.
                    </p>
                  </div>
                )}
              </li>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma ocorrência neste filtro.</p>
            )}
          </ul>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
