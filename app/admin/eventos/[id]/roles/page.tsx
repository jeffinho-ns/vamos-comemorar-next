"use client"; // <-- TORNANDO UM CLIENT COMPONENT

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AddRuleForm from '../../../../components/form/AddRuleForm'; // Ajuste o caminho se necessário
import { Button } from '../../../../components/ui/button'; // Importe o componente Button
import { MdAdd } from 'react-icons/md'; // Importe um ícone de adição

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vamos-comemorar-api.onrender.com/api";

interface EventRule {
  id: number;
  tipo_regra: string;
  valor_regra: string;
  descricao: string;
}

export default function EventRulesPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [rules, setRules] = useState<EventRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/rules`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Falha ao buscar as regras.");
      }
      const data = await res.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchRules();
    }
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando regras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Regras do Evento</h1>
          <p className="text-gray-400 text-lg">Evento #{eventId} - Configure as regras e permissões</p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div></div> {/* Espaçador */}
          <Button
            className="flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold"
            onClick={() => {
              console.log('Botão Adicionar Regra clicado');
            }}
          >
            <MdAdd size={20} /> Adicionar Nova Regra
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Adicionar Regra</h2>
            <AddRuleForm eventId={eventId} onRuleAdded={fetchRules} />
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Regras Atuais</h2>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📋</div>
                <p className="text-gray-500 text-lg">Nenhuma regra cadastrada para este evento.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {rules.map((rule) => (
                  <li key={rule.id} className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/50 hover:bg-gray-100/80 transition-colors">
                    <p className="font-semibold text-gray-800 text-lg mb-2">{rule.descricao}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-gray-700">{rule.tipo_regra}:</span> {rule.valor_regra}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}