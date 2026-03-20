"use client";
import {
  MdAdd,
  MdRefresh,
  MdEdit,
  MdDelete,
  MdContentCopy,
} from "react-icons/md";
import { EventDataApi } from "../../types/types";
import AddEvent from "../../components/events/AddEvent";
import EditEventModal from "@/app/components/EditEvent/EditEvent";
import DuplicateEvent from "@/app/components/DuplicateEvent/DuplicateEvent";
import { useEffect, useState, useMemo } from "react";
import { useUserPermissions } from "@/app/hooks/useUserPermissions";

export default function EventsPage() {
  const [events, setEvents] = useState<EventDataApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDataApi | null>(null);
  const { isAdmin, myEstablishmentPermissions, isLoading: permissionsLoading } = useUserPermissions();

  const PAGE_SIZES = [10, 30, 50] as const;

  // Paginação independente por estabelecimento (client-side)
  const [pageSizeByEstablishment, setPageSizeByEstablishment] = useState<Record<string, number>>({});
  const [currentPageByEstablishment, setCurrentPageByEstablishment] = useState<Record<string, number>>({});

  const fetchEventsAll = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`https://vamos-comemorar-api.onrender.com/api/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) throw new Error("Erro ao buscar eventos");

      const data = await response.json();

      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setError("Dados inválidos.");
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAll();
  }, []);

  const normalizeEstablishmentName = (value?: string) =>
    (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const allowedEstablishmentIds = useMemo(
    () =>
      Array.from(
        new Set(
          myEstablishmentPermissions
            .filter((perm) => perm.is_active)
            .map((perm) => Number(perm.establishment_id))
            .filter((id) => !Number.isNaN(id))
        )
      ),
    [myEstablishmentPermissions]
  );

  const allowedEstablishmentNames = useMemo(
    () =>
      Array.from(
        new Set(
          myEstablishmentPermissions
            .filter((perm) => perm.is_active)
            .map((perm) => normalizeEstablishmentName(perm.establishment_name))
            .filter(Boolean)
        )
      ),
    [myEstablishmentPermissions]
  );

  const visibleEvents = useMemo(() => {
    if (isAdmin) return events;
    if (allowedEstablishmentIds.length === 0 && allowedEstablishmentNames.length === 0) return [];

    return events.filter((event) => {
      const eventEstablishmentId = Number(event.establishment_id ?? event.id_place);
      const eventEstablishmentName = normalizeEstablishmentName(event.casa_do_evento);

      const matchesById =
        !Number.isNaN(eventEstablishmentId) && allowedEstablishmentIds.includes(eventEstablishmentId);
      const matchesByName =
        eventEstablishmentName.length > 0 && allowedEstablishmentNames.includes(eventEstablishmentName);

      return matchesById || matchesByName;
    });
  }, [events, isAdmin, allowedEstablishmentIds, allowedEstablishmentNames]);

  const deleteEvent = async (id: number) => {
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `https://vamos-comemorar-api.onrender.com/api/events/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Erro ao excluir evento");

      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      setError("Erro ao excluir evento");
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

  const openDuplicateModal = (event: EventDataApi) => {
    setSelectedEvent(event);
    setDuplicateModalOpen(true);
  };

  const closeDuplicateModal = () => {
    setSelectedEvent(null);
    setDuplicateModalOpen(false);
  };

  // Agrupar eventos por estabelecimento (casa_do_evento)
  const eventsByEstablishment = useMemo(() => {
    const grouped: Record<string, EventDataApi[]> = {};
    visibleEvents.forEach((event) => {
      const establishment = event.casa_do_evento || "Sem estabelecimento";
      if (!grouped[establishment]) {
        grouped[establishment] = [];
      }
      grouped[establishment].push(event);
    });
    return grouped;
  }, [visibleEvents]);

  // Formata o campo do dia do evento (trata tipos e convenções 0..6 ou 1..7)
  const formatEventDay = (event: EventDataApi) => {
    if (!event.data_do_evento) return "Data não definida";
    try {
      const dateWithTime =
        event.data_do_evento.includes("T") || event.data_do_evento.includes(" ")
          ? event.data_do_evento
          : event.data_do_evento + "T12:00:00";
      return new Date(dateWithTime).toLocaleDateString("pt-BR");
    } catch (error) {
      console.error("Erro ao formatar data:", event.data_do_evento, error);
      return "Data inválida";
    }
  };

  if (loading || permissionsLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando eventos...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Gerenciar Eventos
          </h1>
          <p className="text-gray-400 text-lg">
            Visualize e gerencie todos os eventos do sistema
          </p>
        </div>

        <div className="flex items-center mb-8 gap-4">
          <button
            onClick={() => fetchEventsAll()}
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

        {/* Eventos separados por estabelecimento */}
        {Object.keys(eventsByEstablishment).length > 0 ? (
          Object.entries(eventsByEstablishment).map(
            ([establishment, establishmentEvents]) => (
              <div key={establishment} className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl">
                  <h2 className="text-2xl font-bold">{establishment}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {establishmentEvents.length} evento(s)
                  </p>
                </div>
                <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-b-2xl overflow-hidden border border-gray-200/20 border-t-0">
                  <div className="overflow-x-auto">
                    {(() => {
                      const pageSize = pageSizeByEstablishment[establishment] ?? PAGE_SIZES[0];
                      const currentPage = currentPageByEstablishment[establishment] ?? 1;
                      const totalPages = Math.max(1, Math.ceil(establishmentEvents.length / pageSize));
                      const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

                      const startIndex = (safeCurrentPage - 1) * pageSize;
                      const paginatedEvents = establishmentEvents.slice(startIndex, startIndex + pageSize);

                      return (
                        <>
                          <div className="flex flex-wrap items-center gap-3 justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Exibir</span>
                              <select
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                value={pageSize}
                                onChange={(e) => {
                                  const nextSize = Number(e.target.value);
                                  setPageSizeByEstablishment((prev) => ({
                                    ...prev,
                                    [establishment]: nextSize,
                                  }));
                                  setCurrentPageByEstablishment((prev) => ({
                                    ...prev,
                                    [establishment]: 1,
                                  }));
                                }}
                              >
                                {PAGE_SIZES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <span className="text-sm text-gray-500">por página</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setCurrentPageByEstablishment((prev) => ({
                                    ...prev,
                                    [establishment]: Math.max(1, safeCurrentPage - 1),
                                  }));
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                                disabled={safeCurrentPage === 1}
                              >
                                Anterior
                              </button>
                              <span className="text-sm font-semibold text-gray-600 px-3 py-2 border border-gray-200 rounded-lg bg-white">
                                Página {safeCurrentPage} de {totalPages}
                              </span>
                              <button
                                onClick={() => {
                                  setCurrentPageByEstablishment((prev) => ({
                                    ...prev,
                                    [establishment]: Math.min(totalPages, safeCurrentPage + 1),
                                  }));
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                                disabled={safeCurrentPage === totalPages}
                              >
                                Próximo
                              </button>
                            </div>
                          </div>

                    <table className="min-w-full text-left">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Dia do Evento
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Nome do Evento
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Local
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Brinde
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Mesas
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Categoria
                          </th>
                          <th className="px-6 py-4 font-bold text-gray-800">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedEvents.map((event) => (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              {formatEventDay(event)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-800">
                              {event.nome_do_evento}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {event.local_do_evento || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-block px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                                {event.brinde || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {event.mesas || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-block px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                                {event.categoria || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex space-x-2">
                              <button
                                title="Editar"
                                onClick={() => openEditModal(event)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                              >
                                <MdEdit size={20} />
                              </button>
                              <button
                                title="Duplicar"
                                onClick={() => openDuplicateModal(event)}
                                className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-all duration-200"
                              >
                                <MdContentCopy size={20} />
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
                        ))}
                      </tbody>
                    </table>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ),
          )
        ) : (
          <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-gray-200/20">
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-lg mb-2">📅</div>
              <p className="text-gray-500 text-lg">Nenhum evento encontrado</p>
            </div>
          </div>
        )}

      </div>
      {/* ✨ Movendo os modais para o final do componente para garantir o empilhamento correto */}
      <AddEvent
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        onEventAdded={() => fetchEventsAll()}
      />
      {selectedEvent && (
        <>
          <EditEventModal
            isOpen={editModalOpen}
            onRequestClose={closeEditModal}
            event={selectedEvent}
            onEventUpdated={() => fetchEventsAll()}
          />
          <DuplicateEvent
            isOpen={duplicateModalOpen}
            onRequestClose={closeDuplicateModal}
            event={selectedEvent}
            onEventDuplicated={() => {
              fetchEventsAll();
              closeDuplicateModal();
            }}
          />
        </>
      )}
    </div>
  );
}
