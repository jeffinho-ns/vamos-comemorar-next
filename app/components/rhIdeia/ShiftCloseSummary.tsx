"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";
import { IRI_CARD, IRI_LINK, IRI_MUTED, IRI_SOFT } from "./ui";

export type ShiftJustino360 = {
  checklists_concluidos?: number;
  tarefas_concluidas?: number;
  ocorrencias_abertas?: number;
};

export type ShiftManualPendente = {
  user_id: number;
  name: string;
  role_label: string;
};

export type ShiftCloseSummaryData = {
  establishment_name: string;
  sector_name: string | null;
  justino360: ShiftJustino360;
  manual_pendente: ShiftManualPendente[];
  manual_pendente_total: number;
  fechado_em: string;
};

type Props = {
  /** Casa filtrada (RH / admin). Líderes de piso usam a casa da ficha. */
  establishmentId?: number | null;
  className?: string;
};

function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function justinoLine(j: ShiftJustino360): string | null {
  const parts: string[] = [];
  if (typeof j.checklists_concluidos === "number") {
    parts.push(
      `${j.checklists_concluidos} checklist${j.checklists_concluidos === 1 ? "" : "s"} concluído${j.checklists_concluidos === 1 ? "" : "s"}`,
    );
  }
  if (typeof j.tarefas_concluidas === "number") {
    parts.push(
      `${j.tarefas_concluidas} tarefa${j.tarefas_concluidas === 1 ? "" : "s"} concluída${j.tarefas_concluidas === 1 ? "" : "s"}`,
    );
  }
  if (typeof j.ocorrencias_abertas === "number") {
    parts.push(
      `${j.ocorrencias_abertas} ocorrência${j.ocorrencias_abertas === 1 ? "" : "s"} aberta${j.ocorrencias_abertas === 1 ? "" : "s"}`,
    );
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
}

export function ShiftCloseSummary({ establishmentId, className }: Props) {
  const [data, setData] = useState<ShiftCloseSummaryData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query =
      establishmentId != null && Number.isFinite(establishmentId)
        ? { establishment_id: establishmentId }
        : undefined;

    iriFetch<ShiftCloseSummaryData>("/playbook/shift-summary", {}, query).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setData(res.data);
      else setData(null);
    });

    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  if (!data) return null;

  const scope =
    data.sector_name != null
      ? `${data.establishment_name} · ${data.sector_name}`
      : data.establishment_name;
  const ops = justinoLine(data.justino360);
  const pendingPreview = data.manual_pendente.slice(0, 5);
  const extraPending = Math.max(0, data.manual_pendente_total - pendingPreview.length);

  return (
    <section className={`${IRI_CARD} ${className || ""}`.trim()}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Fim do expediente</h2>
        <p className={`text-xs ${IRI_MUTED}`}>{formatDay(data.fechado_em)}</p>
      </div>
      <p className={`mt-1 text-sm ${IRI_SOFT}`}>{scope}</p>

      {ops ? (
        <p className={`mt-3 text-sm text-slate-700`}>
          No Justino360 hoje: {ops}.
        </p>
      ) : (
        <p className={`mt-3 text-sm ${IRI_MUTED}`}>
          Sem números do Justino360 para esta casa no momento.
        </p>
      )}

      {data.manual_pendente_total === 0 ? (
        <p className={`mt-2 text-sm ${IRI_SOFT}`}>
          Toda a equipe visível concluiu o manual vigente.
        </p>
      ) : (
        <div className="mt-2">
          <p className={`text-sm text-slate-700`}>
            Manual pendente: {data.manual_pendente_total} pessoa
            {data.manual_pendente_total === 1 ? "" : "s"}
            {pendingPreview.length > 0 ? " — " : "."}
            {pendingPreview.map((p, i) => (
              <span key={p.user_id}>
                {i > 0 ? ", " : ""}
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className={IRI_MUTED}> ({p.role_label})</span>
              </span>
            ))}
            {extraPending > 0 ? (
              <span className={IRI_MUTED}> e mais {extraPending}</span>
            ) : null}
            {pendingPreview.length > 0 ? "." : null}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/justino360" className={IRI_LINK}>
          Abrir Justino360
        </Link>
        <Link href="/rh-ideia/equipe" className={IRI_LINK}>
          Ver equipe
        </Link>
      </div>
    </section>
  );
}
