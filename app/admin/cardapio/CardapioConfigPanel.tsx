'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '@/app/utils/readAuthToken';

const API_BASE_URL = 'https://api.agilizaiapp.com.br/api/cardapio';

type Seal = { id: string; name: string; color: string; type: 'food' | 'drink' };

type MenuSettings = {
  menuCategoryBgColor: string;
  menuCategoryTextColor: string;
  menuSubcategoryBgColor: string;
  menuSubcategoryTextColor: string;
  mobileSidebarBgColor: string;
  mobileSidebarTextColor: string;
  menuDisplayStyle: 'normal' | 'clean';
  customSeals: Seal[];
};

type House = {
  barId: number;
  name: string;
  slug: string;
  categoryCount: number;
  itemCount: number;
  hiddenCount: number;
  featuredCount: number;
  lastBackupAt: string | null;
  settings: MenuSettings;
};

type Organization = { id: number; name: string; houses: House[] };

type Backup = {
  id: number;
  barId: number;
  label: string;
  reason: 'manual' | 'pre_restore';
  categoryCount: number;
  itemCount: number;
  createdAt: string;
  createdByName: string | null;
};

type NamedChange = { id: number; name: string; categoryName?: string; changes?: Array<{ label: string; from: string | number; to: string | number }> };

type MenuDiff = {
  unchanged: boolean;
  missingCategories: NamedChange[];
  extraCategories: NamedChange[];
  changedCategories: NamedChange[];
  missingItems: NamedChange[];
  extraItems: NamedChange[];
  changedItems: NamedChange[];
  totals: Record<string, number>;
};

const COLOR_FIELDS: Array<{ key: keyof MenuSettings; label: string }> = [
  { key: 'menuCategoryBgColor', label: 'Fundo da categoria' },
  { key: 'menuCategoryTextColor', label: 'Texto da categoria' },
  { key: 'menuSubcategoryBgColor', label: 'Fundo da subcategoria' },
  { key: 'menuSubcategoryTextColor', label: 'Texto da subcategoria' },
  { key: 'mobileSidebarBgColor', label: 'Fundo do menu no celular' },
  { key: 'mobileSidebarTextColor', label: 'Texto do menu no celular' },
];

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }
  return body;
}

function formatWhen(value: string | null) {
  if (!value) return 'nenhum backup ainda';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function DiffList({ title, rows, tone }: { title: string; rows: NamedChange[]; tone: string }) {
  if (!rows.length) return null;
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-1 text-sm">
        {rows.slice(0, 40).map((row) => (
          <li key={`${title}-${row.id}`}>
            <span className="font-medium">{row.name}</span>
            {row.categoryName ? <span className="text-gray-600"> · {row.categoryName}</span> : null}
            {row.changes?.length ? (
              <span className="text-gray-600">
                {' '}
                — {row.changes.map((change) => `${change.label}: ${change.from} → ${change.to}`).join('; ')}
              </span>
            ) : null}
          </li>
        ))}
        {rows.length > 40 ? <li>e mais {rows.length - 40}</li> : null}
      </ul>
    </div>
  );
}

function HouseConfig({
  house,
  canEdit,
  onChanged,
}: {
  house: House;
  canEdit: boolean;
  onChanged: (house: House) => void;
}) {
  const [settings, setSettings] = useState(house.settings);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [diff, setDiff] = useState<MenuDiff | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadBackups = useCallback(async () => {
    const body = await readJson(
      await fetch(`${API_BASE_URL}/config/houses/${house.barId}/backups`, { headers: authHeaders() }),
    );
    setBackups(body.backups || []);
  }, [house.barId]);

  useEffect(() => {
    loadBackups().catch((err: Error) => setError(err.message));
  }, [loadBackups]);

  async function saveSettings() {
    setBusy('settings');
    setError('');
    setMessage('');
    try {
      const body = await readJson(
        await fetch(`${API_BASE_URL}/config/houses/${house.barId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(settings),
        }),
      );
      const next = { ...house, settings: body.settings };
      setSettings(body.settings);
      onChanged(next);
      setMessage('Configuração salva.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy('');
    }
  }

  async function createBackup() {
    setBusy('backup');
    setError('');
    setMessage('');
    try {
      await readJson(
        await fetch(`${API_BASE_URL}/config/houses/${house.barId}/backups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ label: `Backup de segurança — ${house.name}` }),
        }),
      );
      await loadBackups();
      onChanged({ ...house, lastBackupAt: new Date().toISOString() });
      setMessage('Backup criado com o cardápio atual.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar o backup.');
    } finally {
      setBusy('');
    }
  }

  async function openDiff(backupId: number) {
    setBusy(`diff-${backupId}`);
    setError('');
    setConfirmRestore(false);
    setSelectedBackup(backupId);
    try {
      const body = await readJson(
        await fetch(`${API_BASE_URL}/config/houses/${house.barId}/backups/${backupId}/diff`, {
          headers: authHeaders(),
        }),
      );
      setDiff(body.diff);
    } catch (err) {
      setDiff(null);
      setError(err instanceof Error ? err.message : 'Erro ao comparar.');
    } finally {
      setBusy('');
    }
  }

  async function restore() {
    if (!selectedBackup || !confirmRestore) return;
    setBusy('restore');
    setError('');
    try {
      await readJson(
        await fetch(`${API_BASE_URL}/config/houses/${house.barId}/backups/${selectedBackup}/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ confirm: true }),
        }),
      );
      setMessage('Cardápio restaurado. O estado de antes da restauração também foi salvo.');
      setDiff(null);
      setConfirmRestore(false);
      await loadBackups();
      onChanged(house);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar.');
    } finally {
      setBusy('');
    }
  }

  function addSeal() {
    setSettings((current) => ({
      ...current,
      customSeals: [
        ...current.customSeals,
        { id: `seal-${Date.now()}`, name: '', color: '#DE5246', type: 'food' },
      ],
    }));
  }

  return (
    <div className="space-y-6 border-t border-gray-100 p-4">
      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded-full bg-gray-100 px-2 py-1">{house.categoryCount} categorias</span>
        <span className="rounded-full bg-gray-100 px-2 py-1">{house.itemCount} itens</span>
        <span className="rounded-full bg-gray-100 px-2 py-1">{house.hiddenCount} ocultos</span>
        <span className="rounded-full bg-gray-100 px-2 py-1">{house.featuredCount} destaques</span>
        <a className="rounded-full bg-blue-50 px-2 py-1 text-blue-700" href={`/cardapio/${house.slug}`} target="_blank" rel="noreferrer">
          Ver cardápio público
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h4 className="font-semibold text-gray-900">Aparência do cardápio</h4>
          <label className="block text-sm text-gray-700">
            Estilo
            <select
              value={settings.menuDisplayStyle}
              disabled={!canEdit}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  menuDisplayStyle: event.target.value === 'clean' ? 'clean' : 'normal',
                }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="normal">Cardápio completo</option>
              <option value="clean">Cardápio clean</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COLOR_FIELDS.map((field) => (
              <label key={field.key} className="text-sm text-gray-700">
                {field.label}
                <input
                  type="color"
                  disabled={!canEdit}
                  value={/^#[0-9A-Fa-f]{6}$/.test(String(settings[field.key])) ? String(settings[field.key]) : '#ffffff'}
                  onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value.toUpperCase() }))}
                  className="mt-1 h-10 w-full rounded border border-gray-300"
                />
              </label>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-800">Selos do cardápio</h5>
              {canEdit ? (
                <button type="button" onClick={addSeal} className="text-sm text-blue-700">
                  Adicionar selo
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              {settings.customSeals.map((seal, index) => (
                <div key={seal.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                  <input
                    value={seal.name}
                    disabled={!canEdit}
                    placeholder="Nome do selo"
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        customSeals: current.customSeals.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item,
                        ),
                      }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="color"
                    disabled={!canEdit}
                    value={seal.color || '#DE5246'}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        customSeals: current.customSeals.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, color: event.target.value.toUpperCase() } : item,
                        ),
                      }))
                    }
                    className="h-9 w-12 rounded border border-gray-300"
                  />
                  <select
                    disabled={!canEdit}
                    value={seal.type}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        customSeals: current.customSeals.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, type: event.target.value === 'drink' ? 'drink' : 'food' }
                            : item,
                        ),
                      }))
                    }
                    className="rounded-md border border-gray-300 px-2 text-sm"
                  >
                    <option value="food">Comida</option>
                    <option value="drink">Bebida</option>
                  </select>
                  {canEdit ? (
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          customSeals: current.customSeals.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                    >
                      Tirar
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={saveSettings}
              disabled={busy === 'settings'}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy === 'settings' ? 'Salvando...' : 'Salvar aparência'}
            </button>
          ) : null}
        </section>

        <section className="space-y-3">
          <h4 className="font-semibold text-gray-900">Backup de segurança</h4>
          <p className="text-sm text-gray-600">
            Guarda categorias, itens, preços, fotos, ordem e complementos desta casa. Se alguém apagar uma categoria ou vários itens, dá para ver o que mudou e voltar para este ponto.
          </p>
          {canEdit ? (
            <button
              type="button"
              onClick={createBackup}
              disabled={busy === 'backup'}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-60"
            >
              {busy === 'backup' ? 'Salvando backup...' : 'Criar backup agora'}
            </button>
          ) : null}
          <div className="space-y-2">
            {backups.length === 0 ? (
              <p className="text-sm text-gray-500">Ainda não há backup. Crie um com o cardápio do jeito que está agora.</p>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">{backup.label}</p>
                  <p className="text-xs text-gray-500">
                    {formatWhen(backup.createdAt)}
                    {backup.createdByName ? ` · ${backup.createdByName}` : ''}
                    {backup.reason === 'pre_restore' ? ' · cópia automática antes de uma restauração' : ''}
                    {' · '}
                    {backup.categoryCount} categorias, {backup.itemCount} itens
                  </p>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => openDiff(backup.id)}
                      className="mt-2 text-sm font-medium text-blue-700"
                    >
                      {busy === `diff-${backup.id}` ? 'Comparando...' : 'Ver o que mudou e restaurar'}
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {diff && selectedBackup ? (
            <div className="space-y-3 rounded-lg bg-gray-50 p-3">
              {diff.unchanged ? (
                <p className="text-sm text-gray-700">Nada mudou desde este backup.</p>
              ) : (
                <>
                  <DiffList title="Categorias apagadas — voltam na restauração" rows={diff.missingCategories} tone="border-amber-200 bg-amber-50" />
                  <DiffList title="Itens apagados — voltam na restauração" rows={diff.missingItems} tone="border-amber-200 bg-amber-50" />
                  <DiffList title="Alterados depois do backup — voltam ao valor anterior" rows={[...diff.changedCategories, ...diff.changedItems]} tone="border-blue-200 bg-blue-50" />
                  <DiffList title="Criados depois do backup — saem na restauração" rows={[...diff.extraCategories, ...diff.extraItems]} tone="border-red-200 bg-red-50" />
                </>
              )}
              {canEdit && !diff.unchanged ? (
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={confirmRestore} onChange={(event) => setConfirmRestore(event.target.checked)} />
                  Antes de restaurar, o sistema salva o cardápio atual. Quero voltar para este backup.
                </label>
              ) : null}
              {canEdit && !diff.unchanged ? (
                <button
                  type="button"
                  disabled={!confirmRestore || busy === 'restore'}
                  onClick={restore}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {busy === 'restore' ? 'Restaurando...' : 'Restaurar este backup'}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function CardapioConfigPanel({
  canEditBar,
  onMenuChanged,
}: {
  canEditBar: (barId: number) => boolean;
  onMenuChanged: () => void;
}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [openHouse, setOpenHouse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const body = await readJson(await fetch(`${API_BASE_URL}/config/houses`, { headers: authHeaders() }));
      setOrganizations(body.organizations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  function replaceHouse(next: House) {
    setOrganizations((current) =>
      current.map((organization) => ({
        ...organization,
        houses: organization.houses.map((house) => (house.barId === next.barId ? next : house)),
      })),
    );
    onMenuChanged();
    void load(true);
  }

  async function backupAll() {
    setBulkBusy(true);
    setBulkMessage('');
    setError('');
    try {
      const body = await readJson(
        await fetch(`${API_BASE_URL}/config/backups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({}),
        }),
      );
      const failedCount = Array.isArray(body.failed) ? body.failed.length : 0;
      setBulkMessage(
        `Backup criado em ${body.created?.length || 0} casas.${failedCount ? ` ${failedCount} não foram salvas.` : ''}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar os backups.');
    } finally {
      setBulkBusy(false);
    }
  }

  if (loading) return <p className="text-gray-600">Carregando configurações...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Configuração</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Aparência do cardápio público e backup de segurança de cada casa. O backup serve para recuperar uma categoria ou vários itens apagados sem querer.
          </p>
        </div>
        <button
          type="button"
          onClick={backupAll}
          disabled={bulkBusy}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {bulkBusy ? 'Criando backups...' : 'Criar backup de todas as casas'}
        </button>
      </div>
      {bulkMessage ? <p className="text-sm text-green-700">{bulkMessage}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {organizations.map((organization) => (
        <section key={organization.id} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{organization.name}</h3>
          {organization.houses.map((house) => {
            const open = openHouse === house.barId;
            return (
              <article key={house.barId} className="overflow-hidden rounded-lg bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenHouse(open ? null : house.barId)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <span>
                    <span className="block font-semibold text-gray-900">{house.name}</span>
                    <span className="text-sm text-gray-500">Último backup: {formatWhen(house.lastBackupAt)}</span>
                  </span>
                  <span className="text-sm text-blue-700">{open ? 'Fechar' : 'Configurar'}</span>
                </button>
                {open ? (
                  <HouseConfig house={house} canEdit={canEditBar(house.barId)} onChanged={replaceHouse} />
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
