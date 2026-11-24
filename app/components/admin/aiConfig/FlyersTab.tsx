'use client';

import { useCallback, useEffect, useState } from 'react';
import { FeedbackBanner, SectionHeader, getApiBaseUrl } from './shared';
import FlyerKindPanel from './FlyerKindPanel';
import { ASSET_KINDS, tokenHeader, type AssetKind, type Flyer } from './flyerTypes';

export default function FlyersTab({ establishmentId }: { establishmentId: number | null }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [kind, setKind] = useState<AssetKind>('informacao');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const baseUrl = useCallback(
    () => `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/ai-flyers`,
    [establishmentId],
  );

  const load = useCallback(async () => {
    if (establishmentId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(baseUrl(), { headers: tokenHeader() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar.');
      setFlyers(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, baseUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const patchLocal = (id: number, patch: Partial<Flyer>) =>
    setFlyers((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const handleUpload = async (files: FileList) => {
    if (establishmentId === null) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('asset_kind', kind);
      form.append('trigger_event', kind === 'informacao' ? 'reserva_criada' : 'sob_demanda');
      Array.from(files).forEach((file) => form.append('images', file));
      const res = await fetch(baseUrl(), { method: 'POST', headers: tokenHeader(), body: form });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao subir imagens.');
      const count = Array.isArray(json.data) ? json.data.length : 1;
      setSuccess(
        `${count} ${count === 1 ? 'imagem enviada' : 'imagens enviadas'}. Agora escreva a legenda de cada uma.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao subir imagens.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (flyer: Flyer) => {
    if (establishmentId === null) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('asset_kind', flyer.asset_kind || kind);
      form.append('trigger_event', flyer.trigger_event);
      form.append('title', flyer.title || '');
      form.append('caption', flyer.caption || '');
      form.append('usage_hint', flyer.usage_hint || '');
      form.append('delay_hours', String(flyer.trigger_event === 'pos_visita' ? flyer.delay_hours : 0));
      form.append('is_active', String(flyer.is_active));
      const res = await fetch(`${baseUrl()}/${flyer.id}`, {
        method: 'PUT',
        headers: tokenHeader(),
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar.');
      setSuccess('Arte atualizada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (establishmentId === null) return;
    if (!window.confirm('Remover esta arte?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl()}/${id}`, { method: 'DELETE', headers: tokenHeader() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao remover.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceImage = async (id: number, file: File) => {
    if (establishmentId === null) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${baseUrl()}/${id}`, {
        method: 'PUT',
        headers: tokenHeader(),
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao trocar imagem.');
      setSuccess('Imagem atualizada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar imagem.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando artes...</p>;

  const visible = flyers.filter((item) => (item.asset_kind || 'informacao') === kind);

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Artes para a Sol"
        description="Separe flyer de informação, flyer de datas e fotos da casa. Em cada imagem, descreva o que ela é e quando a Sol deve enviar no WhatsApp."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ASSET_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setKind(item.id)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              kind === item.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className={`text-sm font-semibold ${kind === item.id ? 'text-amber-700' : 'text-gray-900'}`}>
              {item.label}
            </p>
            <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
          </button>
        ))}
      </div>
      <FlyerKindPanel
        kind={kind}
        flyers={visible}
        busy={busy}
        onUpload={handleUpload}
        onPatch={patchLocal}
        onSave={handleSave}
        onDelete={handleDelete}
        onReplace={handleReplaceImage}
      />
    </div>
  );
}
