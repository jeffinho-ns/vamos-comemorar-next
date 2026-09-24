"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { AnnouncementCard } from "../../../components/justino360/AnnouncementCard";
import {
  AnnouncementForm,
  AnnouncementPayload,
} from "../../../components/justino360/AnnouncementForm";
import { J360Sector } from "../../../components/justino360/documentMeta";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_GHOST,
  IRI_CARD,
  IRI_MUTED,
  IRI_OK,
  IRI_SOFT,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { formatDateTime } from "../../../lib/justino360/labels";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriAnnouncement, IriAnnouncementReceipt } from "../../../lib/rhIdeia/types";

type Scope = "active" | "all";

export default function RhIdeiaAdminComunicadosPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriAnnouncement[]>([]);
  const [sectors, setSectors] = useState<J360Sector[]>([]);
  const [scope, setScope] = useState<Scope>("active");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [receipts, setReceipts] = useState<{
    item: IriAnnouncement;
    rows: IriAnnouncementReceipt[];
  } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    iriFetch<IriAnnouncement[]>(`/announcements?scope=${scope}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setFeedback({ tone: "error", text: res.message || "Falha ao carregar comunicados." });
      })
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed) return;
    iriFetch<J360Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  async function handleSubmit(payload: AnnouncementPayload) {
    const res = await iriFetch<IriAnnouncement>("/announcements", {
      method: "POST",
      body: JSON.stringify({ ...payload, scope: "organization" }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao publicar comunicado." });
      return false;
    }
    setFeedback({ tone: "ok", text: "Comunicado publicado para todo o grupo." });
    load();
    return true;
  }

  async function toggleActive(item: IriAnnouncement) {
    const res = await iriFetch<IriAnnouncement>(`/announcements/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao atualizar comunicado." });
      return;
    }
    setFeedback({
      tone: "ok",
      text: item.is_active ? "Comunicado encerrado." : "Comunicado reaberto.",
    });
    load();
  }

  async function openReceipts(item: IriAnnouncement) {
    const res = await iriFetch<IriAnnouncementReceipt[]>(`/announcements/${item.id}/receipts`);
    if (!res.success || !res.data) {
      setFeedback({ tone: "error", text: res.message || "Falha ao carregar ciências." });
      return;
    }
    setReceipts({ item, rows: res.data });
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaShell mode="admin" title="Comunicados">
        <p className={`mb-4 text-sm ${IRI_MUTED}`}>
          Publicações com escopo <strong className="text-slate-800">organização</strong> — todas as
          unidades do Grupo Ideia recebem.
        </p>

        {feedback && (
          <p role="status" className={`mb-4 ${feedback.tone === "ok" ? IRI_OK : IRI_ALERT}`}>
            {feedback.text}
          </p>
        )}

        <AnnouncementForm sectors={sectors} onSubmit={handleSubmit} tone="light" />

        <div className="mb-4 flex items-center gap-2">
          <select
            className={IRI_FIELD}
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            aria-label="Filtrar comunicados"
          >
            <option value="active">Vigentes</option>
            <option value="all">Todos (inclui encerrados e expirados)</option>
          </select>
        </div>

        {receipts && (
          <div className={`mb-6 ${IRI_CARD}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Ciência de “{receipts.item.title}”
              </h3>
              <button
                type="button"
                onClick={() => setReceipts(null)}
                className={`text-xs ${IRI_MUTED} underline hover:text-slate-800`}
              >
                Fechar
              </button>
            </div>
            {receipts.rows.length === 0 ? (
              <p className={`text-sm ${IRI_MUTED}`}>Ninguém abriu este comunicado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {receipts.rows.map((row) => (
                  <li
                    key={row.user_id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-slate-800">
                      {row.user_name || row.user_email || `Usuário ${row.user_id}`}
                      {row.establishment_name && (
                        <span className={`ml-2 text-xs ${IRI_MUTED}`}>{row.establishment_name}</span>
                      )}
                    </span>
                    <span className={`text-xs ${IRI_SOFT}`}>
                      {row.acked_at
                        ? `Ciência em ${formatDateTime(row.acked_at)}`
                        : row.read_at
                          ? `Leu em ${formatDateTime(row.read_at)} · sem ciência`
                          : "Recebeu, ainda não leu"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              tone="light"
              showCounts
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => openReceipts(item)} className={IRI_BTN_GHOST}>
                    Ver ciências
                  </button>
                  <button type="button" onClick={() => toggleActive(item)} className={IRI_BTN_GHOST}>
                    {item.is_active ? "Encerrar" : "Reabrir"}
                  </button>
                </div>
              }
            />
          ))}
        </ul>
        {loading && <p className={`text-sm ${IRI_MUTED}`}>Carregando comunicados…</p>}
        {!loading && items.length === 0 && (
          <p className={`text-sm ${IRI_MUTED}`}>Nenhum comunicado publicado.</p>
        )}
      </RhIdeiaShell>
    </AdminSaasGuard>
  );
}
