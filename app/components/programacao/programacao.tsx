import React, { useState, useEffect } from "react";
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
  barId: number; // Torna o barId obrigatório
  logo: string; // Adicione a propriedade logo
  location: string; // Certifique-se de que location está definido

}

const Programacao: React.FC<ProgramacaoProps> = ({ barId, logo, location }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL || "http://localhost:3000";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json();
        console.log("Dados recebidos da API:", data);

        setEvents(data.slice(0, 9));
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      }
    };

    fetchEvents();
  }, [API_URL]);

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
      objectFit="contain" // Ajusta o comportamento da imagem
      priority // Garante carregamento rápido para imagens importantes
    />
  </div>
  <p className="text-gray-700">{location}</p>
</div>

      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Programação do Mês</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard
            key={event.id}
            img={`${API_URL}/uploads/events/${event.imagem_do_evento}`}
            title={event.nome_do_evento}
            date={new Date(event.data_do_evento).toLocaleDateString("pt-BR")}
            time={event.hora_do_evento}
            price={`R$${event.valor_da_entrada}`}
            openModal={openModal}
            eventData={event}
          />
        ))}
      </div>

      {modalIsOpen && selectedEvent && (
        <ReservationModal
          eventData={selectedEvent}
          userId={1} // Altere para o ID do usuário logado
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
