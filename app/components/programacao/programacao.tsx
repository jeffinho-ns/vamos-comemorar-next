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
  barId?: number;
  logo: string;
  location: string;
}

const Programacao: React.FC<ProgramacaoProps> = ({ barId, logo, location }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/events");
        const data = await response.json();
        setEvents(data.slice(0, 9)); // Limita a quantidade de eventos a 9
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      }
    };

    fetchEvents();
  }, []);

  const openModal = (eventData: EventData) => {
    setSelectedEvent({ ...eventData, logo, location });
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Programação do Mês</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard
            key={event.id}
            img={`http://localhost:5000/uploads/events/${event.imagem_do_evento}`}
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
          isOpen={modalIsOpen} 
          onRequestClose={closeModal} 
          eventData={selectedEvent}  
          logo={selectedEvent.logo}  
          location={selectedEvent.location}  
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
      {/* Removendo objectFit e usando CSS para cobrir a imagem */}
      <Image
  src={img}
  alt={title}
  layout="fill"
  className="rounded-t-lg object-cover"
  unoptimized // Desativa a otimização de imagem
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
