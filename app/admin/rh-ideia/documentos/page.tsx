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
          <p
            role="status"
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              feedback.tone === "ok"
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-red-500/15 text-red-200"
            }`}
          >
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
          <div className="mb-6 rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">Histórico de “{history.doc.title}”</h3>
              <button
                type="button"
                onClick={() => setHistory(null)}
                className="text-xs text-slate-400 underline hover:text-slate-200"
              >
                Fechar
              </button>
            </div>
            <ol className="space-y-2">
              {history.items.map((version) => (
                <li key={version.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">v{version.version}</span>
                  <span className="text-slate-300">{version.title}</span>
                  <span className="text-xs text-slate-500">
                    {iriCategoryLabel(version.category)}
                    {version.created_at ? ` · ${formatDateTime(version.created_at)}` : ""}
                    {version.uploaded_by_name ? ` · ${version.uploaded_by_name}` : ""}
                  </span>
                  {version.is_current && (
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      vigente
                    </span>
                  )}
                  {version.file_url && (
                    <a
                      href={version.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:underline"
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
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Nova versão
                  </button>
                  <button
                    type="button"
                    onClick={() => openHistory(doc)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(doc)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    {doc.is_current ? "Arquivar" : "Reativar"}
                  </button>
                </div>
              }
            />
          ))}
        </ul>
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum documento encontrado com esses filtros.</p>
        )}
        {loading && <p className="text-sm text-slate-400">Carregando documentos…</p>}
      </RhIdeiaShell>
    </AdminSaasGuard>
  );
}
