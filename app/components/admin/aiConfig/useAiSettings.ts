'use client';

import { useCallback, useEffect, useState } from 'react';
import { AiAssistantSettings, getDefaultAiAssistantSettings } from '@/app/types/aiAssistant';
import { getApiBaseUrl, getAuthHeaders } from './shared';

export function useAiSettings(establishmentId: number | null) {
  const [settings, setSettings] = useState<AiAssistantSettings>(getDefaultAiAssistantSettings());
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/ai-settings`,
        { headers: getAuthHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar configurações.');
      const data = json.data || {};
      setSettings({
        ...getDefaultAiAssistantSettings(establishmentId),
        ...data,
        custom_rules: Array.isArray(data.custom_rules) ? data.custom_rules : [],
        behavior_config: data.behavior_config && typeof data.behavior_config === 'object' ? data.behavior_config : {},
        follow_up_config:
          data.follow_up_config && typeof data.follow_up_config === 'object' ? data.follow_up_config : {},
        ice_breakers_channels: Array.isArray(data.ice_breakers_channels)
          ? data.ice_breakers_channels
          : ['whatsapp'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações.');
      setSettings(getDefaultAiAssistantSettings(establishmentId));
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
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/ai-settings`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(settings),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar configurações.');
      setSuccess('Configurações salvas com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }, [establishmentId, settings]);

  const update = useCallback(
    <K extends keyof AiAssistantSettings>(key: K, value: AiAssistantSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSuccess(null);
    },
    [],
  );

  return { settings, setSettings, update, loading, saving, error, success, load, save };
}
