import React, { useState } from "react";

import ReservationModal from "../reservationModal/reservationModal";
import { MdEvent, MdAccessTime } from "react-icons/md";
import Image, { StaticImageData } from "next/image";

// Importação das imagens
import eventImg1 from "@/app/assets/programacao/prog-1.png";
import eventImg2 from "@/app/assets/programacao/prog-2.png";
import eventImg3 from "@/app/assets/programacao/prog-3.png";
import eventImg4 from "@/app/assets/programacao/prog-4.png";
import eventImg5 from "@/app/assets/programacao/prog-5.png";
import eventImg6 from "@/app/assets/programacao/prog-6.png";
import eventImg7 from "@/app/assets/programacao/prog-7.png";
import eventImg8 from "@/app/assets/programacao/prog-8.png";
import eventImg9 from "@/app/assets/programacao/prog-9.png";
import eventImg10 from "@/app/assets/programacao/prog-10.png";
import eventImg11 from "@/app/assets/programacao/prog-11.png";
import eventImg12 from "@/app/assets/programacao/prog-12.png";
import eventImg13 from "../../assets/programacao/prog-13.png";

interface EventData {
  img: string;
  title: string;
  date: string;
  time: string;
  price: string;
  logo?: string | StaticImageData;
  location?: string;
}

interface ProgramacaoProps {
  barId?: number;
  logo: string;
  location: string;
}

const Programacao: React.FC<ProgramacaoProps> = ({ barId, logo, location }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const openModal = (eventData: EventData) => {
    setSelectedEvent({ ...eventData, logo: logo, location });
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Programação do Mês</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <EventCard
          img={eventImg13.src}  // Use .src para pegar a URL da imagem
          title="ENCONTRIN"
          date="28/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg2.src}  // Use .src para pegar a URL da imagem
          title="NOITE DAS PATROAS"
          date="27/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg3.src}  // Use .src para pegar a URL da imagem
          title="BAILE DO FREGUÊS"
          date="21/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg4.src}  // Use .src para pegar a URL da imagem
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        {/* Adicione mais EventCards conforme necessário */}
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
}

const EventCard: React.FC<EventCardProps> = ({ img, title, date, time, price, openModal }) => (
  <div
    className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105"
    onClick={() => openModal({ img, title, date, time, price })}
  >
    <div className="relative h-64">
      <Image src={img} alt={title} className="w-full h-full object-cover" />
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
