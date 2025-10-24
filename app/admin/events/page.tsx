"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdAdd } from "react-icons/md";

interface Event {
  id: number;
  nome_do_evento: string;
  casa_do_evento: string;
  data_do_evento: string;
  hora_do_evento: string;
  convidados_presentes?: number;
  total_convidados?: number;
}

export default function Eventos() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");

  const fetchEvents = async () => {
    const token = localStorage.getItem("authToken");
  
    try {
      const res = await fetch("https://vamos-comemorar-api.onrender.com/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
  
      // Para cada evento, buscar os convidados e contar
      const eventsWithConvidados = await Promise.all(
        data.map(async (event: Event) => {
          try {
            const convidadosRes = await fetch(
              `https://vamos-comemorar-api.onrender.com/api/convidados/${event.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const convidados = await convidadosRes.json();
            return {
              ...event,
              total_convidados: convidados.length,
            };
          } catch (err) {
            console.error("Erro ao buscar convidados para o evento", event.id, err);
            return { ...event, total_convidados: 0 };
          }
        })
      );
  
      setEvents(eventsWithConvidados);
    } catch (err) {
      console.error("Erro ao buscar eventos", err);
    }
  };
  

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) =>
    event.nome_do_evento.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gerenciar Eventos</h1>
          <p className="text-gray-400 text-lg">Visualize e gerencie todos os eventos do sistema</p>
        </div>

        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 text-sm font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 w-full md:w-auto flex items-center justify-center gap-2">
            <MdAdd size={20} /> Novo evento
          </button>
          <div className="flex items-center border border-gray-200/30 rounded-xl overflow-hidden w-full md:w-[400px] bg-white/95 backdrop-blur-sm shadow-lg">
            <input
              type="text"
              className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
              placeholder="Pesquisar por eventos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 px-4 text-gray-900 text-sm font-semibold">🔍</button>
          </div>
        </div>

        {/* Event list */}
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-gray-200/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4">
                <div className="text-base text-gray-700 mb-3 md:mb-0">
                  <span className="font-bold text-lg text-gray-800">
                    {(() => {
                      try {
                        // Adiciona T12:00:00 para evitar problemas de timezone
                        const dateWithTime = event.data_do_evento.includes('T') || event.data_do_evento.includes(' ')
                          ? event.data_do_evento
                          : event.data_do_evento + 'T12:00:00';
                        const date = new Date(dateWithTime);
                        return date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        });
                      } catch (error) {
                        console.error('Erro ao formatar data:', event.data_do_evento, error);
                        return 'Data inválida';
                      }
                    })()}
                    {" às "}
                    {event.hora_do_evento}
                  </span>{" "}
                  -{" "}
                  <span className="text-yellow-600 hover:text-yellow-700 cursor-pointer font-bold text-lg">
                    {event.nome_do_evento}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1 md:mt-0 flex items-center gap-2">
                  📍 {event.casa_do_evento}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50/80 rounded-xl">
                <span className="font-semibold text-gray-700">Convidados presentes:</span> {event.convidados_presentes || 0}/{event.total_convidados || 0}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold px-3 py-2 rounded-xl">
                  Somente Listas
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/eventos/${event.id}`}>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
                    Adicionar convidados
                  </button>
                </Link>
                <button className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white text-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
                  Ver relatórios
                </button>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📅</div>
              <p className="text-gray-500 text-lg">Nenhum evento encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
