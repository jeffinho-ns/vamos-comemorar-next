"use client";
import { useState, useEffect } from 'react';
import { Button } from '../ui/button'; // Supondo que você use ShadCN UI ou similar

export default function AddRuleForm({ eventId, onRuleAdded }: { eventId: string; onRuleAdded: () => void }) {
  const [tipoRegra, setTipoRegra] = useState("LIMITE_PESSOAS_RESERVA");
  const [valorRegra, setValorRegra] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Acessamos o token DENTRO de uma função, não no topo do arquivo.
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Garante que o código só roda no navegador, onde o localStorage existe.
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Erro de autenticação: Token não encontrado. Faça login novamente.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/events/${eventId}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Usa o token do estado
        },
        body: JSON.stringify({
          tipo_regra: tipoRegra,
          valor_regra: valorRegra,
          descricao: descricao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar regra');
      }

      setValorRegra("");
      setDescricao("");
      onRuleAdded();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-md shadow-sm border border-gray-200">
        <h3 className="text-[18px] font-bold text-[#3f3f3f]">Adicionar Nova Regra</h3>
        <div>
            <label htmlFor="tipo_regra" className="block text-[13px] font-medium text-gray-600">Tipo de Regra</label>
            <select
            id="tipo_regra"
            value={tipoRegra}
            onChange={(e) => setTipoRegra(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
            <option value="LIMITE_PESSOAS_RESERVA">Limite de Pessoas por Reserva</option>
            <option value="BRINDE_POR_CHECKIN">Brinde por Check-in</option>
            </select>
        </div>
        <div>
            <label htmlFor="valor_regra" className="block text-[13px] font-medium text-gray-600">Valor da Regra</label>
            <input
            type="text"
            id="valor_regra"
            value={valorRegra}
            onChange={(e) => setValorRegra(e.target.value)}
            placeholder="Ex: 10 (para limite) ou '1 Cerveja'"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
            />
        </div>
        <div>
            <label htmlFor="descricao" className="block text-[13px] font-medium text-gray-600">Descrição</label>
            <input
            type="text"
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Limite máximo para este evento"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
            />
        </div>
        <Button
            type="submit"
            disabled={isLoading || !token} // Desabilita se estiver carregando ou sem token
            className="w-full bg-[#3f7fcf] hover:bg-[#306ac0] text-white"
        >
            {isLoading ? 'Salvando...' : 'Salvar Regra'}
        </Button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}