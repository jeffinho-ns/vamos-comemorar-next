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

export const INPUT_CLASS =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none';

export const PANEL_CARD_CLASS = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm';

export const SUBTLE_CARD_CLASS = 'rounded-xl border border-gray-200 bg-gray-50 p-4';

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
        checked ? 'bg-amber-500' : 'bg-gray-300'
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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
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
        active ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <p className={`text-sm font-semibold ${active ? 'text-amber-700' : 'text-gray-900'}`}>{title}</p>
      <p className="text-xs text-gray-500">{hint}</p>
    </button>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500">{description}</p>}
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
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
    <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
      <button
        type="button"
        onClick={onReset}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <MdReplay size={16} />
        Descartar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
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
