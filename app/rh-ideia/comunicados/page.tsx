"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnnouncementCard } from "../../components/justino360/AnnouncementCard";
import { RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_PRIMARY,
  IRI_DENIED,
  IRI_INFO,
  IRI_MUTED,
  IRI_OK,
} from "../../components/rhIdeia/ui";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriAnnouncement } from "../../lib/rhIdeia/types";

export default function RhIdeiaStaffComunicadosPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [acking, setAcking] = useState<number | null>(null);
  const readRegistered = useRef<Set<number>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    iriFetch<IriAnnouncement[]>("/announcements")
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

  useEffect(() => {
    const pending = items.filter((i) => !i.read_at && !readRegistered.current.has(i.id));
    if (pending.length === 0) return;
    const ids = pending.map((i) => i.id);
    ids.forEach((id) => readRegistered.current.add(id));
    Promise.all(
      ids.map(async (id) => {
        const res = await iriFetch(`/announcements/${id}/read`, { method: "POST" });
        if (!res.success) {
          console.error(`[iri] falha ao registrar leitura do comunicado ${id}:`, res.message);
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
    const res = await iriFetch<{ acked_at?: string }>(`/announcements/${id}/ack`, {
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
      <div className={IRI_DENIED}>
        <p>Sem acesso</p>
      </div>
    );
  }

  const pendingAck = items.filter((i) => i.requires_ack && !i.acked_at).length;

  return (
    <RhIdeiaShell mode="staff" title="Comunicados">
      {feedback && (
        <p role="status" className={`mb-4 ${feedback.tone === "ok" ? IRI_OK : IRI_ALERT}`}>
          {feedback.text}
        </p>
      )}

      {pendingAck > 0 && (
        <p className={`mb-4 ${IRI_INFO}`}>
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
            tone="light"
            actions={
              item.requires_ack && !item.acked_at ? (
                <button
                  type="button"
                  onClick={() => ack(item.id)}
                  disabled={acking === item.id}
                  className={IRI_BTN_PRIMARY}
                >
                  {acking === item.id ? "Confirmando…" : "Confirmar ciência"}
                </button>
              ) : null
            }
          />
        ))}
      </ul>
      {loading && <p className={`text-sm ${IRI_MUTED}`}>Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className={`text-sm ${IRI_MUTED}`}>Nenhum comunicado no momento.</p>
      )}
    </RhIdeiaShell>
  );
}
