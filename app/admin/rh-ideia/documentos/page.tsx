"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { DocumentCard } from "../../../components/justino360/DocumentCard";
import { DocumentForm, DocumentPayload } from "../../../components/justino360/DocumentForm";
import { J360Sector } from "../../../components/justino360/documentMeta";
import {
  IRI_DOCUMENT_CATEGORIES,
  IRI_DOCUMENT_ROLES,
  iriCategoryLabel,
  iriRoleLabel,
} from "../../../components/rhIdeia/documentMeta";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_GHOST,
  IRI_CARD,
  IRI_MUTED,
  IRI_OK,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { formatDateTime } from "../../../lib/justino360/labels";
import { iriFetch, iriUpload } from "../../../lib/rhIdeia/api";
import type { IriDocument } from "../../../lib/rhIdeia/types";

type Scope = "current" | "archived" | "all";

export default function RhIdeiaAdminDocumentosPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriDocument[]>([]);
  const [sectors, setSectors] = useState<J360Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [scope, setScope] = useState<Scope>("current");

  const [replaceTarget, setReplaceTarget] = useState<IriDocument | null>(null);
  const [history, setHistory] = useState<{ doc: IriDocument; items: IriDocument[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (category) params.set("category", category);
    if (roleKey) params.set("role_key", roleKey);
    if (search.trim()) params.set("q", search.trim());
    iriFetch<IriDocument[]>(`/documents?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setFeedback({ tone: "error", text: res.message || "Falha ao carregar documentos." });
      })
      .finally(() => setLoading(false));
  }, [category, roleKey, scope, search]);

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [allowed, load, search]);

  useEffect(() => {
    if (!allowed) return;
    iriFetch<J360Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  async function handleSubmit(payload: DocumentPayload) {
    const res = await iriFetch<IriDocument>("/documents", {
      method: "POST",
      body: JSON.stringify({ ...payload, scope: "organization" }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao salvar documento." });
      return false;
    }
    setFeedback({
      tone: "ok",
      text: payload.replaces_id ? "Nova versão publicada." : "Documento cadastrado.",
    });
    setReplaceTarget(null);
    load();
    return true;
  }

  async function toggleArchive(doc: IriDocument) {
    const res = await iriFetch<IriDocument>(`/documents/${doc.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_current: !doc.is_current }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao atualizar documento." });
      return;
    }
    setFeedback({ tone: "ok", text: doc.is_current ? "Documento arquivado." : "Documento reativado." });
    load();
  }

  async function openHistory(doc: IriDocument) {
    const res = await iriFetch<IriDocument[]>(`/documents/${doc.id}/versions`);
    if (!res.success || !res.data) {
      setFeedback({ tone: "error", text: res.message || "Falha ao carregar histórico." });
      return;
    }
    setHistory({ doc, items: res.data });
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaShell mode="admin" title="Políticas e documentos">
        {feedback && (
          <p role="status" className={`mb-4 ${feedback.tone === "ok" ? IRI_OK : IRI_ALERT}`}>
            {feedback.text}
          </p>
        )}

        <DocumentForm
          sectors={sectors}
          replaceTarget={replaceTarget}
          onCancelReplace={() => setReplaceTarget(null)}
          onSubmit={handleSubmit}
          categories={IRI_DOCUMENT_CATEGORIES}
          roles={IRI_DOCUMENT_ROLES}
          defaultCategory="regulamento"
          uploadFn={iriUpload}
          tone="light"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className={`${IRI_FIELD} min-w-[200px] flex-1`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição"
            aria-label="Buscar documentos"
          />
          <select
            className={IRI_FIELD}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {IRI_DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className={IRI_FIELD}
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            aria-label="Filtrar por função"
          >
            <option value="">Todas as funções</option>
            {IRI_DOCUMENT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            className={IRI_FIELD}
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            aria-label="Filtrar por situação"
          >
            <option value="current">Vigentes</option>
            <option value="archived">Arquivados</option>
            <option value="all">Todos</option>
          </select>
        </div>

        {history && (
          <div className={`mb-6 ${IRI_CARD}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Histórico de “{history.doc.title}”</h3>
              <button
                type="button"
                onClick={() => setHistory(null)}
                className={`text-xs ${IRI_MUTED} underline hover:text-slate-800`}
              >
                Fechar
              </button>
            </div>
            <ol className="space-y-2">
              {history.items.map((version) => (
                <li key={version.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-slate-700">v{version.version}</span>
                  <span className="text-slate-800">{version.title}</span>
                  <span className={`text-xs ${IRI_MUTED}`}>
                    {iriCategoryLabel(version.category)}
                    {version.created_at ? ` · ${formatDateTime(version.created_at)}` : ""}
                    {version.uploaded_by_name ? ` · ${version.uploaded_by_name}` : ""}
                  </span>
                  {version.is_current && (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      vigente
                    </span>
                  )}
                  {version.file_url && (
                    <a
                      href={version.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-700 hover:underline"
                    >
                      abrir
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        <ul className="space-y-3">
          {items.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              tone="light"
              categoryLabelFn={iriCategoryLabel}
              roleLabelFn={(v) => iriRoleLabel(v)}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceTarget(doc);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={IRI_BTN_GHOST}
                  >
                    Nova versão
                  </button>
                  <button
                    type="button"
                    onClick={() => openHistory(doc)}
                    className={IRI_BTN_GHOST}
                  >
                    Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(doc)}
                    className={IRI_BTN_GHOST}
                  >
                    {doc.is_current ? "Arquivar" : "Reativar"}
                  </button>
                </div>
              }
            />
          ))}
        </ul>
        {!loading && items.length === 0 && (
          <p className={`text-sm ${IRI_MUTED}`}>Nenhum documento encontrado com esses filtros.</p>
        )}
        {loading && <p className={`text-sm ${IRI_MUTED}`}>Carregando documentos…</p>}
      </RhIdeiaShell>
    </AdminSaasGuard>
  );
}
