"use client";

import Link from "next/link";
import { useState } from "react";
import { superadminFetch } from "@/app/utils/superadminApi";
import {
  MODULE_LABELS,
  type EstablishmentPermission,
  type EstablishmentRow,
  type ModuleCatalogItem,
} from "./types";

export const ESTABLISHMENT_PROFILES = [
  { value: "generic", label: "Genérico" },
  { value: "pracinha", label: "Pracinha" },
  { value: "highline", label: "HighLine" },
  { value: "rooftop", label: "Rooftop" },
  { value: "oh_fregues", label: "Oh Freguês" },
  { value: "seu_justino", label: "Seu Justino" },
  { value: "sitio_ilha", label: "Sítio Ilha" },
];

type EstablishmentModule = { key: string; name: string; is_enabled: boolean };

function slugifyEstablishmentName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Props = {
  orgId: number;
  establishments: EstablishmentRow[];
  moduleCatalog: ModuleCatalogItem[];
  permissions: EstablishmentPermission[];
  onReload: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
};

export default function EstablishmentsPanel({
  orgId,
  establishments,
  moduleCatalog,
  permissions,
  onReload,
  onError,
  onSuccess,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [estForm, setEstForm] = useState({
    name: "",
    slug: "",
    profile: "generic",
    enabledModules: [] as string[],
  });

  const [expandedEstId, setExpandedEstId] = useState<number | null>(null);
  const [estModules, setEstModules] = useState<EstablishmentModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const catalogKeys = moduleCatalog.map((m) => m.key);

  const usersOfEstablishment = (estId: number) =>
    permissions.filter(
      (p) =>
        Number(p.canonical_establishment_id) === estId && p.is_active !== false,
    );

  const loadEstModules = async (estId: number) => {
    setLoadingModules(true);
    try {
      const rows = await superadminFetch<EstablishmentModule[]>(
        `/establishments/${estId}/modules`,
      );
      setEstModules(rows);
    } catch {
      setEstModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const toggleExpanded = async (estId: number) => {
    if (expandedEstId === estId) {
      setExpandedEstId(null);
      return;
    }
    setExpandedEstId(estId);
    await loadEstModules(estId);
  };

  const toggleEstModule = async (
    estId: number,
    moduleKey: string,
    isEnabled: boolean,
  ) => {
    onError(null);
    try {
      await superadminFetch(`/establishments/${estId}/modules/${moduleKey}`, {
        method: "PUT",
        body: JSON.stringify({ is_enabled: !isEnabled }),
      });
      if (expandedEstId === estId) await loadEstModules(estId);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao atualizar módulo");
    }
  };

  const openAddForm = () => {
    setShowAdd(true);
    setEstForm({
      name: "",
      slug: "",
      profile: "generic",
      enabledModules: [...catalogKeys],
    });
    setSlugTouched(false);
  };

  const addEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estForm.name.trim()) return;
    if (!estForm.enabledModules.length) {
      onError("Selecione ao menos um módulo para o estabelecimento.");
      return;
    }
    setAdding(true);
    onError(null);
    onSuccess(null);
    try {
      const result = await superadminFetch<{
        name: string;
        legacyPlaceId: number;
        legacyBarId: number;
      }>(`/organizations/${orgId}/establishments`, {
        method: "POST",
        body: JSON.stringify({
          name: estForm.name.trim(),
          slug: estForm.slug.trim() || slugifyEstablishmentName(estForm.name),
          profile: estForm.profile,
          enabledModules: estForm.enabledModules,
        }),
      });
      onSuccess(
        `"${result.name}" criado (place ${result.legacyPlaceId}). Configure os usuários na aba "Usuários e acessos".`,
      );
      setShowAdd(false);
      onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao criar estabelecimento");
    } finally {
      setAdding(false);
    }
  };

  const toggleCreateModule = (key: string) => {
    setEstForm((prev) => {
      const has = prev.enabledModules.includes(key);
      return {
        ...prev,
        enabledModules: has
          ? prev.enabledModules.filter((k) => k !== key)
          : [...prev.enabledModules, key],
      };
    });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Estabelecimentos</h3>
          <p className="text-sm text-slate-400">
            As casas da organização, seus módulos e regras de operação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showAdd ? setShowAdd(false) : openAddForm())}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {showAdd ? "Cancelar" : "Adicionar estabelecimento"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addEstablishment}
          className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Nome</label>
            <input
              required
              placeholder="Ex: Apê do Pracinha"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setEstForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : slugifyEstablishmentName(name),
                }));
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Slug</label>
            <input
              required
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setEstForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Perfil operacional
            </label>
            <select
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={estForm.profile}
              onChange={(e) =>
                setEstForm((prev) => ({ ...prev, profile: e.target.value }))
              }
            >
              {ESTABLISHMENT_PROFILES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-medium text-slate-400">
              Funcionalidades deste estabelecimento (marque quantas quiser)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {moduleCatalog.map((m) => {
                const on = estForm.enabledModules.includes(m.key);
                return (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleCreateModule(m.key)}
                    />
                    {MODULE_LABELS[m.key] || m.name || m.key}
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs text-amber-400 hover:underline"
                onClick={() =>
                  setEstForm((p) => ({ ...p, enabledModules: [...catalogKeys] }))
                }
              >
                Marcar todos
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:underline"
                onClick={() =>
                  setEstForm((p) => ({ ...p, enabledModules: ["cardapio"] }))
                }
              >
                Só cardápio
              </button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:underline"
                onClick={() => setEstForm((p) => ({ ...p, enabledModules: [] }))}
              >
                Limpar
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="md:col-span-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium disabled:opacity-50"
          >
            {adding ? "Criando…" : "Criar estabelecimento"}
          </button>
        </form>
      )}

      {establishments.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum estabelecimento cadastrado.</p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-300">
          {establishments.map((e) => {
            const estUsers = usersOfEstablishment(e.id);
            return (
              <li
                key={e.id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100">{e.name}</p>
                    <p className="text-xs text-slate-500">
                      place {e.legacy_place_id ?? "—"} · bar {e.legacy_bar_id ?? "—"} ·{" "}
                      {estUsers.length}{" "}
                      {estUsers.length === 1
                        ? "usuário com acesso"
                        : "usuários com acesso"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(e.id)}
                      className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      {expandedEstId === e.id ? "Ocultar módulos" : "Módulos"}
                    </button>
                    <Link
                      href={`/superadmin/organizations/${orgId}/establishments/${e.id}`}
                      className="rounded bg-amber-700/80 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-600"
                    >
                      Editar regras
                    </Link>
                  </div>
                </div>
                {expandedEstId === e.id && (
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    {loadingModules ? (
                      <p className="text-xs text-slate-500">Carregando módulos…</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {estModules.map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => toggleEstModule(e.id, m.key, m.is_enabled)}
                            className={`rounded-full px-3 py-1 text-xs ${
                              m.is_enabled
                                ? "bg-emerald-900/50 text-emerald-300"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {MODULE_LABELS[m.key] || m.name || m.key}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
