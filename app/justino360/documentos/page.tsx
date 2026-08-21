"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentCard } from "../../components/justino360/DocumentCard";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ROLES,
  J360Document,
} from "../../components/justino360/documentMeta";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

const ROLE_STORAGE_KEY = "j360:documentos:role";

const FIELD =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";

export default function StaffDocumentosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleKey, setRoleKey] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  // A função é escolhida pela pessoa e fica lembrada no aparelho.
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
    j360Fetch<J360Document[]>(`/documents?${params.toString()}`)
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Documentos">
      <p className="mb-4 text-sm text-gray-300">
        Só aparecem aqui as versões vigentes. Se um POP foi atualizado, a versão antiga sai
        automaticamente da lista.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className={FIELD}
          value={roleKey}
          onChange={(e) => changeRole(e.target.value)}
          aria-label="Minha função"
        >
          <option value="">Minha função: todas</option>
          {DOCUMENT_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
        <input
          className={`${FIELD} min-w-[180px] flex-1`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documento"
          aria-label="Buscar documento"
        />
      </div>

      {roleKey && (
        <p className="mb-4 text-xs text-gray-400">
          Mostrando documentos gerais + os específicos da função selecionada.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </ul>
      {loading && <p className="text-sm text-gray-400">Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum documento disponível para esse filtro.</p>
      )}
    </Justino360Shell>
  );
}
