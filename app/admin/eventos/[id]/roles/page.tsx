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

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-sm">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6"> {/* Adicionado um flex container */}
          <h1 className="text-[20px] font-bold text-[#3f3f3f]">Gerenciar Regras do Evento #{eventId}</h1>
          {/* Botão para adicionar novas regras */}
          <Button
            className="flex items-center gap-2 bg-[#3f7fcf] hover:bg-[#306ac0] text-white px-4 py-2 rounded shadow text-sm"
            onClick={() => {
              // Você pode adicionar lógica aqui se quiser rolar para o formulário
              // ou mostrar/esconder o formulário, se ele não estiver sempre visível.
              // Como o formulário já está visível, este botão serve como um CTA.
              console.log('Botão Adicionar Regra clicado');
            }}
          >
            <MdAdd size={18} /> Adicionar Nova Regra
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {/* O onRuleAdded agora simplesmente chama a função de refetch */}
            <AddRuleForm eventId={eventId} onRuleAdded={fetchRules} />
          </div>
          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
            <h2 className="text-[18px] font-bold text-[#3f3f3f] mb-4">Regras Atuais</h2>
            {isLoading ? (
                <p>Carregando regras...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : rules.length === 0 ? (
              <p className="text-gray-600">Nenhuma regra cadastrada para este evento.</p>
            ) : (
              <ul className="space-y-3">
                {rules.map((rule) => (
                  <li key={rule.id} className="bg-gray-100 p-4 rounded-md">
                    <p className="font-semibold text-gray-800">{rule.descricao}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-bold">{rule.tipo_regra}:</span> {rule.valor_regra}
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