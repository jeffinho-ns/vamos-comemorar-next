import React, { useState, useEffect, useCallback } from "react";
import ReservationModal from "../reservationModal/reservationModal";
import { MdEvent, MdAccessTime } from "react-icons/md";
import Image from "next/image";

interface EventData {
  id: number;
  casa_do_evento: string;
  nome_do_evento: string;
  data_do_evento: string;
  hora_do_evento: string;
  valor_da_entrada: string;
  imagem_do_evento: string;
  local_do_evento: string;
}

interface ProgramacaoProps {
  barId: number;
  logo: string;
  location: string;
  establishmentName: string; // Adicionando o nome do estabelecimento
}

const Programacao: React.FC<ProgramacaoProps> = ({ barId, logo, location, establishmentName }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || "http://localhost:3000";
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

  // Mapeamento de estabelecimentos para nomes na API
  const establishmentNameMap = useCallback((): Record<string, string> => ({
    "High Line": "High Line",
    "Seu Justino": "Seu Justino",
    "Oh Freguês": "Oh Freguês",
    "Pracinha": "Pracinha do Seu Justino",
    "Reserva Rooftop": "Reserva Rooftop"
  }), []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json();
        console.log("Dados recebidos da API:", data);

        // Filtrar eventos por estabelecimento
        const filteredEvents = data.filter((event: EventData) => {
          const eventEstablishment = event.casa_do_evento;
          const targetEstablishment = establishmentNameMap()[establishmentName] || establishmentName;
          return eventEstablishment === targetEstablishment;
        });

        console.log(`Eventos filtrados para ${establishmentName}:`, filteredEvents);
        setEvents(filteredEvents.slice(0, 9));
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [API_URL, establishmentName, establishmentNameMap]);

  const openModal = (eventData: EventData) => {
    setSelectedEvent(eventData);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100">
      {/* Exibe a logo e o endereço */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative h-16 w-16">
          <Image
            src={logo}
            alt="Logo"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>
        <p className="text-gray-700">{location}</p>
      </div>

      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Programação de Eventos</h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-500">Não há eventos programados para este estabelecimento no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard
              key={event.id}
              img={`${BASE_IMAGE_URL}${event.imagem_do_evento}`}
              title={event.nome_do_evento}
              date={new Date(event.data_do_evento).toLocaleDateString("pt-BR")}
              time={event.hora_do_evento}
              price={`R$${event.valor_da_entrada}`}
              openModal={openModal}
              eventData={event}
            />
          ))}
        </div>
      )}

      {modalIsOpen && selectedEvent && (
        <ReservationModal
          eventData={selectedEvent}
          userId={1}
          API_URL={API_URL}
          onClose={closeModal}
        />
      )}
    </div>
  );
};


interface EventCardProps {
  img: string;
  title: string;
  date: string;
  time: string;
  price: string;
  openModal: (eventData: EventData) => void;
  eventData: EventData;
}

const EventCard: React.FC<EventCardProps> = ({ img, title, date, time, price, openModal, eventData }) => (
  <div
    className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105"
    onClick={() => openModal(eventData)}
  >
    <div className="relative h-64 w-full">
      <Image
        src={img}
        alt={title}
        layout="fill"
        className="rounded-t-lg object-cover"
        unoptimized
      />
    </div>
    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="flex items-center text-sm mb-2">
        <MdEvent className="mr-2" />
        {date}
      </div>
      <div className="flex items-center text-sm">
        <MdAccessTime className="mr-2" />
        {time}
      </div>
      <p className="mt-2 text-lg font-bold">{price}</p>
    </div>
  </div>
);

export default Programacao;
