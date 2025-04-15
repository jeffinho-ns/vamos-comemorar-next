"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { MdAdd } from "react-icons/md";
import AddGuestModal from "../../components/AddGuestModal/AddGuestModal";

interface Convidado {
  id: number;
  nome: string;
  documento?: string;
  lista: string;
}

export default function ConvidadosPage() {
  const { id } = useParams();
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [eventoNome, setEventoNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const fetchConvidados = useCallback(async () => {
    try {
      const res = await fetch(`https://vamos-comemorar-api.onrender.com/api/convidados/evento/${id}`);
      const data = await res.json();
      setConvidados(data.convidados);
      setEventoNome(data.evento?.nome_do_evento || "Evento");
    } catch (error) {
      console.error("Erro ao buscar convidados:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchConvidados();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser.id);
    }
  }, [id, fetchConvidados]);

  return (
    <div className="p-6 min-h-screen bg-[#F7F7F7]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Lista de Convidados - {eventoNome}
        </h1>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#00B0F0] hover:bg-[#0096d1] text-white text-sm px-4 py-2 rounded-full shadow"
        >
          <MdAdd size={18} />
          Adicionar Convidado
        </Button>
      </div>

      <h2 className="text-lg font-semibold text-gray-600 mb-4">Lista Geral</h2>

      {loading ? (
        <p className="text-gray-500">Carregando convidados...</p>
      ) : convidados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {convidados.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-md font-medium text-gray-800">{c.nome}</p>
              {c.documento && (
                <p className="text-sm text-gray-500">Doc: {c.documento}</p>
              )}
              <span className="text-xs text-gray-400 italic">{c.lista}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Nenhum convidado adicionado ainda.</p>
      )}

      {!loading && (
        <div className="mt-6 text-right text-sm text-gray-600">
          Total de convidados: {convidados.length}
        </div>
      )}

      {userId && (
        <AddGuestModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onGuestAdded={fetchConvidados}
          eventId={Number(id)}
          userId={userId}
        />
      )}
    </div>
  );
}
