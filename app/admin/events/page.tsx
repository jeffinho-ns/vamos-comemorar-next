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
      setEvents(data);
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
    <div className="min-h-screen bg-[#f4f7fb] px-6 py-8">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-md w-full md:w-auto">
          Novo evento
        </button>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full md:w-[400px]">
          <input
            type="text"
            className="flex-1 px-4 py-2 text-sm outline-none bg-white"
            placeholder="Pesquisar por eventos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="bg-blue-500 p-2 px-4 text-white text-sm">🔍</button>
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center">
              <div className="text-sm text-gray-700 mb-2 md:mb-0">
                <span className="font-semibold text-[15px]">
                  {new Date(event.data_do_evento).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  {" às "}
                  {event.hora_do_evento}
                </span>{" "}
                -{" "}
                <span className="text-teal-600 hover:underline cursor-pointer font-medium">
                  {event.nome_do_evento}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 md:mt-0 flex items-center gap-1">
                📍 {event.casa_do_evento}
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-1">
              Convidados presentes: {event.convidados_presentes || 0}/0
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                Somente Listas
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/eventos/${event.id}`}>
                <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
                    Adicionar convidados
                </button>
            </Link>
              <button className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded-md">
                Ver relatórios
              </button>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Nenhum evento encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
