'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/app/config/api';

type StaffAgentStatus = {
  ok: boolean;
  enabled_globally?: boolean;
  groq_configured?: boolean;
  establishment_enabled?: boolean;
  model?: string;
};

type TurnResponse = {
  ok: boolean;
  type?: 'message' | 'result' | 'confirm' | 'applied';
  reply?: string;
  confirm_id?: string;
  tool?: string;
  error?: string;
  code?: string;
};

type StaffAgentBoxProps = {
  token: string | null | undefined;
  establishmentId: number | null | undefined;
  className?: string;
};

/**
 * Caixa discreta do Staff Agent Fase 1 — sem chat flutuante.
 * Só aparece se a feature flag da casa estiver ligada e Groq configurado.
 */
export default function StaffAgentBox({
  token,
  establishmentId,
  className = '',
}: StaffAgentBoxProps) {
  const [status, setStatus] = useState<StaffAgentStatus | null>(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!token || !establishmentId) {
      setStatus(null);
      return;
    }
    try {
      const res = await fetch(
        `${getApiUrl()}/api/staff-agent/status?establishment_id=${establishmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as StaffAgentStatus;
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, [token, establishmentId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const visible =
    !dismissed &&
    Boolean(status?.enabled_globally && status?.establishment_enabled && status?.groq_configured);

  const sendTurn = async () => {
    const text = message.trim();
    if (!text || !token || !establishmentId || loading) return;
    setLoading(true);
    setReply(null);
    setConfirmId(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-agent/turn`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ establishment_id: establishmentId, message: text }),
      });
      const data = (await res.json()) as TurnResponse;
      if (!res.ok || data.ok === false) {
        setReply(data.error || 'Não foi possível processar agora. Tente de novo.');
        return;
      }
      setReply(data.reply || 'Pronto.');
      if (data.type === 'confirm' && data.confirm_id) {
        setConfirmId(data.confirm_id);
      } else {
        setMessage('');
      }
    } catch {
      setReply('Falha de conexão. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!confirmId || !token || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-agent/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm_id: confirmId }),
      });
      const data = (await res.json()) as TurnResponse;
      setConfirmId(null);
      setReply(data.reply || (data.ok ? 'Feito.' : data.error || 'Não aplicado.'));
      if (data.ok) setMessage('');
    } catch {
      setReply('Falha ao confirmar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Atalho do turno</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Ex.: “como está o dia de hoje?” ou “pausar a caipirinha”
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-slate-400 hover:text-slate-600"
          aria-label="Dispensar"
        >
          Dispensar
        </button>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void sendTurn();
              }
            }}
            disabled={loading}
            placeholder="Pedir algo ao sistema…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => void sendTurn()}
            disabled={loading || !message.trim()}
            className="rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-40 hover:bg-slate-800"
          >
            {loading ? '…' : 'Enviar'}
          </button>
        </div>

        {reply && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap">
            {reply}
          </div>
        )}

        {confirmId && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void confirmAction()}
              disabled={loading}
              className="rounded-xl bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 disabled:opacity-40"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmId(null);
                setReply('Cancelado. Nada foi alterado.');
              }}
              disabled={loading}
              className="rounded-xl border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
