"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import AddEvent from "../../components/events/AddEvent";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Event {
  id: number;
  casa_do_evento: string;
  nome_do_evento: string;
  data_do_evento: string;
  hora_do_evento: string;
  local_do_evento: string;
  categoria: string;
  mesas: number;
  brinde: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchEvents = async (page: number) => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/events?page=${page}&perPage=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar eventos');

      const data = await response.json();

      if (Array.isArray(data)) {
        setEvents(data);
        setTotalPages(1); // Ajuste conforme a lógica de paginação da sua API
      } else {
        setError('Dados inválidos.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro desconhecido');
      }
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage]);

  const deleteEvent = async (id: number) => {
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`http://localhost:5001/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao excluir evento');

      // Remove o evento da lista localmente após a exclusão
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setError('Erro ao excluir evento');
    }
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="w-full p-6 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Eventos</h2>

      <div className="flex items-center mb-6">
        <button onClick={() => fetchEvents(currentPage)} className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full mr-4">
          <MdRefresh className="text-xl" />
        </button>
        <button onClick={openModal} className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full">
          <MdAdd className="text-xl" />
        </button>
      </div>
      
      <AddEvent
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
      />

      {loading && <p>Carregando eventos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Dia do Evento</th>
              <th className="px-6 py-3 font-semibold">Nome do Evento</th>
              <th className="px-6 py-3 font-semibold">Local</th>
              <th className="px-6 py-3 font-semibold">Brinde</th>
              <th className="px-6 py-3 font-semibold">Mesas</th>
              <th className="px-6 py-3 font-semibold">Categoria</th>
              <th className="px-6 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-6 py-4">{new Date(event.data_do_evento).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{event.nome_do_evento}</td>
                  <td className="px-6 py-4">{event.casa_do_evento}</td>
                  <td className="px-6 py-4">{event.brinde}</td>
                  <td className="px-6 py-4">{event.mesas}</td>
                  <td className="px-6 py-4">{event.categoria}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button title="Editar">
                      <MdEdit className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} title="Excluir">
                      <MdDelete className="text-red-500 hover:text-red-700" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Nenhum evento encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center">
        <button onClick={handlePreviousPage} className="p-2 border rounded-md mr-2" disabled={currentPage === 1}>Anterior</button>
        <button onClick={handleNextPage} className="p-2 border rounded-md" disabled={currentPage === totalPages}>Próximo</button>
      </div>
    </div>
  );
}
