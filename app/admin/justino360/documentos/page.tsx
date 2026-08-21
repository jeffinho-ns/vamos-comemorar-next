"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { DocumentCard } from "../../../components/justino360/DocumentCard";
import { DocumentForm, DocumentPayload } from "../../../components/justino360/DocumentForm";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ROLES,
  J360Document,
  J360Sector,
  categoryLabel,
} from "../../../components/justino360/documentMeta";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import { formatDateTime } from "../../../lib/justino360/labels";

type Scope = "current" | "archived" | "all";

const FIELD =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";

export default function AdminDocumentosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Document[]>([]);
  const [sectors, setSectors] = useState<J360Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [scope, setScope] = useState<Scope>("current");

  const [replaceTarget, setReplaceTarget] = useState<J360Document | null>(null);
  const [history, setHistory] = useState<{ doc: J360Document; items: J360Document[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ scope });
    if (category) params.set("category", category);
    if (roleKey) params.set("role_key", roleKey);
    if (search.trim()) params.set("q", search.trim());
    j360Fetch<J360Document[]>(`/documents?${params.toString()}`)
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
    j360Fetch<J360Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  async function handleSubmit(payload: DocumentPayload) {
    const res = await j360Fetch<J360Document>("/documents", {
      method: "POST",
      body: JSON.stringify(payload),
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

  async function toggleArchive(doc: J360Document) {
    const res = await j360Fetch<J360Document>(`/documents/${doc.id}`, {
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

  async function openHistory(doc: J360Document) {
    const res = await j360Fetch<J360Document[]>(`/documents/${doc.id}/versions`);
    if (!res.success || !res.data) {
      setFeedback({ tone: "error", text: res.message || "Falha ao carregar histórico." });
      return;
    }
    setHistory({ doc, items: res.data });
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Documentos e POPs">
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
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className={`${FIELD} min-w-[200px] flex-1`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição"
            aria-label="Buscar documentos"
          />
          <select
            className={FIELD}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className={FIELD}
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            aria-label="Filtrar por função"
          >
            <option value="">Todas as funções</option>
            {DOCUMENT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            className={FIELD}
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
                className="text-xs text-gray-400 underline hover:text-gray-200"
              >
                Fechar
              </button>
            </div>
            <ol className="space-y-2">
              {history.items.map((version) => (
                <li key={version.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">v{version.version}</span>
                  <span className="text-gray-300">{version.title}</span>
                  <span className="text-xs text-gray-500">
                    {categoryLabel(version.category)}
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
                      className="text-xs text-amber-400 hover:underline"
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
          <p className="text-sm text-gray-400">Nenhum documento encontrado com esses filtros.</p>
        )}
        {loading && <p className="text-sm text-gray-400">Carregando documentos…</p>}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
