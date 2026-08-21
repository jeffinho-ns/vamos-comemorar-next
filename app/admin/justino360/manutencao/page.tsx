"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

type Asset = {
  id: number;
  name: string;
  code?: string;
  location?: string;
  sector_name?: string;
  open_tickets?: number;
};

type Metrics = {
  abertos: number;
  concluidos: number;
  tempo_medio_horas?: number | string | null;
};

export default function AdminManutencaoPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [ticketAssetId, setTicketAssetId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    j360Fetch<Asset[]>("/assets").then((r) => {
      if (r.success && r.data) setAssets(r.data);
    });
    j360Fetch<Metrics>("/maintenance-metrics").then((r) => {
      if (r.success && r.data) setMetrics(r.data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreateAsset(e: FormEvent) {
    e.preventDefault();
    const res = await j360Fetch("/assets", {
      method: "POST",
      body: JSON.stringify({ name, location: location || undefined }),
    });
    if (res.success) {
      setName("");
      setLocation("");
      load();
    }
  }

  async function onOpenTicket(e: FormEvent) {
    e.preventDefault();
    const assetId = Number(ticketAssetId);
    if (!assetId) return;
    const res = await j360Fetch(`/assets/${assetId}/maintenance`, {
      method: "POST",
      body: JSON.stringify({
        title: ticketTitle,
        description: ticketDesc || undefined,
        kind: "corretiva",
      }),
    });
    if (res.success) {
      setTicketTitle("");
      setTicketDesc("");
      setMsg("Chamado aberto.");
      load();
    } else {
      setMsg(res.message || "Falha ao abrir chamado.");
    }
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Manutenção de equipamentos">
        {msg && <p className="mb-4 text-sm text-amber-300">{msg}</p>}

        {metrics && (
          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm text-gray-400">Chamados abertos</p>
              <p className="mt-1 text-3xl font-semibold text-amber-400">
                {metrics.abertos}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm text-gray-400">Concluídos</p>
              <p className="mt-1 text-3xl font-semibold text-amber-400">
                {metrics.concluidos}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm text-gray-400">Tempo médio (h)</p>
              <p className="mt-1 text-3xl font-semibold text-amber-400">
                {metrics.tempo_medio_horas ?? "—"}
              </p>
            </div>
          </section>
        )}

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={onCreateAsset}
            className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h2 className="font-medium">Novo equipamento</h2>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Localização"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
            >
              Cadastrar
            </button>
          </form>

          <form
            onSubmit={onOpenTicket}
            className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h2 className="font-medium">Abrir chamado</h2>
            <select
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              value={ticketAssetId}
              onChange={(e) => setTicketAssetId(e.target.value)}
              required
            >
              <option value="">Selecione o equipamento</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Título do chamado"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Descrição"
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              rows={2}
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
            >
              Abrir
            </button>
          </form>
        </div>

        <ul className="space-y-3">
          {assets.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-sm text-gray-400">
                  {a.location || "Sem local"} · {a.sector_name || "Geral"}
                  {a.code ? ` · ${a.code}` : ""}
                </p>
              </div>
              <span className="text-sm text-amber-400">
                {a.open_tickets ?? 0} abertos
              </span>
            </li>
          ))}
          {assets.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum equipamento cadastrado.</p>
          )}
        </ul>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
