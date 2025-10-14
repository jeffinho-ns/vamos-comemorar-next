"use client";
import { MdAdd, MdRefresh, MdEdit, MdDelete } from "react-icons/md";
import { EventDataApi } from '../../types/types';
import AddEvent from "../../components/events/AddEvent";
import EditEventModal from "@/app/components/EditEvent/EditEvent";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';



export default function EventsPage() {
  const [events, setEvents] = useState<EventDataApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDataApi | null>(null);
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
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao excluir evento');

      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setError('Erro ao excluir evento');
    }
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

const openEditModal = (event: EventDataApi) => {
  setSelectedEvent(event);
  setEditModalOpen(true);
};
  const closeEditModal = () => {
    setSelectedEvent(null);
    setEditModalOpen(false);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando eventos...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Eventos</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todos os eventos do sistema</p>
        </div>

        <div className="flex items-center mb-8 gap-4">
          <button 
            onClick={() => fetchEvents(currentPage)} 
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <MdRefresh className="text-xl" />
          </button>
          <button 
            onClick={openModal} 
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <MdAdd className="text-xl" />
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-200/20">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-800">Dia do Evento</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Nome do Evento</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Local</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Brinde</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Mesas</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Categoria</th>
                  <th className="px-6 py-4 font-bold text-gray-800">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {/* LÓGICA CORRIGIDA AQUI */}
                        {event.tipo_evento === 'unico'
                          ? (event.data_do_evento ? new Date(event.data_do_evento + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não definida')
                          : `Toda ${['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][event.dia_da_semana!]}`
                        }
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{event.nome_do_evento}</td>
                      <td className="px-6 py-4 text-gray-600">{event.casa_do_evento}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          {event.brinde}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{event.mesas}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          {event.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex space-x-3">
                        <button 
                          title="Editar" 
                          onClick={() => openEditModal(event)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id)} 
                          title="Excluir"
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          <MdDelete size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-lg mb-2">📅</div>
                      <p className="text-gray-500 text-lg">Nenhum evento encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button 
            onClick={handlePreviousPage} 
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-semibold" 
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="text-sm px-6 py-3 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 font-semibold text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <button 
            onClick={handleNextPage} 
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm bg-white/95 backdrop-blur-sm hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-semibold" 
            disabled={currentPage === totalPages}
          >
            Próximo
          </button>
        </div>
      </div>
      {/* ✨ Movendo os modais para o final do componente para garantir o empilhamento correto */}
      <AddEvent
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        onEventAdded={() => fetchEvents(currentPage)}
      />
      {selectedEvent && (
        <EditEventModal
          isOpen={editModalOpen}
          onRequestClose={closeEditModal}
          event={selectedEvent}
          onEventUpdated={() => fetchEvents(currentPage)}
        />
      )}
    </div>
  );
}