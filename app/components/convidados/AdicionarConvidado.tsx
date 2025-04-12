'use client'

import { useState } from 'react'

interface Props {
  eventId: string
}

export default function AdicionarConvidado({ eventId }: Props) {
  const [nomes, setNomes] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdicionar = async () => {
    if (!nomes.trim()) {
      setMensagem('Digite pelo menos um nome.');
      return;
    }

    setLoading(true);
    setMensagem('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMensagem('Você precisa estar logado para adicionar convidados.');
        setLoading(false);
        return;
      }

      const nomesArray = nomes
        .split('\n')
        .map((nome) => nome.trim())
        .filter((nome) => nome !== '');

      const res = await fetch(`https://vamos-comemorar-api.onrender.com/api/convidados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          nomes: nomesArray,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro na resposta da API.');
      }

      setMensagem('Convidados adicionados com sucesso!');
      setNomes('');
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao adicionar convidados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        className="w-full border border-gray-300 p-2 rounded-md"
        placeholder="Digite um nome por linha"
        value={nomes}
        onChange={(e) => setNomes(e.target.value)}
      />

      <button
        onClick={handleAdicionar}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Adicionando...' : 'Adicionar convidados'}
      </button>

      {mensagem && <p className="text-sm text-gray-600">{mensagem}</p>}
    </div>
  )
}
