"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentCard } from "../../components/justino360/DocumentCard";
import {
  IRI_DOCUMENT_CATEGORIES,
  IRI_DOCUMENT_ROLES,
  iriCategoryLabel,
  iriRoleLabel,
} from "../../components/rhIdeia/documentMeta";
import { IRI_FIELD, RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriDocument } from "../../lib/rhIdeia/types";

const ROLE_STORAGE_KEY = "iri:documentos:role";

export default function RhIdeiaStaffDocumentosPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<IriDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleKey, setRoleKey] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved) setRoleKey(saved);
  }, []);

  function changeRole(value: string) {
    setRoleKey(value);
    if (value) window.localStorage.setItem(ROLE_STORAGE_KEY, value);
    else window.localStorage.removeItem(ROLE_STORAGE_KEY);
  }

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ scope: "current" });
    if (roleKey) params.set("role_key", roleKey);
    if (category) params.set("category", category);
    if (search.trim()) params.set("q", search.trim());
    iriFetch<IriDocument[]>(`/documents?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setError(res.message || "Não foi possível carregar os documentos.");
      })
      .finally(() => setLoading(false));
  }, [category, roleKey, search]);

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [allowed, load, search]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white">
        <p className="text-slate-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <RhIdeiaShell mode="staff" title="Políticas e documentos">
      <p className="mb-4 text-sm text-slate-300">
        Só aparecem aqui as versões vigentes do Grupo Ideia — regulamento, LGPD, benefícios e demais
        políticas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className={IRI_FIELD}
          value={roleKey}
          onChange={(e) => changeRole(e.target.value)}
          aria-label="Minha função"
        >
          <option value="">Minha função: todas</option>
          {IRI_DOCUMENT_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
        <input
          className={`${IRI_FIELD} min-w-[180px] flex-1`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documento"
          aria-label="Buscar documento"
        />
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            categoryLabelFn={iriCategoryLabel}
            roleLabelFn={iriRoleLabel}
          />
        ))}
      </ul>
      {loading && <p className="text-sm text-slate-400">Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum documento disponível para esse filtro.</p>
      )}
    </RhIdeiaShell>
  );
}
