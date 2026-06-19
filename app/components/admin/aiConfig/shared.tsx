'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdReplay, MdSave } from 'react-icons/md';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';
}

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-500' : 'bg-zinc-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-100">{title}</p>
        {description && <p className="text-xs text-zinc-400">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function CardOption({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        active ? 'border-purple-500 bg-purple-500/15' : 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60'
      }`}
    >
      <p className={`text-sm font-semibold ${active ? 'text-purple-200' : 'text-zinc-100'}`}>{title}</p>
      <p className="text-xs text-zinc-400">{hint}</p>
    </button>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="text-sm text-zinc-400">{description}</p>}
    </header>
  );
}

export function FeedbackBanner({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (!error && !success) return null;
  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {success}
        </div>
      )}
    </>
  );
}

export function SaveBar({
  onSave,
  onReset,
  saving,
  disabled,
}: {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
      <button
        type="button"
        onClick={onReset}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
      >
        <MdReplay size={16} />
        Descartar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
      >
        <MdSave size={16} />
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  );
}

/** Hook genérico para recursos de lista (links, quebra-gelos, figurinhas, números). */
export function useAiList<T>(establishmentId: number | null, resource: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (establishmentId === null) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/${resource}`,
        { headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar.');
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [establishmentId, resource]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    if (establishmentId === null) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/${resource}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar.');
      setItems(Array.isArray(json.data) ? json.data : []);
      setSuccess('Alterações salvas com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [establishmentId, resource, items]);

  return { items, setItems, loading, saving, error, success, setSuccess, load, save };
}
