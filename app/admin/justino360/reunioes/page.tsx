"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { J360CalendarSector } from "../../../components/justino360/calendarMeta";
import { J360Assignee } from "../../../components/justino360/MeetingDecisionFields";
import {
  MeetingForm,
  MeetingPayload,
} from "../../../components/justino360/MeetingForm";
import { MeetingDecisionList } from "../../../components/justino360/MeetingDecisionList";
import {
  J360Meeting,
  J360MeetingDetail,
} from "../../../components/justino360/meetingMeta";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import { formatDateTime } from "../../../lib/justino360/labels";

export default function AdminReunioesPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Meeting[]>([]);
  const [sectors, setSectors] = useState<J360CalendarSector[]>([]);
  const [assignees, setAssignees] = useState<J360Assignee[]>([]);
  const [detail, setDetail] = useState<J360MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const load = useCallback(() => {
    setLoading(true);
    j360Fetch<J360Meeting[]>("/meetings")
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else
          setFeedback({
            tone: "error",
            text: res.message || "Falha ao carregar reuniões.",
          });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed) return;
    j360Fetch<J360CalendarSector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
    j360Fetch<J360Assignee[]>("/meetings/assignees").then((res) => {
      if (res.success && res.data) setAssignees(res.data);
    });
  }, [allowed]);

  async function handleSubmit(payload: MeetingPayload) {
    const res = await j360Fetch<J360MeetingDetail>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.success || !res.data) {
      setFeedback({ tone: "error", text: res.message || "Falha ao salvar reunião." });
      return false;
    }
    const created = res.data.decisions?.filter((d) => d.task_id).length ?? 0;
    setFeedback({
      tone: "ok",
      text:
        created > 0
          ? `Ata salva. ${created} tarefa(s) criada(s) a partir das decisões.`
          : "Ata salva.",
    });
    setDetail(res.data);
    load();
    return true;
  }

  const openDetail = useCallback(async (meeting: J360Meeting) => {
    if (detail?.id === meeting.id) {
      setDetail(null);
      return;
    }
    const res = await j360Fetch<J360MeetingDetail>(`/meetings/${meeting.id}`);
    if (!res.success || !res.data) {
      setFeedback({ tone: "error", text: res.message || "Falha ao abrir a ata." });
      return;
    }
    setDetail(res.data);
  }, [detail?.id]);

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Reuniões e atas">
        <p className="mb-6 max-w-3xl text-sm text-gray-300">
          Decisão sem responsável e prazo é decisão esquecida. Cada decisão
          registrada aqui vira uma tarefa da operação com origem “reunião”.
        </p>

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

        <MeetingForm
          sectors={sectors}
          assignees={assignees}
          onSubmit={handleSubmit}
        />

        <ul className="space-y-3">
          {items.map((meeting) => {
            const isOpen = detail?.id === meeting.id;
            return (
              <li
                key={meeting.id}
                className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-gray-400">
                      {formatDateTime(meeting.meeting_at)}
                      {meeting.created_by_name ? ` · ${meeting.created_by_name}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {meeting.decisions_count ?? 0} decisão(ões) ·{" "}
                      {meeting.tasks_open ?? 0} tarefa(s) em aberto ·{" "}
                      {meeting.tasks_done ?? 0} concluída(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDetail(meeting)}
                    aria-expanded={isOpen}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    {isOpen ? "Fechar" : "Ver ata e decisões"}
                  </button>
                </div>

                {meeting.attendees && (
                  <p className="mt-2 text-xs text-gray-400">
                    Presentes: {meeting.attendees}
                  </p>
                )}

                {isOpen && detail && (
                  <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    {detail.minutes && (
                      <div>
                        <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Ata
                        </h3>
                        <p className="whitespace-pre-wrap text-sm text-gray-300">
                          {detail.minutes}
                        </p>
                      </div>
                    )}
                    <MeetingDecisionList decisions={detail.decisions} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {loading && <p className="text-sm text-gray-400">Carregando reuniões…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-400">Nenhuma reunião registrada.</p>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
