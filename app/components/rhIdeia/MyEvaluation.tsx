"use client";

import { useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriPlaybookStatus } from "../../lib/rhIdeia/types";
import { IRI_CARD, IRI_MUTED } from "./ui";

type EvaluationRow = {
  id: number;
  subject_user_id: number;
  strengths?: string | null;
  improve?: string | null;
  created_at?: string;
};

export function MyEvaluation() {
  const [row, setRow] = useState<EvaluationRow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      iriFetch<IriPlaybookStatus>("/playbook/status"),
      iriFetch<EvaluationRow[]>("/playbook/evaluations"),
    ]).then(([statusRes, evalRes]) => {
      const userId = statusRes.data?.profile?.user_id;
      const mine = (evalRes.data || []).filter((item) => item.subject_user_id === userId);
      setRow(mine[0] || null);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <section className={IRI_CARD}>
      <h2 className="text-lg font-semibold text-slate-900">Minha avaliação</h2>
      {row ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {row.strengths && <p>Pontos fortes: {row.strengths}</p>}
          {row.improve && <p>A melhorar: {row.improve}</p>}
        </div>
      ) : (
        <p className={`mt-2 text-sm ${IRI_MUTED}`}>
          Quando o seu líder ou o RH registrar a avaliação trimestral, ela aparece aqui. Você não avalia a si mesmo.
        </p>
      )}
    </section>
  );
}
