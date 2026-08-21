"use client";

import { FormEvent, useEffect, useState } from "react";
import { DOCUMENT_ROLES, roleLabel } from "../documentMeta";
import { IaBadge, IaPanel, IaPreview } from "./IaPanel";
import {
  IA_FIELD,
  IA_PRIMARY_BUTTON,
  IA_SECONDARY_BUTTON,
  type IaPop,
} from "./iaMeta";
import { iaFetch, useIaAction } from "./useIaAction";

/** Categorias de documento que fazem sentido para um POP gerado. */
const POP_CATEGORIES = [
  { value: "pop", label: "POP" },
  { value: "procedimento", label: "Procedimento" },
] as const;

/**
 * Aba 2 — rascunho de POP e gravação como documento versionado.
 * O corpo fica editável antes de salvar: texto de IA quase sempre precisa de
 * um ajuste de tom ou de um detalhe da casa.
 */
export function PopIaPanel({
  aiEnabled,
  canManage,
}: {
  aiEnabled: boolean;
  canManage: boolean;
}) {
  const [instruction, setInstruction] = useState("");
  const [roleHint, setRoleHint] = useState("");
  const [category, setCategory] = useState<string>("pop");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data, meta, error, loading, run, reset } = useIaAction<IaPop>();

  useEffect(() => {
    if (!data) return;
    setDraftTitle(data.title);
    setDraftBody(data.body);
    setDraftRole(data.role_key || "");
  }, [data]);

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    await run("/ai/generate-pop", {
      method: "POST",
      body: JSON.stringify({ instruction, role_key: roleHint }),
    });
  }

  async function saveAsDocument() {
    if (!draftTitle.trim() || !draftBody.trim()) {
      setFeedback({ tone: "error", text: "Título e corpo do POP são obrigatórios." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const res = await iaFetch<{ id: number }>("/documents", {
      method: "POST",
      body: JSON.stringify({
        title: draftTitle.trim(),
        category,
        role_key: draftRole || undefined,
        description: draftBody.trim(),
      }),
    });
    setSaving(false);
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao salvar o documento." });
      return;
    }
    setFeedback({
      tone: "ok",
      text: `“${draftTitle.trim()}” salvo em Documentos como ${
        category === "pop" ? "POP" : "Procedimento"
      }.`,
    });
    reset();
    setDraftTitle("");
    setDraftBody("");
    setDraftRole("");
  }

  return (
    <IaPanel
      title="Gerar POP"
      hint="A IA escreve o procedimento; você revisa o texto e publica como documento versionado."
      loading={loading}
      error={error}
      feedback={feedback}
      meta={meta}
      disabledNotice={
        aiEnabled
          ? null
          : "A geração por IA está desligada neste servidor (OPENAI_API_KEY não configurada). Os POPs podem ser cadastrados à mão na aba Documentos."
      }
      form={
        <form onSubmit={handleGenerate} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">Função alvo</span>
            <select
              className={IA_FIELD}
              value={roleHint}
              onChange={(event) => setRoleHint(event.target.value)}
            >
              <option value="">Equipe em geral</option>
              {DOCUMENT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">Procedimento a documentar</span>
            <textarea
              className={IA_FIELD}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="ex: como fechar o caixa no fim do turno, incluindo sangria, conferência e envio do relatório"
              rows={3}
              minLength={8}
              required
            />
          </label>
          <button type="submit" disabled={loading || !aiEnabled} className={IA_PRIMARY_BUTTON}>
            {loading ? "Escrevendo…" : "Gerar rascunho"}
          </button>
        </form>
      }
    >
      {data && (
        <IaPreview
          heading="Rascunho do POP"
          badges={<IaBadge>{roleLabel(draftRole || null)}</IaBadge>}
          actions={
            canManage ? (
              <>
                <label className="text-xs text-gray-400">
                  <span className="sr-only">Categoria do documento</span>
                  <select
                    className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-white ring-1 ring-white/10"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {POP_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={saveAsDocument}
                  disabled={saving}
                  className={IA_SECONDARY_BUTTON}
                >
                  {saving ? "Salvando…" : "Salvar como documento"}
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500">Somente a gestão publica documentos.</span>
            )
          }
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-400">Título</span>
                <input
                  className={IA_FIELD}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-400">Função</span>
                <select
                  className={IA_FIELD}
                  value={draftRole}
                  onChange={(event) => setDraftRole(event.target.value)}
                >
                  <option value="">Todas as funções</option>
                  {DOCUMENT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-400">Corpo do procedimento (editável)</span>
              <textarea
                className={`${IA_FIELD} font-mono text-xs leading-relaxed`}
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                rows={14}
              />
            </label>
          </div>
        </IaPreview>
      )}
    </IaPanel>
  );
}
