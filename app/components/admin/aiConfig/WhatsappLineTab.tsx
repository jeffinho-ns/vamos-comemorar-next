'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, Toggle, getApiBaseUrl, getAuthHeaders } from './shared';

type WhatsappLineForm = {
  phone_number_id: string;
  display_phone: string;
  access_token: string;
  is_active: boolean;
  has_token: boolean;
  token_hint: string | null;
};

const EMPTY_FORM: WhatsappLineForm = {
  phone_number_id: '',
  display_phone: '',
  access_token: '',
  is_active: true,
  has_token: false,
  token_hint: null,
};

export default function WhatsappLineTab({ establishmentId }: { establishmentId: number | null }) {
  const [form, setForm] = useState<WhatsappLineForm>(EMPTY_FORM);
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/whatsapp-line`,
        { headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar o número.');
      const data = json.data || {};
      setForm({
        phone_number_id: data.phone_number_id || '',
        display_phone: data.display_phone || '',
        access_token: '',
        is_active: data.is_active !== false,
        has_token: Boolean(data.has_token),
        token_hint: data.token_hint || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o número.');
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/whatsapp-line`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            phone_number_id: form.phone_number_id,
            display_phone: form.display_phone,
            access_token: form.access_token,
            is_active: form.is_active,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar o número.');
      setForm((prev) => ({
        ...prev,
        access_token: '',
        phone_number_id: json.data?.phone_number_id || prev.phone_number_id,
        display_phone: json.data?.display_phone || prev.display_phone,
        has_token: Boolean(json.data?.has_token),
        token_hint: json.data?.token_hint || null,
      }));
      setSuccess('Número ligado nesta casa. A IA responde por ele e trava o estabelecimento.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o número.');
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/whatsapp-line`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao desconectar.');
      setForm(EMPTY_FORM);
      setSuccess('Número desta casa foi desconectado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar o número.');
    } finally {
      setSaving(false);
    }
  }, [establishmentId]);

  if (loading) return <p className="text-sm text-gray-500">Carregando número...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="WhatsApp da casa"
        description="Ligue o número desta casa na Meta. Quem escrever nele é atendido pela IA desta casa."
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <MdInfoOutline size={18} className="mt-0.5 shrink-0" />
        <p>
          No Gerenciador do WhatsApp, copie o <strong>Phone number ID</strong> do número desta casa.
          O webhook continua <strong>/api/webhooks/whatsapp</strong>. Se o número usa o mesmo token
          que já está no servidor, deixe o token em branco. O número que já atende hoje deve ser
          cadastrado na casa correspondente para as conversas antigas continuarem no mesmo lugar.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Número ativo nesta casa</p>
          <p className="text-xs text-gray-500">
            {form.phone_number_id
              ? 'A IA responde por este número e não muda de casa.'
              : 'Ainda sem número. As mensagens seguem no número geral do servidor.'}
          </p>
        </div>
        <Toggle
          checked={form.is_active}
          onChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">Phone number ID</span>
          <input
            className={INPUT_CLASS}
            value={form.phone_number_id}
            onChange={(e) => setForm((prev) => ({ ...prev, phone_number_id: e.target.value }))}
            placeholder="ID numérico da Meta"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">Telefone visível</span>
          <input
            className={INPUT_CLASS}
            value={form.display_phone}
            onChange={(e) => setForm((prev) => ({ ...prev, display_phone: e.target.value }))}
            placeholder="5511..."
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm text-gray-700">Token próprio (opcional)</span>
          <input
            type="password"
            autoComplete="new-password"
            className={INPUT_CLASS}
            value={form.access_token}
            onChange={(e) => setForm((prev) => ({ ...prev, access_token: e.target.value }))}
            placeholder={
              form.has_token
                ? `Token salvo ${form.token_hint || ''}`.trim()
                : 'Em branco usa o token geral do servidor'
            }
          />
        </label>
      </div>

      <SaveBar onSave={save} onReset={load} saving={saving} />

      {form.phone_number_id ? (
        <button
          type="button"
          onClick={disconnect}
          disabled={saving}
          className="text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          Desconectar número desta casa
        </button>
      ) : null}
    </div>
  );
}
