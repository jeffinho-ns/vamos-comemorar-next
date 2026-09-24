"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MdLightbulb, MdWarning } from "react-icons/md";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriPlaybookStatus } from "../../lib/rhIdeia/types";

type Tip = {
  id?: string;
  title: string;
  body: string;
  href: string;
  label: string;
};

type AttentionPayload = {
  tips: Tip[];
};

const HOUSE_TIPS: Tip[] = [
  {
    id: "manual",
    title: "Manual da função",
    body: "Cada pessoa lê só o capítulo do próprio cargo. Na primeira visita, a leitura, o termo e a prova de 14 em 20 liberam o restante da área.",
    href: "/rh-ideia/manual",
    label: "Abrir o manual",
  },
  {
    id: "justino360",
    title: "Operação e people ops",
    body: "O checklist, a foto e a ocorrência do turno ficam no Justino360. O padrão da função fica na área do colaborador.",
    href: "/justino360",
    label: "Abrir o Justino360",
  },
  {
    id: "capacidade",
    title: "Capacidade da casa",
    body: "Camarote, área VIP e rooftop só seguem depois de conferir se ainda cabe gente naquele espaço.",
    href: "/admin/restaurant-reservations",
    label: "Ver reservas",
  },
  {
    id: "ronda-geral",
    title: "Ronda do líder",
    body: "Uma passagem pela casa por dia, registrada na equipe, entra na pontuação do mês junto com a prova e o checklist confirmado por outra pessoa.",
    href: "/rh-ideia/equipe",
    label: "Minha equipe",
  },
  {
    id: "whatsapp",
    title: "Atendimento no WhatsApp",
    body: "Uma pergunta por vez, em texto corrido. O cliente não recebe lista nem formulário.",
    href: "/admin/guia",
    label: "Guia interno",
  },
];

function blockedManualTip(status: IriPlaybookStatus): Tip {
  return {
    id: "manual-bloqueado",
    title: "Seu manual ainda está aberto",
    body:
      status.reason === "sem_ficha"
        ? "Sua ficha de cargo ainda não foi publicada. Peça ao RH para vincular casa, setor e função."
        : "Falta concluir a leitura, o termo de confidencialidade ou a prova. O restante da área espera essa etapa.",
    href: "/rh-ideia/manual",
    label: "Continuar o manual",
  };
}

function isContinueManualTip(tip: Tip): boolean {
  return tip.href === "/rh-ideia/manual" && tip.label === "Continuar o manual";
}

export function DashboardTips() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<IriPlaybookStatus | null>(null);
  const [attentionTips, setAttentionTips] = useState<Tip[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      iriFetch<IriPlaybookStatus>("/playbook/status"),
      iriFetch<AttentionPayload>("/playbook/attention"),
    ]).then(([statusRes, attentionRes]) => {
      if (cancelled) return;
      if (statusRes.success && statusRes.data) setStatus(statusRes.data);
      if (attentionRes.success && attentionRes.data?.tips?.length) {
        setAttentionTips(attentionRes.data.tips);
      } else {
        setAttentionTips(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const tips = useMemo(() => {
    const base = attentionTips && attentionTips.length > 0 ? attentionTips : HOUSE_TIPS;
    if (!status?.blocked) return base;
    if (base.some(isContinueManualTip)) {
      const pending = base.find(isContinueManualTip)!;
      return [pending, ...base.filter((item) => !isContinueManualTip(item))];
    }
    return [blockedManualTip(status), ...base];
  }, [attentionTips, status]);

  useEffect(() => {
    setIndex(0);
  }, [tips]);

  const tip = tips[index % tips.length];

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-md p-5 sm:p-6 h-full min-h-[220px] flex flex-col">
      <div className="flex items-start gap-3">
        <MdWarning className="text-amber-500 shrink-0 mt-0.5" size={26} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-800">Atenção</h3>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 mt-1">
            Dica do turno
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MdLightbulb className="text-amber-500 shrink-0" size={18} />
          {tip.title}
        </p>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">{tip.body}</p>
        <Link
          href={tip.href}
          className="inline-flex mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {tip.label}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {index + 1} de {tips.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            onClick={() => setIndex((current) => (current - 1 + tips.length) % tips.length)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            onClick={() => setIndex((current) => (current + 1) % tips.length)}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
