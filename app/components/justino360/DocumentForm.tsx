"use client";

import { FormEvent, useEffect, useState } from "react";
import { DocumentFileField } from "./DocumentFileField";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ROLES,
  EXTERNAL_REPORT_HINTS,
  J360Document,
  J360Sector,
} from "./documentMeta";

export type DocumentPayload = {
  title: string;
  category: string;
  role_key: string | null;
  sector_id: number | null;
  description: string | null;
  file_url: string | null;
  replaces_id: number | null;
};

const FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

/**
 * Formulário de documento. Quando `replaceTarget` está preenchido, o envio cria
 * uma nova versão e a anterior sai de circulação (regra aplicada na API).
 */
export function DocumentForm({
  sectors,
  replaceTarget,
  onCancelReplace,
  onSubmit,
}: {
  sectors: J360Sector[];
  replaceTarget: J360Document | null;
  onCancelReplace: () => void;
  onSubmit: (payload: DocumentPayload) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("pop");
  const [roleKey, setRoleKey] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Ao escolher "nova versão", herda os metadados da versão vigente.
  useEffect(() => {
    if (!replaceTarget) return;
    setTitle(replaceTarget.title);
    setCategory(replaceTarget.category);
    setRoleKey(replaceTarget.role_key || "");
    setSectorId(replaceTarget.sector_id ? String(replaceTarget.sector_id) : "");
    setDescription(replaceTarget.description || "");
    setFileUrl("");
  }, [replaceTarget]);

  function reset() {
    setTitle("");
    setCategory("pop");
    setRoleKey("");
    setSectorId("");
    setDescription("");
    setFileUrl("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      category,
      role_key: roleKey || null,
      sector_id: sectorId ? Number(sectorId) : null,
      description: description.trim() || null,
      file_url: fileUrl.trim() || null,
      replaces_id: replaceTarget?.id ?? null,
    });
    setSaving(false);
    if (ok) reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">
          {replaceTarget ? `Nova versão de "${replaceTarget.title}"` : "Novo documento"}
        </h2>
        {replaceTarget && (
          <button
            type="button"
            onClick={() => {
              onCancelReplace();
              reset();
            }}
            className="text-xs text-gray-400 underline hover:text-gray-200"
          >
            Cancelar versionamento
          </button>
        )}
      </div>

      {replaceTarget && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          A versão v{replaceTarget.version} será arquivada automaticamente ao salvar.
        </p>
      )}

      <div>
        <label className={LABEL} htmlFor="j360-doc-title">
          Título
        </label>
        <input
          id="j360-doc-title"
          className={FIELD}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: POP de higienização do bar"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="j360-doc-category">
            Categoria
          </label>
          <select
            id="j360-doc-category"
            className={FIELD}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-doc-role">
            Função
          </label>
          <select
            id="j360-doc-role"
            className={FIELD}
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
          >
            <option value="">Todas as funções</option>
            {DOCUMENT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-doc-sector">
            Setor
          </label>
          <select
            id="j360-doc-sector"
            className={FIELD}
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
          >
            <option value="">Sem setor</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {category === "laudo" && (
        <p className="text-xs text-gray-400">
          Relatórios externos entram como laudo. Inclua o tipo no título — ex.:{" "}
          {EXTERNAL_REPORT_HINTS.join(", ")}.
        </p>
      )}

      <div>
        <label className={LABEL} htmlFor="j360-doc-description">
          Descrição
        </label>
        <textarea
          id="j360-doc-description"
          className={FIELD}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Resumo, responsável, validade do laudo…"
        />
      </div>

      <DocumentFileField value={fileUrl} onChange={setFileUrl} disabled={saving} />

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {saving ? "Salvando…" : replaceTarget ? "Publicar nova versão" : "Salvar documento"}
      </button>
    </form>
  );
}
