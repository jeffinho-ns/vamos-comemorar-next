"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";

type DayMark = { date: string; marks: string[] };

type PersonWeek = {
  user_id: number;
  name: string;
  role_label: string;
  establishment_name: string;
  sector_name: string | null;
  done: number;
  days: DayMark[];
};

type Board = {
  sees_all: boolean;
  start: string | null;
  days: { date: string; label: string }[];
  people: PersonWeek[];
};

function shiftWeek(start: string, days: number): string {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function WeekPeopleBoard({ establishmentId }: { establishmentId?: number | null }) {
  const [start, setStart] = useState<string | undefined>(undefined);
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query: Record<string, string | number> = {};
    if (start) query.start = start;
    if (establishmentId != null && Number.isFinite(establishmentId) && establishmentId > 0) {
      query.establishment_id = establishmentId;
    }
    iriFetch<Board>("/playbook/week-people", {}, query).then((res) => {
      if (cancelled) return;
      if (!res.success || !res.data?.start) {
        setBoard(null);
        return;
      }
      setBoard(res.data);
      setStart(res.data.start);
    });
    return () => {
      cancelled = true;
    };
  }, [start, establishmentId]);

  if (!board?.start) return null;

  return (
    <section className="rounded-3xl bg-white border border-slate-100 shadow-md p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Progressão da semana</h3>
          <p className="text-sm text-slate-500 mt-1">
            {board.sees_all
              ? "Todas as pessoas do grupo. Cada marca é uma abertura ou um fechamento concluído."
              : "Quem está na sua área. Cada marca é uma abertura ou um fechamento concluído."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onClick={() => setStart(shiftWeek(board.start!, -7))}
          >
            Semana anterior
          </button>
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={() => setStart(shiftWeek(board.start!, 7))}
          >
            Próxima
          </button>
        </div>
      </div>

      {board.people.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Nenhuma ficha de função nesta visão.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-medium">Pessoa</th>
                {board.days.map((day) => (
                  <th key={day.date} className="px-2 py-2 font-medium">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.people.map((person) => (
                <tr key={person.user_id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="py-3 pr-3">
                    <Link href={`/rh-ideia/pessoas/${person.user_id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                      {person.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {person.role_label}
                      {board.sees_all ? ` · ${person.establishment_name}` : ""}
                      {person.done === 0 ? " · nada nesta semana" : ` · ${person.done} feito${person.done === 1 ? "" : "s"}`}
                    </p>
                  </td>
                  {person.days.map((day) => (
                    <td key={day.date} className="px-2 py-3 text-xs text-slate-600">
                      {day.marks.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        day.marks.map((mark, index) => (
                          <span key={`${mark}-${index}`} className="block text-slate-700">
                            {mark}
                          </span>
                        ))
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
