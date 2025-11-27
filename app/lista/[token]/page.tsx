"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

type Guest = { id: number; name: string; status: string; checked_in?: boolean; checkin_time?: string };

export default function GuestListPublicPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestForm, setGuestForm] = useState<{ name: string; whatsapp: string }>({ name: '', whatsapp: '' });
  const [addingGuest, setAddingGuest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ added: number; skipped: number; errors: string[] }>({ added: 0, skipped: 0, errors: [] });
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string>("");

  const token = params?.token;

  const loadGuestList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/guest-list/${token}`);
      if (!res.ok) {
        const txt = await res.text();
        setError(res.status === 410 ? 'Este link expirou.' : 'Não foi possível carregar a lista.');
        console.error('Guest list error:', txt);
        return;
      }
      const data = await res.json();
      const gl = data.guestList;
      setOwnerName(gl.owner_name || '');
      setReservationDate(gl.reservation_date || '');
      setGuests(gl.guests || []);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar a lista.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadGuestList();
    // Gerar URL do check-in quando o componente montar
    if (typeof window !== 'undefined' && token) {
      setCheckInUrl(`${window.location.origin}/checkin/${token}`);
    }
  }, [loadGuestList, token]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Calcular progresso de check-ins
  const checkedInCount = useMemo(() => {
    return guests.filter(g => g.checked_in === true || g.status === 'CHECK-IN').length;
  }, [guests]);

  const totalGuests = guests.length;
  const progressPercentage = totalGuests > 0 ? (checkedInCount / totalGuests) * 100 : 0;

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name.trim()) return;
    
    setAddingGuest(true);
    try {
      const res = await fetch(`${API_URL}/api/guest-list/${token}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message);
        setGuestForm({ name: '', whatsapp: '' });
        // Recarregar a lista
        await loadGuestList();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Erro ao adicionar à lista');
      }
    } catch (e) {
      setError('Erro ao adicionar à lista');
    } finally {
      setAddingGuest(false);
    }
  };

  const parsedBulkNames = useMemo(() => {
    if (!bulkInput.trim()) return [];
    return bulkInput
      .split(/[\n,;]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }, [bulkInput]);

  const handleBulkAddGuests = async () => {
    if (!token || parsedBulkNames.length === 0) return;
    setBulkLoading(true);
    setBulkError(null);
    const errors: string[] = [];
    let added = 0;
    let skipped = 0;

    for (const name of parsedBulkNames) {
      try {
        const res = await fetch(`${API_URL}/api/guest-list/${token}/guests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, whatsapp: '' })
        });

        if (res.ok) {
          added += 1;
        } else {
          skipped += 1;
          const data = await res.json().catch(() => null);
          errors.push(data?.error || `Falha ao adicionar ${name}`);
        }
      } catch (error) {
        skipped += 1;
        errors.push(`Erro inesperado ao adicionar ${name}`);
      }
    }

    setBulkFeedback({ added, skipped, errors });

    if (errors.length > 0) {
      setBulkError(`${errors.length} convidado(s) não puderam ser adicionados.`);
    } else {
      setBulkError(null);
    }

    await loadGuestList();
    setBulkLoading(false);

    if (errors.length === 0) {
      setBulkInput('');
      setBulkModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Carregando...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 text-center max-w-md">
          <div className="text-red-600 font-semibold mb-2">Ops!</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow border border-gray-100 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Você está na lista de convidados de {ownerName}
        </h1>
        {reservationDate && (
          <p className="text-gray-600 mb-6 text-sm">Data do evento: {reservationDate ? new Date(reservationDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada'}</p>
        )}

        {/* Seção de QR Code e Progresso */}
        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Auto Check-in via QR Code</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-3">
                {checkInUrl ? (
                  <QRCodeSVG
                    value={checkInUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-gray-500 text-sm">Carregando...</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-orange-800 text-center max-w-xs">
                Convidados podem escanear este código para fazer check-in automaticamente
              </p>
            </div>

            {/* Barra de Progresso */}
            <div className="flex flex-col">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-900">Progresso de Check-ins</span>
                  <span className="text-sm font-bold text-orange-700">
                    {checkedInCount}/{totalGuests}
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-500 ease-out flex items-center justify-center"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  >
                    {progressPercentage > 15 && (
                      <span className="text-xs font-medium text-white">
                        {Math.round(progressPercentage)}%
                      </span>
                    )}
                  </div>
                </div>
                {progressPercentage < 15 && (
                  <span className="text-xs text-orange-700 mt-1 block text-right">
                    {Math.round(progressPercentage)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-700">
                {checkedInCount === totalGuests && totalGuests > 0
                  ? "🎉 Todos os convidados fizeram check-in!"
                  : `${totalGuests - checkedInCount} convidado(s) ainda não fizeram check-in`}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário para convidados se cadastrarem */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Adicionar-se à Lista</h3>
          {successMessage && (
            <div className="mb-3 p-3 bg-green-100 border border-green-200 rounded text-green-800 text-sm">
              ✅ {successMessage}
            </div>
          )}
          <form onSubmit={handleAddGuest} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Seu nome completo"
                value={guestForm.name}
                onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="tel"
                placeholder="WhatsApp (opcional)"
                value={guestForm.whatsapp}
                onChange={(e) => setGuestForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={addingGuest || !guestForm.name.trim()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            >
              {addingGuest ? 'Adicionando...' : 'Adicionar-me à Lista'}
            </button>
          </form>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setBulkFeedback({ added: 0, skipped: 0, errors: [] });
                setBulkError(null);
                setBulkModalOpen(true);
              }}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded font-medium transition-colors"
            >
              Importar nomes em lote
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-sm">
                    {g.checked_in === true || g.status === 'CHECK-IN' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✅ Check-in Realizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Confirmado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={2}>Nenhum convidado cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center">
          <input readOnly value={shareUrl} className="flex-1 px-3 py-2 border rounded" />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
          >Copiar Link</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Estou na lista de convidados: ' + shareUrl)}`}
            target="_blank"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-center"
          >Compartilhar no WhatsApp</a>
        </div>
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => !bulkLoading && setBulkModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Importar nomes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Cole todos os nomes separados por vírgula, ponto e vírgula ou pulando linha. Não é necessário informar WhatsApp.
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Exemplos:\nMaria Silva\nJoão Souza, Ana Paula\nCarlos Santos`}
              disabled={bulkLoading}
            />
            <div className="mt-3 text-sm text-gray-500">
              {parsedBulkNames.length > 0
                ? `${parsedBulkNames.length} convidado(s) serão importados.`
                : 'Nenhum nome detectado ainda.'}
            </div>
            {bulkError && (
              <div className="mt-3 p-3 rounded bg-red-100 text-red-700 text-sm">
                {bulkError}
              </div>
            )}
            {bulkFeedback.added > 0 || bulkFeedback.skipped > 0 ? (
              <div className="mt-3 p-3 rounded bg-blue-50 text-blue-800 text-sm space-y-1">
                <div>✅ Adicionados: {bulkFeedback.added}</div>
                {bulkFeedback.skipped > 0 && <div>⚠️ Não adicionados: {bulkFeedback.skipped}</div>}
                {bulkFeedback.errors.length > 0 && (
                  <details className="text-gray-600">
                    <summary className="cursor-pointer">Ver detalhes</summary>
                    <ul className="list-disc list-inside">
                      {bulkFeedback.errors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <button
                onClick={handleBulkAddGuests}
                disabled={bulkLoading || parsedBulkNames.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
              >
                {bulkLoading ? 'Importando...' : 'Importar convidados'}
              </button>
              <button
                onClick={() => !bulkLoading && setBulkModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
                disabled={bulkLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


