"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { TrainingCard } from "../../components/justino360/TrainingCard";
import { J360MyTraining, TrainingStatus } from "../../components/justino360/trainingMeta";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

type Tab = "abertos" | "concluido" | "vencido" | "todos";

const TABS: { key: Tab; label: string }[] = [
  { key: "abertos", label: "A fazer" },
  { key: "vencido", label: "Vencidos" },
  { key: "concluido", label: "Concluídos" },
  { key: "todos", label: "Todos" },
];

const OPEN_STATUSES: TrainingStatus[] = ["pendente", "em_andamento"];

export default function StaffTreinamentosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360MyTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("abertos");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    j360Fetch<J360MyTraining[]>("/my-trainings")
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

  /** Abrir o material já tira do "pendente" — falha aqui não bloqueia a leitura. */
  function markStarted(item: J360MyTraining) {
    if (item.status !== "pendente" && item.status !== "vencido") return;
    j360Fetch(`/trainings/${item.training_id}/start`, { method: "POST" })
      .then((res) => {
        if (res.success) load();
      })
      .catch((err) => console.error("[j360] iniciar treinamento:", err));
  }

  async function complete(item: J360MyTraining) {
    const res = await j360Fetch(`/trainings/${item.training_id}/complete`, {
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Meus treinamentos">
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
                ? "bg-amber-500 text-gray-900"
                : "bg-white/5 text-gray-200 hover:bg-white/10"
            }`}
          >
            {item.label} ({counts[item.key]})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {visible.map((item) => (
          <TrainingCard
            key={item.id}
            item={item}
            onOpen={markStarted}
            onComplete={complete}
          />
        ))}
      </ul>

      {!loading && visible.length === 0 && (
        <p className="text-sm text-gray-400">
          {tab === "abertos"
            ? "Nada pendente por aqui. Bom turno!"
            : "Nenhum treinamento nesta lista."}
        </p>
      )}
      {loading && <p className="text-sm text-gray-400">Carregando treinamentos…</p>}
    </Justino360Shell>
  );
}
