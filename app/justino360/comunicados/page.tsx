"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnnouncementCard } from "../../components/justino360/AnnouncementCard";
import { J360Announcement } from "../../components/justino360/announcementMeta";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

export default function StaffComunicadosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [acking, setAcking] = useState<number | null>(null);
  const readRegistered = useRef<Set<number>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    j360Fetch<J360Announcement[]>("/announcements")
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else
          setFeedback({
            tone: "error",
            text: res.message || "Não foi possível carregar os comunicados.",
          });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  // Registra a leitura (received/read) de quem abriu a tela, uma vez por comunicado.
  useEffect(() => {
    const pending = items.filter((i) => !i.read_at && !readRegistered.current.has(i.id));
    if (pending.length === 0) return;
    const ids = pending.map((i) => i.id);
    ids.forEach((id) => readRegistered.current.add(id));
    Promise.all(
      ids.map(async (id) => {
        const res = await j360Fetch(`/announcements/${id}/read`, { method: "POST" });
        if (!res.success) {
          console.error(`[j360] falha ao registrar leitura do comunicado ${id}:`, res.message);
        }
        return { id, ok: res.success };
      }),
    ).then((results) => {
      const confirmed = results.filter((r) => r.ok).map((r) => r.id);
      if (confirmed.length === 0) return;
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) => (confirmed.includes(i.id) && !i.read_at ? { ...i, read_at: now } : i)),
      );
    });
  }, [items]);

  async function ack(id: number) {
    setAcking(id);
    const res = await j360Fetch<{ acked_at?: string }>(`/announcements/${id}/ack`, {
      method: "POST",
    });
    setAcking(null);
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao confirmar ciência." });
      return;
    }
    const ackedAt = res.data?.acked_at || new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, acked_at: ackedAt } : i)));
    setFeedback({ tone: "ok", text: "Ciência registrada. Obrigado!" });
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  const pendingAck = items.filter((i) => i.requires_ack && !i.acked_at).length;

  return (
    <Justino360Shell mode="staff" title="Comunicados">
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

      {pendingAck > 0 && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {pendingAck === 1
            ? "1 comunicado aguarda sua confirmação de ciência."
            : `${pendingAck} comunicados aguardam sua confirmação de ciência.`}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <AnnouncementCard
            key={item.id}
            item={item}
            actions={
              item.requires_ack && !item.acked_at ? (
                <button
                  type="button"
                  onClick={() => ack(item.id)}
                  disabled={acking === item.id}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
                >
                  {acking === item.id ? "Confirmando…" : "Confirmar ciência"}
                </button>
              ) : null
            }
          />
        ))}
      </ul>
      {loading && <p className="text-sm text-gray-400">Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum comunicado no momento.</p>
      )}
    </Justino360Shell>
  );
}
