import React, { useState } from "react";
import Image from "next/image";
import styles from "./programacao.module.scss";
import ReservationModal from "../reservationModal/reservationModal";
import { MdEvent, MdAccessTime } from "react-icons/md";

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

const Programacao = ({ logo, location }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState({});

  const openModal = (eventData) => {
    // Inclua a logo e a localização nos dados do evento
    setSelectedEvent({ ...eventData, logo, location });
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className={styles.programacao}>
      <h2 className={styles.sectionTitle}>Programação Oh Freguês</h2>
      <div className={styles.events}>
        <EventCard
          img={eventImg13}
          title="ENCONTRIN"
          date="28/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg2}
          title="NOITE DAS PATROAS"
          date="27/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg3}
          title="BAILE DO FREGUÊS"
          date="21/07"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg4}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg5}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg6}
          title="FESTA JUNINA"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg7}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg8}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg9}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg10}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg11}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg12}
          title="ANIVERSÁRIO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
      </div>

      {/* Modal para reserva */}
      <ReservationModal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        eventData={selectedEvent}
      />
    </div>
  );
};

const EventCard = ({ img, title, date, time, price, openModal }) => (
  <div className={styles.eventCard} onClick={() => openModal({ img, title, date, price })}>
    <Image src={img} alt={title} className={styles.eventImage} />
    <div className={styles.eventInfo}>
      <h3 className={styles.eventTitle}>{title}</h3>
      <p className={styles.eventDate}>
        <MdEvent /> {date}
      </p>
      <p className={styles.eventTime}>
        <MdAccessTime /> {time}
      </p>
      <p className={styles.eventPrice}>{price}</p>
    </div>
  </div>
);

export default Programacao;
