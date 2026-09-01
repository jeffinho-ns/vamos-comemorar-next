"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrainingCard } from "../../components/justino360/TrainingCard";
import { TrainingStatus } from "../../components/justino360/trainingMeta";
import { RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriMyTraining } from "../../lib/rhIdeia/types";

type Tab = "abertos" | "concluido" | "vencido" | "todos";

const TABS: { key: Tab; label: string }[] = [
  { key: "abertos", label: "A fazer" },
  { key: "vencido", label: "Vencidos" },
  { key: "concluido", label: "Concluídos" },
  { key: "todos", label: "Todos" },
];

const OPEN_STATUSES: TrainingStatus[] = ["pendente", "em_andamento"];

export default function RhIdeiaStaffTreinamentosPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriMyTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("abertos");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    iriFetch<IriMyTraining[]>("/my-trainings")
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setFeedback({ tone: "error", text: res.message || "Falha ao carregar treinamentos." });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const counts = useMemo(
    () => ({
      abertos: items.filter((i) => OPEN_STATUSES.includes(i.status)).length,
      vencido: items.filter((i) => i.status === "vencido").length,
      concluido: items.filter((i) => i.status === "concluido").length,
      todos: items.length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    if (tab === "todos") return items;
    if (tab === "abertos") return items.filter((i) => OPEN_STATUSES.includes(i.status));
    return items.filter((i) => i.status === tab);
  }, [items, tab]);

  function markStarted(item: IriMyTraining) {
    if (item.status !== "pendente" && item.status !== "vencido") return;
    iriFetch(`/trainings/${item.training_id}/start`, { method: "POST" })
      .then((res) => {
        if (res.success) load();
      })
      .catch((err) => console.error("[iri] iniciar treinamento:", err));
  }

  async function complete(item: IriMyTraining) {
    const res = await iriFetch(`/trainings/${item.training_id}/complete`, {
      method: "POST",
      body: JSON.stringify({ result: "concluido" }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao concluir treinamento." });
      return;
    }
    setFeedback({
      tone: "ok",
      text: item.validity_days
        ? `Treinamento concluído. Recicla em ${item.validity_days} dias.`
        : "Treinamento concluído.",
    });
    load();
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white">
        <p className="text-slate-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <RhIdeiaShell mode="staff" title="Meus treinamentos">
      {feedback && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            feedback.tone === "ok"
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {counts.vencido > 0 && tab !== "vencido" && (
        <p className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          Você tem {counts.vencido} treinamento(s) para reciclar.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === item.key
                ? "bg-teal-500 text-slate-900"
                : "bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {item.label} ({counts[item.key]})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {visible.map((item) => (
          <TrainingCard key={item.id} item={item} onOpen={markStarted} onComplete={complete} />
        ))}
      </ul>

      {!loading && visible.length === 0 && (
        <p className="text-sm text-slate-400">
          {tab === "abertos"
            ? "Nada pendente por aqui."
            : "Nenhum treinamento nesta lista."}
        </p>
      )}
      {loading && <p className="text-sm text-slate-400">Carregando treinamentos…</p>}
    </RhIdeiaShell>
  );
}
