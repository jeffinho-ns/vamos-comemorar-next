"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { OpsWeekBoard } from "../../../components/rhIdeia/OpsWeekBoard";
import { roleLabel } from "../../../components/rhIdeia/PlaybookTeamTable";
import {
  IRI_BTN_PRIMARY,
  IRI_BTN_SECONDARY,
  IRI_CARD,
  IRI_CARD_COMPACT,
  IRI_MUTED,
  IRI_SOFT,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriEstablishment, IriPointRow } from "../../../lib/rhIdeia/types";

type RankRow = { user_id?: number; user_name?: string; role_key: string; points: number };
type GrantRow = { user_id: number; user_name?: string; status: "concedido" | "nao_desta_vez" };
type CloseSnapshot =
  | RankRow[]
  | { ranking?: RankRow[]; operacao?: { aberturas: number; fechamentos: number; pontos_novos: number } };

type CloseRow = {
  id: number;
  establishment_id: number;
  year_month: string;
  note?: string | null;
  snapshot?: CloseSnapshot;
  grants?: GrantRow[];
};

function rankingOf(snapshot: CloseSnapshot | undefined): RankRow[] {
  if (!snapshot) return [];
  if (Array.isArray(snapshot)) return snapshot;
  return snapshot.ranking || [];
}

function opsOf(snapshot: CloseSnapshot | undefined) {
  if (!snapshot || Array.isArray(snapshot)) return null;
  return snapshot.operacao || null;
}

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

  async function grant(close: CloseRow, userId: number, status: GrantRow["status"]) {
    const res = await iriFetch("/playbook/rewards/grant", {
      method: "POST",
      body: JSON.stringify({
        establishment_id: close.establishment_id,
        year_month: String(close.year_month).trim(),
        user_id: userId,
        status,
      }),
    });
    setMessage(res.success ? "Bonificação registrada." : res.message || "Não foi possível registrar.");
    if (res.success) load();
  }

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
        Prova, checklist, avaliação, padrinho, treino, ronda e o que a casa abriu e fechou no Justino360. Cada abertura ou fechamento concluído vale 2 pontos para quem fez. O ranking do fechamento continua sendo dos líderes.
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
      {establishmentId ? (
        <div className="mb-6">
          <OpsWeekBoard establishmentId={Number(establishmentId)} />
        </div>
      ) : null}
      <ul className="mb-6 space-y-2 text-sm">
        {closes.map((item) => {
          const ranking = rankingOf(item.snapshot);
          const ops = opsOf(item.snapshot);
          return (
            <li key={item.id} className={IRI_CARD_COMPACT}>
              <span className="font-medium text-slate-900">{item.year_month}</span>
              {item.note ? ` · ${item.note}` : ""}
              {ops ? (
                <span className={`mt-1 block ${IRI_MUTED}`}>
                  {ops.aberturas} abertura(s) · {ops.fechamentos} fechamento(s)
                  {ops.pontos_novos > 0 ? ` · ${ops.pontos_novos} pts novos` : ""}
                </span>
              ) : null}
              <ul className="mt-3 space-y-2">
                {ranking.length === 0 && (
                  <li className={IRI_MUTED}>Sem pontos de líder nesse mês.</li>
                )}
                {ranking.map((row) => {
                  const decision = item.grants?.find((grant) => grant.user_id === row.user_id);
                  return (
                    <li key={row.user_id || row.user_name} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {row.user_name || "Líder"} ({roleLabel(row.role_key)}): {row.points} pts
                        {decision?.status === "concedido" ? " · bonificado" : ""}
                        {decision?.status === "nao_desta_vez" ? " · não desta vez" : ""}
                      </span>
                      {row.user_id ? (
                        <span className="flex gap-2">
                          <button type="button" className={IRI_BTN_PRIMARY} onClick={() => grant(item, row.user_id!, "concedido")}>
                            Conceder
                          </button>
                          <button type="button" className={IRI_BTN_SECONDARY} onClick={() => grant(item, row.user_id!, "nao_desta_vez")}>
                            Não desta vez
                          </button>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
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
