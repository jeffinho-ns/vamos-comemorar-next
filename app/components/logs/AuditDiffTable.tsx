"use client";

import React, { useMemo } from "react";

const FIELD_LABELS: Record<string, string> = {
  client_name: "Cliente",
  client_phone: "Telefone",
  client_email: "E-mail",
  reservation_date: "Data",
  reservation_time: "Hora",
  number_of_people: "Pessoas",
  area_id: "ID da área",
  area_name: "Área",
  table_number: "Mesa",
  status: "Estado",
  notes: "Notas",
  establishment_id: "ID estabelecimento",
  establishment_name: "Estabelecimento",
  origin: "Origem",
  check_in_time: "Check-in",
  check_out_time: "Check-out",
  name: "Nome",
  description: "Descrição",
  price: "Preço",
  categoryId: "Categoria (ID)",
  barId: "Bar / estabelecimento (ID)",
  subCategory: "Subcategoria",
  order: "Ordem",
  visible: "Visível",
};

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function labelForKey(key: string): string {
  return FIELD_LABELS[key] || key.replace(/_/g, " ");
}

type Props = {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export default function AuditDiffTable({ before, after }: Props) {
  const rows = useMemo(() => {
    const keys = new Set<string>();
    if (before && typeof before === "object") {
      Object.keys(before).forEach((k) => keys.add(k));
    }
    if (after && typeof after === "object") {
      Object.keys(after).forEach((k) => keys.add(k));
    }
    return Array.from(keys)
      .sort()
      .map((key) => {
        const bv = before && typeof before === "object" ? before[key] : undefined;
        const av = after && typeof after === "object" ? after[key] : undefined;
        const same =
          JSON.stringify(bv) === JSON.stringify(av) ||
          (bv === undefined && av === undefined);
        return {
          key,
          label: labelForKey(key),
          before: formatCell(bv),
          after: formatCell(av),
          changed: !same,
        };
      });
  }, [before, after]);

  if (!rows.length) {
    return (
      <p className="text-gray-500 text-sm">Sem dados de auditoria para comparar.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-600/80">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-gray-900/90 border-b border-gray-600">
            <th className="px-3 py-2 text-gray-400 font-semibold">Campo</th>
            <th className="px-3 py-2 text-amber-400/90 font-semibold">Valor anterior</th>
            <th className="px-3 py-2 text-emerald-400/90 font-semibold">Valor novo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={
                r.changed
                  ? "bg-amber-950/25 border-b border-gray-700/80"
                  : "border-b border-gray-800/80"
              }
            >
              <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{r.label}</td>
              <td className="px-3 py-2 text-gray-200 break-words max-w-[200px] md:max-w-xs">
                {r.before}
              </td>
              <td className="px-3 py-2 text-gray-100 break-words max-w-[200px] md:max-w-xs">
                {r.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
