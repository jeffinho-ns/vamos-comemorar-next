import React, { useState } from "react";
import Image from "next/image";
import styles from "./programacao.module.scss";
import ReservationModal from "../reservationModal/reservationModal";
import { MdEvent, MdAccessTime } from "react-icons/md";

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

const Programacao = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => {
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
          img={eventImg1}
          title="FINAL CHAMPIONS"
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
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg7}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg8}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg9}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg10}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg11}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        <EventCard
          img={eventImg12}
          title="COPA DO MUNDO"
          date="Hoje"
          time="17h"
          price="R$50"
          openModal={openModal}
        />
        {/* Adicione mais EventCard conforme necessário */}
      </div>
      <ReservationModal isOpen={modalIsOpen} onRequestClose={closeModal} />
    </div>
  );
};

const EventCard = ({ img, title, date, time, price, openModal }) => (
  <div className={`${styles.eventCard} ${styles.programacao_eventCard__I6H_Z}`}>
    <Image src={img} alt={title} className={styles.eventImage} />
    <div
      className={`${styles.eventDetails} ${styles.programacao_eventDetails___ATug}`}
    >
      <h3
        className={`${styles.eventTitle} ${styles.programacao_eventTitle__nsBOZ}`}
      >
        {title}
      </h3>
      <div className={styles.eventDateTime}>
        <div className={styles.dateTimeContainer}>
          <MdEvent className={styles.icon} />
          <p className={styles.eventDate}>{date}</p>
        </div>
        <div className={styles.dateTimeContainer}>
          <MdAccessTime className={styles.icon} />
          <p className={styles.eventTime}>{time}</p>
        </div>
      </div>
      <p className={styles.eventPrice}>Entrada {price}</p>
      <button className={styles.reserveButton} onClick={openModal}>
        Fazer reserva
      </button>
    </div>
  </div>
);

export default Programacao;
