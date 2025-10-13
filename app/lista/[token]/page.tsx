"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

type Guest = { id: number; name: string; status: string };

export default function GuestListPublicPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    const token = params?.token;
    if (!token) return;
    const load = async () => {
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
    };
    load();
  }, [params?.token]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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
          <p className="text-gray-600 mb-6 text-sm">Data do evento: {new Date(reservationDate).toLocaleDateString('pt-BR')}</p>
        )}

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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Confirmado
                    </span>
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
    </div>
  );
}


