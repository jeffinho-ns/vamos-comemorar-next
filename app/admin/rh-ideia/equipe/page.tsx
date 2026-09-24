"use client";

import { useCallback, useEffect, useState } from "react";
import { RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { PlaybookTeamTable } from "../../../components/rhIdeia/PlaybookTeamTable";
import { IRI_ALERT, IRI_SOFT } from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriTeamRow } from "../../../lib/rhIdeia/types";

export default function AdminPlaybookTeamPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [rows, setRows] = useState<IriTeamRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await iriFetch<IriTeamRow[]>("/playbook/team");
    if (!res.success || !res.data) setMessage(res.message || "Não foi possível carregar a equipe.");
    else setRows(res.data);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) return null;

  return (
    <RhIdeiaShell mode="admin" title="Conclusão por pessoa">
      <p className={`mb-4 text-sm ${IRI_SOFT}`}>
        Leitura, termo, prova e pontos de cada função. O líder de área vê só o status do próprio setor.
      </p>
      {message && <p className={`mb-4 ${IRI_ALERT}`}>{message}</p>}
      <PlaybookTeamTable rows={rows} />
    </RhIdeiaShell>
  );
}
