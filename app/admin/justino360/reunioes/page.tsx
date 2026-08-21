"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

type Meeting = {
  id: number;
  title: string;
  meeting_at: string;
  minutes?: string;
  decisions_count?: number;
};

export default function AdminReunioesPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [decision, setDecision] = useState("");

  const load = useCallback(() => {
    j360Fetch<Meeting[]>("/meetings").then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const decisions = decision.trim()
      ? [{ decision: decision.trim(), create_task: true }]
      : [];
    const res = await j360Fetch("/meetings", {
      method: "POST",
      body: JSON.stringify({
        title,
        minutes: minutes || undefined,
        decisions,
      }),
    });
    if (res.success) {
      setTitle("");
      setMinutes("");
      setDecision("");
      load();
    }
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Reuniões e atas">
        <form
          onSubmit={onCreate}
          className="mb-8 space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
          <h2 className="font-medium">Nova reunião</h2>
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Ata / minutos"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            rows={4}
          />
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Decisão (gera tarefa automaticamente)"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Salvar
          </button>
        </form>
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-medium">{m.title}</p>
              <p className="text-sm text-gray-400">
                {new Date(m.meeting_at).toLocaleString("pt-BR")} ·{" "}
                {m.decisions_count ?? 0} decisões
              </p>
              {m.minutes && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-300">{m.minutes}</p>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma reunião registrada.</p>
          )}
        </ul>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
