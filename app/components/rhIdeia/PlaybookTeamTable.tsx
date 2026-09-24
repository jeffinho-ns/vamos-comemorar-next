"use client";

import type { IriTeamRow } from "../../lib/rhIdeia/types";
import { IRI_MUTED } from "./ui";

const ROLE_LABEL: Record<string, string> = {
  gerente: "Gerente",
  chefe_fila: "Chefe de Fila",
  chefe_cozinha: "Chefe de Cozinha",
  chefe_bar: "Chefe de Bar",
  cumim: "Cumim",
  suiteiro: "Suiteiro",
  garcom: "Garçom",
  hostess: "Hostess",
  seguranca: "Segurança",
  caixa: "Caixa",
  cozinheiro_lider: "Cozinheiro Líder",
  cozinheiro: "Cozinheiro",
  auxiliar_cozinha: "Auxiliar de Cozinha",
  subchefe_bar: "Subchefe de Bar",
  bartender: "Bartender",
  barback: "Barback",
  estoquista: "Estoquista",
  limpeza: "Limpeza",
  manutencao: "Manutenção",
  nutricionista: "Nutricionista",
};

export function roleLabel(roleKey: string): string {
  return ROLE_LABEL[roleKey] || roleKey;
}

export function PlaybookTeamTable({ rows }: { rows: IriTeamRow[] }) {
  if (rows.length === 0) {
    return <p className={`text-sm ${IRI_MUTED}`}>Nenhuma pessoa nesta visão.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-slate-500">
          <tr>
            <th className="px-3 py-2.5 font-medium">Pessoa</th>
            <th className="px-3 py-2.5 font-medium">Função</th>
            <th className="px-3 py-2.5 font-medium">Casa</th>
            <th className="px-3 py-2.5 font-medium">Leitura</th>
            <th className="px-3 py-2.5 font-medium">Termo</th>
            <th className="px-3 py-2.5 font-medium">Prova</th>
            <th className="px-3 py-2.5 font-medium">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.user_id} className="border-t border-stone-100 text-slate-700">
              <td className="px-3 py-2.5 font-medium text-slate-900">{row.user_name || row.user_id}</td>
              <td className="px-3 py-2.5">{roleLabel(row.role_key)}</td>
              <td className="px-3 py-2.5">{row.establishment_name || row.establishment_id}</td>
              <td className="px-3 py-2.5">
                {row.chapters_read}/{row.chapters_required}
              </td>
              <td className="px-3 py-2.5">{row.term_accepted ? "sim" : "não"}</td>
              <td className="px-3 py-2.5">
                {row.quiz_passed ? `${row.quiz_score}/20` : "pendente"}
              </td>
              <td className="px-3 py-2.5 tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
