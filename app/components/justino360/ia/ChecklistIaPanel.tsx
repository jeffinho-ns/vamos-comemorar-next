"use client";

import { FormEvent, useState } from "react";
import type { J360Sector } from "../../../lib/justino360/types";
import { IaBadge, IaPanel, IaPreview } from "./IaPanel";
import {
  IA_FIELD,
  IA_PRIMARY_BUTTON,
  IA_SECONDARY_BUTTON,
  SHIFT_TYPES,
  shiftLabel,
  type IaChecklist,
} from "./iaMeta";
import { iaFetch, useIaAction } from "./useIaAction";

/**
 * Aba 1 — rascunho de checklist e aplicação como template.
 * O "Aplicar como template" só aparece para quem tem gestão; a API confirma a
 * permissão de novo no POST /checklist-templates.
 */
export function ChecklistIaPanel({
  aiEnabled,
  canManage,
  sectors,
}: {
  aiEnabled: boolean;
  canManage: boolean;
  sectors: J360Sector[];
}) {
  const [instruction, setInstruction] = useState("");
  const [sector, setSector] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [shiftOverride, setShiftOverride] = useState("");
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data, meta, error, loading, run, reset } = useIaAction<IaChecklist>();

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setShiftOverride("");
    const selected = sectors.find((s) => String(s.id) === sectorId);
    await run("/ai/generate-checklist", {
      method: "POST",
      body: JSON.stringify({
        instruction,
        sector: selected?.name || sector || "operação",
      }),
    });
  }

  async function applyAsTemplate() {
    if (!data) return;
    setApplying(true);
    setFeedback(null);
    const res = await iaFetch<{ id: number }>("/checklist-templates", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        shift_type: shiftOverride || data.shift_type,
        sector_id: sectorId ? Number(sectorId) : undefined,
        description: `Rascunho gerado por IA (${meta?.model || "IA"}) e revisado pela gestão.`,
        items: data.items.map((item) => ({
          title: item.title,
          description: item.description,
          requires_photo: item.requires_photo,
        })),
      }),
    });
    setApplying(false);
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao criar o template." });
      return;
    }
    setFeedback({
      tone: "ok",
      text: `Template “${data.name}” criado com ${data.items.length} itens. Confira em Checklists.`,
    });
    reset();
  }

  const selectedSectorName = sectors.find((s) => String(s.id) === sectorId)?.name;

  return (
    <IaPanel
      title="Gerar checklist"
      hint="Descreva a rotina e a IA monta o rascunho. Nada entra em produção sem você aplicar."
      loading={loading}
      error={error}
      feedback={feedback}
      meta={meta}
      disabledNotice={
        aiEnabled
          ? null
          : "A geração por IA está desligada neste servidor (OPENAI_API_KEY não configurada). Você ainda pode criar checklists manualmente na aba Checklists."
      }
      form={
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-300">Setor</span>
              <select
                className={IA_FIELD}
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
              >
                <option value="">Definir por texto</option>
                {sectors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {!sectorId && (
              <label className="block text-sm">
                <span className="mb-1 block text-gray-300">Setor (texto livre)</span>
                <input
                  className={IA_FIELD}
                  value={sector}
                  onChange={(event) => setSector(event.target.value)}
                  placeholder="ex: bar, salão, cozinha"
                />
              </label>
            )}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">O que a IA deve montar</span>
            <textarea
              className={IA_FIELD}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="ex: checklist de abertura do bar, cobrindo gelo, chopeira, garrafas e limpeza do balcão"
              rows={3}
              minLength={8}
              required
            />
          </label>
          <button type="submit" disabled={loading || !aiEnabled} className={IA_PRIMARY_BUTTON}>
            {loading ? "Gerando…" : "Gerar rascunho"}
          </button>
        </form>
      }
    >
      {data && (
        <IaPreview
          heading={data.name}
          badges={
            <>
              <IaBadge>{shiftLabel(shiftOverride || data.shift_type)}</IaBadge>
              <IaBadge>{data.items.length} itens</IaBadge>
              {selectedSectorName && <IaBadge>{selectedSectorName}</IaBadge>}
            </>
          }
          actions={
            canManage ? (
              <>
                <label className="text-xs text-gray-400">
                  <span className="sr-only">Turno do template</span>
                  <select
                    className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-white ring-1 ring-white/10"
                    value={shiftOverride || data.shift_type}
                    onChange={(event) => setShiftOverride(event.target.value)}
                  >
                    {SHIFT_TYPES.map((shift) => (
                      <option key={shift.value} value={shift.value}>
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={applyAsTemplate}
                  disabled={applying}
                  className={IA_SECONDARY_BUTTON}
                >
                  {applying ? "Aplicando…" : "Aplicar como template"}
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500">Somente a gestão aplica templates.</span>
            )
          }
        >
          <ol className="space-y-2">
            {data.items.map((item, index) => (
              <li key={`${item.title}-${index}`} className="flex gap-3 text-sm">
                <span className="w-6 shrink-0 text-right text-gray-500">{index + 1}.</span>
                <span>
                  <span className="text-gray-100">{item.title}</span>
                  {item.requires_photo && (
                    <span className="ml-2 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                      exige foto
                    </span>
                  )}
                  {item.description && (
                    <span className="mt-0.5 block text-xs text-gray-400">{item.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </IaPreview>
      )}
    </IaPanel>
  );
}
