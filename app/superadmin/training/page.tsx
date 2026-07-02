"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBrlFromCents, superadminFetch } from "@/app/utils/superadminApi";

type TrainingMaterial = {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  url: string | null;
  module_key: string | null;
  plan_key: string | null;
  organization_id: number | null;
  organization_name?: string | null;
  is_published: boolean;
  sort_order: number;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  contentType: "link",
  url: "",
  moduleKey: "",
  planKey: "",
  isPublished: true,
  sortOrder: "0",
};

export default function SuperadminTrainingPage() {
  const [items, setItems] = useState<TrainingMaterial[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    superadminFetch<TrainingMaterial[]>("/training-materials")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: form.title.trim(),
      description: form.description || null,
      contentType: form.contentType,
      url: form.url || null,
      moduleKey: form.moduleKey || null,
      planKey: form.planKey || null,
      isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        await superadminFetch(`/training-materials/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await superadminFetch("/training-materials", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: TrainingMaterial) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      contentType: item.content_type,
      url: item.url || "",
      moduleKey: item.module_key || "",
      planKey: item.plan_key || "",
      isPublished: item.is_published,
      sortOrder: String(item.sort_order),
    });
  };

  const remove = async (id: number) => {
    if (!confirm("Remover este material?")) return;
    await superadminFetch(`/training-materials/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Treinamentos e materiais</h2>
        <p className="text-slate-400">
          Links, vídeos e documentação para onboarding dos clientes. Materiais globais aparecem
          para todos; use módulo/plano para segmentar.
        </p>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-4 font-semibold">
          {editingId ? `Editar material #${editingId}` : "Novo material"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Título *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2"
          />
          <textarea
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2"
            rows={2}
          />
          <select
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="link">Link</option>
            <option value="video">Vídeo</option>
            <option value="doc">Documento</option>
          </select>
          <input
            placeholder="URL"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <input
            placeholder="Módulo (opcional, ex: reservas)"
            value={form.moduleKey}
            onChange={(e) => setForm({ ...form, moduleKey: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <input
            placeholder="Plano (opcional)"
            value={form.planKey}
            onChange={(e) => setForm({ ...form, planKey: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Publicado
          </label>
          <input
            type="number"
            placeholder="Ordem"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded bg-amber-600 px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Salvando…" : editingId ? "Atualizar" : "Criar"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-slate-600 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Materiais cadastrados ({items.length})</h3>
        {items.length === 0 && (
          <p className="text-slate-500 text-sm">
            Nenhum material ainda. Se a API retornar erro, aplique a migration 010 no banco.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800 p-4"
          >
            <div>
              <p className="font-medium">
                {item.title}
                {!item.is_published && (
                  <span className="ml-2 text-xs text-slate-500">(rascunho)</span>
                )}
              </p>
              {item.description && (
                <p className="text-sm text-slate-400">{item.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {item.content_type}
                {item.module_key && ` · módulo ${item.module_key}`}
                {item.plan_key && ` · plano ${item.plan_key}`}
                {item.url && (
                  <>
                    {" · "}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      abrir
                    </a>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="text-amber-400 hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-red-400 hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
