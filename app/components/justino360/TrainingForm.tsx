"use client";

import { FormEvent, useEffect, useState } from "react";
import { DocumentFileField } from "./DocumentFileField";
import { J360Training, TRAINING_ROLES, TrainingPayload } from "./trainingMeta";

const EMPTY = {
  title: "",
  description: "",
  roleKey: "",
  contentUrl: "",
  contentBody: "",
  validityDays: "",
  mandatory: true,
};

/**
 * Formulário de curso. Com `editing` preenchido, o mesmo form serve para
 * edição — o material sobe via j360Upload (Firebase) ou entra como link.
 */
export function TrainingForm({
  editing,
  onCancelEdit,
  onSubmit,
  uploadFn,
  trainingRoles = TRAINING_ROLES,
  tone = "dark",
}: {
  editing: J360Training | null;
  onCancelEdit: () => void;
  onSubmit: (payload: TrainingPayload, id: number | null) => Promise<boolean>;
  uploadFn?: Parameters<typeof DocumentFileField>[0]["uploadFn"];
  trainingRoles?: readonly { value: string; label: string }[];
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const FIELD = light
    ? "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    : "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
  const LABEL = light
    ? "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
    : "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";
  const formShell = light
    ? "mb-8 space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10";
  const cancelCls = light
    ? "text-xs text-slate-500 underline hover:text-slate-800"
    : "text-xs text-gray-400 underline hover:text-gray-200";
  const checkLabel = light
    ? "flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-700"
    : "flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-300";
  const checkInput = light
    ? "h-4 w-4 rounded border-stone-300 accent-teal-600"
    : "h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500";
  const hintCls = light ? "mt-1 text-xs text-slate-500" : "mt-1 text-xs text-gray-500";
  const submitCls = light
    ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-60"
    : "rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60";
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setForm(EMPTY);
      return;
    }
    setForm({
      title: editing.title,
      description: editing.description || "",
      roleKey: editing.role_key || "",
      contentUrl: editing.content_url || "",
      contentBody: editing.content_body || "",
      validityDays: editing.validity_days ? String(editing.validity_days) : "",
      mandatory: editing.is_mandatory,
    });
  }, [editing]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await onSubmit(
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        role_key: form.roleKey || null,
        content_url: form.contentUrl.trim() || null,
        content_body: form.contentBody.trim() || null,
        validity_days: form.validityDays ? Number(form.validityDays) : null,
        is_mandatory: form.mandatory,
      },
      editing?.id ?? null,
    );
    setSaving(false);
    if (ok && !editing) setForm(EMPTY);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={formShell}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={`font-medium ${light ? "text-slate-900" : ""}`}>
          {editing ? `Editar “${editing.title}”` : "Novo treinamento"}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className={cancelCls}
          >
            Cancelar edição
          </button>
        )}
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-training-title">
          Título
        </label>
        <input
          id="j360-training-title"
          className={FIELD}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex.: Integração do Garçom — Seu Justino"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="j360-training-role">
            Função
          </label>
          <select
            id="j360-training-role"
            className={FIELD}
            value={form.roleKey}
            onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
          >
            <option value="">Todas as funções</option>
            {trainingRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-training-validity">
            Validade (dias)
          </label>
          <input
            id="j360-training-validity"
            className={FIELD}
            type="number"
            min={1}
            max={3650}
            value={form.validityDays}
            onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
            placeholder="Sem reciclagem"
          />
        </div>
        <div className="flex items-end">
          <label className={checkLabel}>
            <input
              type="checkbox"
              checked={form.mandatory}
              onChange={(e) => setForm({ ...form, mandatory: e.target.checked })}
              className={checkInput}
            />
            Obrigatório
          </label>
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-training-description">
          Descrição
        </label>
        <textarea
          id="j360-training-description"
          className={FIELD}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Para quem é, o que a pessoa aprende e quando reciclar."
        />
      </div>

      <div>
        <p className={LABEL}>Material do treinamento</p>
        <DocumentFileField
          value={form.contentUrl}
          onChange={(url) => setForm({ ...form, contentUrl: url })}
          disabled={saving}
          uploadFn={uploadFn}
          tone={tone}
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-training-body">
          Conteúdo em texto (opcional)
        </label>
        <textarea
          id="j360-training-body"
          className={FIELD}
          value={form.contentBody}
          onChange={(e) => setForm({ ...form, contentBody: e.target.value })}
          rows={5}
          placeholder="Roteiro do treinamento para quem vai ler direto na tela."
        />
        <p className={hintCls}>
          Use o material anexado, o texto, ou os dois. Curso presencial pode ficar sem
          conteúdo — a gestão registra a conclusão pela lista de atribuídos.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={submitCls}
      >
        {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar treinamento"}
      </button>
    </form>
  );
}
