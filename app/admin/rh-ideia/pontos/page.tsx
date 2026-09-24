"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { roleLabel } from "../../../components/rhIdeia/PlaybookTeamTable";
import {
  IRI_BTN_PRIMARY,
  IRI_CARD,
  IRI_CARD_COMPACT,
  IRI_MUTED,
  IRI_SOFT,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriEstablishment, IriPointRow } from "../../../lib/rhIdeia/types";

type CloseRow = {
  id: number;
  year_month: string;
  note?: string | null;
  snapshot?: { user_name?: string; role_key: string; points: number }[];
};

export default function AdminPlaybookPointsPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [points, setPoints] = useState<IriPointRow[]>([]);
  const [houses, setHouses] = useState<IriEstablishment[]>([]);
  const [closes, setCloses] = useState<CloseRow[]>([]);
  const [establishmentId, setEstablishmentId] = useState("");
  const [yearMonth, setYearMonth] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pointRes, houseRes, closeRes] = await Promise.all([
      iriFetch<IriPointRow[]>("/playbook/points"),
      iriFetch<IriEstablishment[]>("/establishments"),
      iriFetch<CloseRow[]>("/playbook/rewards"),
    ]);
    if (pointRes.success && pointRes.data) setPoints(pointRes.data);
    if (houseRes.success && houseRes.data) setHouses(houseRes.data);
    if (closeRes.success && closeRes.data) setCloses(closeRes.data);
    if (!pointRes.success) setMessage(pointRes.message || null);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function closeMonth(event: FormEvent) {
    event.preventDefault();
    const res = await iriFetch("/playbook/rewards/close", {
      method: "POST",
      body: JSON.stringify({
        establishment_id: Number(establishmentId),
        year_month: yearMonth,
        note,
      }),
    });
    setMessage(res.success ? "Mês fechado para premiação." : res.message || "Não foi possível fechar.");
    load();
  }

  if (!allowed) return null;

  return (
    <RhIdeiaShell mode="admin" title="Pontuação e premiação">
      <p className={`mb-4 text-sm ${IRI_SOFT}`}>
        Prova, checklist conferido, avaliação, padrinho, treino semanal e ronda do líder. O ranking do fechamento é dos líderes.
      </p>
      {message && <p className={`mb-4 text-sm ${IRI_SOFT}`}>{message}</p>}
      <form onSubmit={closeMonth} className={`mb-6 grid gap-3 ${IRI_CARD} md:grid-cols-4`}>
        <select className={IRI_FIELD} value={establishmentId} onChange={(event) => setEstablishmentId(event.target.value)} required>
          <option value="">Unidade</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
        <input className={IRI_FIELD} placeholder="2026-09" value={yearMonth} onChange={(event) => setYearMonth(event.target.value)} required />
        <input className={IRI_FIELD} placeholder="Premiação do mês" value={note} onChange={(event) => setNote(event.target.value)} />
        <button type="submit" className={IRI_BTN_PRIMARY}>
          Fechar mês
        </button>
      </form>
      <ul className="mb-6 space-y-2 text-sm">
        {closes.map((item) => (
          <li key={item.id} className={IRI_CARD_COMPACT}>
            <span className="font-medium text-slate-900">{item.year_month}</span>
            {item.note ? ` · ${item.note}` : ""}
            <span className={`mt-1 block ${IRI_MUTED}`}>
              {(item.snapshot || [])
                .map((row) => `${row.user_name || "Líder"} (${roleLabel(row.role_key)}): ${row.points}`)
                .join(" · ") || "Sem pontos de líder nesse mês."}
            </span>
          </li>
        ))}
      </ul>
      <ul className={`space-y-1 text-sm ${IRI_SOFT}`}>
        {points.map((row) => (
          <li key={row.id}>
            {row.user_name} · {row.source} · {row.points} pts
          </li>
        ))}
      </ul>
    </RhIdeiaShell>
  );
}
