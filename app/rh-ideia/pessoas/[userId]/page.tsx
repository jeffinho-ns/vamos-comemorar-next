"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { IRI_CARD, IRI_LINK, IRI_MUTED, IRI_SOFT } from "../../../components/rhIdeia/ui";
import { iriFetch } from "../../../lib/rhIdeia/api";

type PointRow = {
  year_month: string;
  source_label: string;
  points: number;
  times: number;
};

type Trajectory = {
  name: string;
  role_label: string;
  establishment_name: string;
  sector_name: string | null;
  chapters_read: number;
  chapters_required: number;
  term_accepted: boolean;
  quiz_score: number | null;
  quiz_passed: boolean;
  points: PointRow[];
  marks: { date: string; label: string }[];
};

export default function PersonTrajectoryPage() {
  const params = useParams<{ userId: string }>();
  const [data, setData] = useState<Trajectory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = Number(params.userId);
    if (!Number.isFinite(userId)) return;
    iriFetch<Trajectory>(`/playbook/trajectory/${userId}`).then((res) => {
      if (!res.success || !res.data) setError(res.message || "Não foi possível abrir a trajetória.");
      else setData(res.data);
    });
  }, [params.userId]);

  const months = data
    ? [...new Set(data.points.map((row) => row.year_month))]
    : [];

  return (
    <RhIdeiaShell mode="staff" title={data?.name || "Trajetória"}>
      <Link href="/admin" className={`mb-4 inline-block text-sm ${IRI_LINK}`}>
        Voltar ao painel
      </Link>
      {error && <p className={`mb-4 text-sm ${IRI_SOFT}`}>{error}</p>}
      {data && (
        <div className="space-y-6">
          <section className={IRI_CARD}>
            <p className={`text-sm ${IRI_MUTED}`}>
              {data.role_label} · {data.establishment_name}
              {data.sector_name ? ` · ${data.sector_name}` : ""}
            </p>
            <p className="mt-3 text-sm text-slate-800">
              Manual: {data.chapters_read} de {data.chapters_required} capítulos.
              {" "}
              {data.term_accepted ? "Termo aceito." : "Termo ainda não aceito."}
              {" "}
              {data.quiz_score == null
                ? "Prova ainda não feita."
                : `Prova ${data.quiz_score} de 20${data.quiz_passed ? ", aprovada." : "."}`}
            </p>
          </section>

          <section className={IRI_CARD}>
            <h2 className="text-lg font-semibold text-slate-900">Pontos por mês</h2>
            {months.length === 0 ? (
              <p className={`mt-2 text-sm ${IRI_MUTED}`}>Nenhum ponto lançado ainda.</p>
            ) : (
              months.map((month) => (
                <div key={month} className="mt-3">
                  <p className="text-sm font-medium text-slate-900">{month}</p>
                  <ul className={`mt-1 text-sm ${IRI_SOFT}`}>
                    {data.points
                      .filter((row) => row.year_month === month)
                      .map((row) => (
                        <li key={`${month}-${row.source_label}`}>
                          {row.source_label}: {row.points} pts ({row.times})
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className={IRI_CARD}>
            <h2 className="text-lg font-semibold text-slate-900">Aberturas e fechamentos</h2>
            <p className={`mt-1 text-sm ${IRI_MUTED}`}>Últimos 120 dias no Justino360.</p>
            {data.marks.length === 0 ? (
              <p className={`mt-2 text-sm ${IRI_MUTED}`}>Nenhum checklist concluído nesse período.</p>
            ) : (
              <ul className={`mt-3 space-y-1 text-sm ${IRI_SOFT}`}>
                {data.marks.map((mark) => (
                  <li key={`${mark.date}-${mark.label}`}>
                    {mark.date.split("-").reverse().join("/")} · {mark.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </RhIdeiaShell>
  );
}
