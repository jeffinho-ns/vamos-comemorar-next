"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlaybookChecklist } from "../../components/rhIdeia/PlaybookChecklist";
import { PlaybookReader } from "../../components/rhIdeia/PlaybookReader";
import { RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_PRIMARY,
  IRI_CARD,
  IRI_DENIED,
  IRI_LINK,
  IRI_MUTED,
  IRI_SOFT,
} from "../../components/rhIdeia/ui";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriPlaybookChapter, IriPlaybookStatus } from "../../lib/rhIdeia/types";

export default function RhIdeiaManualPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [status, setStatus] = useState<IriPlaybookStatus | null>(null);
  const [chapters, setChapters] = useState<IriPlaybookChapter[]>([]);
  const [watermark, setWatermark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [statusRes, chapterRes] = await Promise.all([
      iriFetch<IriPlaybookStatus>("/playbook/status"),
      iriFetch<IriPlaybookChapter[]>("/playbook/chapters"),
    ]);
    if (!statusRes.success) setError(statusRes.message || "Não foi possível abrir o manual.");
    else setStatus(statusRes.data || null);
    if (chapterRes.success && chapterRes.data) setChapters(chapterRes.data);
    const meta = (chapterRes as { meta?: { watermark?: string } }).meta;
    if (meta?.watermark) setWatermark(meta.watermark);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function markRead(id: number) {
    const res = await iriFetch(`/playbook/chapters/${id}/read`, { method: "POST" });
    if (!res.success) {
      setError(res.message || "Não foi possível registrar a leitura.");
      return;
    }
    setChapters((current) => current.map((chapter) => (chapter.id === id ? { ...chapter, read: true } : chapter)));
    load();
  }

  async function acceptTerm() {
    const res = await iriFetch("/playbook/term", { method: "POST" });
    if (!res.success) setError(res.message || "Não foi possível registrar o termo.");
    else load();
  }

  if (!allowed) {
    return (
      <div className={IRI_DENIED}>
        <p>Sem acesso</p>
      </div>
    );
  }

  return (
    <RhIdeiaShell mode="staff" title="Manual da sua função">
      {error && <p className={`mb-4 ${IRI_ALERT}`}>{error}</p>}
      {loading ? (
        <p className={IRI_MUTED}>Carregando o manual…</p>
      ) : status?.reason === "sem_ficha" ? (
        <p className={IRI_SOFT}>
          O RH ainda não cadastrou a sua função. Enquanto isso, o restante do Ideia RH fica fechado.
        </p>
      ) : (
        <div className="space-y-6">
          <p className={`text-sm ${IRI_SOFT}`}>
            Leitura só dentro do sistema. Este texto não baixa, não imprime e não é de outra função.
            {status?.blocked
              ? " Conclua a leitura, o termo e a prova para liberar o resto."
              : " Sua versão vigente está em dia."}
          </p>
          <PlaybookReader chapters={chapters} watermark={watermark || status?.profile?.user_name || ""} onRead={markRead} />
          <PlaybookChecklist />
          <section className={IRI_CARD}>
            <h2 className="text-lg font-semibold text-slate-900">Termo de confidencialidade</h2>
            <p className={`mt-2 text-sm ${IRI_SOFT}`}>
              O manual é interno. Você não copia, fotografa nem encaminha o conteúdo para fora da casa.
            </p>
            <button
              type="button"
              disabled={Boolean(status?.term_accepted)}
              onClick={acceptTerm}
              className={`mt-4 ${IRI_BTN_PRIMARY}`}
            >
              {status?.term_accepted ? "Termo aceito" : "Li e aceito o termo"}
            </button>
          </section>
          <Link href="/rh-ideia/manual/prova" className={`inline-block text-sm ${IRI_LINK}`}>
            Ir para a prova (mínimo 14 de 20)
            {status?.quiz_passed ? ` · nota ${status.quiz_score}/${status.quiz_total}` : ""}
          </Link>
        </div>
      )}
    </RhIdeiaShell>
  );
}
