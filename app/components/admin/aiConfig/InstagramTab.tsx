'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, Toggle, getApiBaseUrl, getAuthHeaders } from './shared';

type InstagramAccountForm = {
  username: string;
  ig_user_id: string;
  page_id: string;
  access_token: string;
  is_active: boolean;
  has_token: boolean;
  token_hint: string | null;
};

const EMPTY_FORM: InstagramAccountForm = {
  username: '',
  ig_user_id: '',
  page_id: '',
  access_token: '',
  is_active: true,
  has_token: false,
  token_hint: null,
};

export default function InstagramTab({ establishmentId }: { establishmentId: number | null }) {
  const [form, setForm] = useState<InstagramAccountForm>(EMPTY_FORM);
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/instagram-account`,
        { headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar o Instagram.');
      const data = json.data || {};
      setForm({
        username: data.username || '',
        ig_user_id: data.ig_user_id || '',
        page_id: data.page_id || '',
        access_token: '',
        is_active: data.is_active !== false,
        has_token: Boolean(data.has_token),
        token_hint: data.token_hint || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o Instagram.');
      setForm(EMPTY_FORM);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/instagram-account`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            username: form.username,
            ig_user_id: form.ig_user_id,
            page_id: form.page_id,
            access_token: form.access_token,
            is_active: form.is_active,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar o Instagram.');
      setForm((prev) => ({
        ...prev,
        access_token: '',
        has_token: Boolean(json.data?.has_token),
        token_hint: json.data?.token_hint || prev.token_hint,
        ig_user_id: json.data?.ig_user_id || prev.ig_user_id,
      }));
      setSuccess('Instagram desta casa ligado. A Sol passa a responder o Direct deste perfil.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o Instagram.');
    } finally {
      setSaving(false);
    }
  }, [establishmentId, form]);

  const disconnect = useCallback(async () => {
    if (establishmentId === null) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/instagram-account`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao desconectar.');
      setForm(EMPTY_FORM);
      setSuccess('Instagram desta casa foi desconectado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar o Instagram.');
    } finally {
      setSaving(false);
    }
  }, [establishmentId]);

  if (loading) return <p className="text-sm text-gray-500">Carregando Instagram...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Instagram da casa"
        description="Ligue o Direct deste estabelecimento. A Sol trava a casa pelo perfil que recebeu a mensagem."
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <MdInfoOutline size={18} className="mt-0.5 shrink-0" />
        <p>
          Na Meta, use o webhook <strong>/api/webhooks/instagram</strong> e assine o campo{' '}
          <strong>messages</strong> deste perfil. Cole abaixo o ID do Instagram profissional e o
          token da página. Comentários de post continuam de fora.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Direct ativo nesta casa</p>
          <p className="text-xs text-gray-500">
            {form.has_token
              ? `Token salvo ${form.token_hint || ''}`.trim()
              : 'Ainda sem token. A Sol não consegue responder este perfil.'}
          </p>
        </div>
        <Toggle
          checked={form.is_active}
          onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">@ do perfil</span>
          <input
            className={INPUT_CLASS}
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="highline"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">ID do Instagram</span>
          <input
            className={INPUT_CLASS}
            value={form.ig_user_id}
            onChange={(e) => setForm((prev) => ({ ...prev, ig_user_id: e.target.value }))}
            placeholder="178414..."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">ID da página (opcional)</span>
          <input
            className={INPUT_CLASS}
            value={form.page_id}
            onChange={(e) => setForm((prev) => ({ ...prev, page_id: e.target.value }))}
            placeholder="Se a Meta mandar o page id no webhook"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">Token de acesso</span>
          <input
            type="password"
            autoComplete="new-password"
            className={INPUT_CLASS}
            value={form.access_token}
            onChange={(e) => setForm((prev) => ({ ...prev, access_token: e.target.value }))}
            placeholder={form.has_token ? 'Deixe em branco para manter o atual' : 'Cole o token da Meta'}
          />
        </label>
      </div>

      <SaveBar onSave={save} onReset={load} saving={saving} />

      {form.has_token ? (
        <button
          type="button"
          onClick={disconnect}
          disabled={saving}
          className="text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          Desconectar Instagram desta casa
        </button>
      ) : null}
    </div>
  );
}
