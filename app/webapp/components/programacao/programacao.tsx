import React from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./programacao.module.scss";
import { MdAccessTime } from "react-icons/md";
import Link from "next/link";

import eventImg1 from "@/app/assets/programacao/prog-1.png";
import eventImg2 from "@/app/assets/programacao/prog-2.png";
import eventImg3 from "@/app/assets/programacao/prog-3.png";
import eventImg4 from "@/app/assets/programacao/prog-4.png";
import eventImg5 from "@/app/assets/programacao/prog-5.png";
import eventImg6 from "@/app/assets/programacao/prog-13.png";

const Programacao = () => {
  // Tipando os parâmetros da função handleCardClick
  const handleCardClick = (img: StaticImageData, title: string, date: string) => {
    console.log("Armazenando imagem:", img.src);
    localStorage.setItem("selectedEventImage", img.src);
    localStorage.setItem("selectedEventTitle", title);
    localStorage.setItem("selectedEventDate", date); // Armazena a data do evento
  };

  return (
    <div className={styles.programacao}>
      <h2 className={styles.sectionTitle}>Programação da semana</h2>
      <div className={styles.events}>
        <Link
          href="/webapp/reservas"
          onClick={() => handleCardClick(eventImg6, "Festa Encontrin", "15 Jan 2022")}
        >
          <EventCard
            img={eventImg6}
            title="Festa Encontrin"
            category="Pagode"
            date="15 Jan 2022"
            time="20h"
          />
        </Link>
        <Link
          href="/webapp/reservas"
          onClick={() => handleCardClick(eventImg2, "Feijoada", "15 Jan 2022")}
        >
          <EventCard
            img={eventImg2}
            title="Feijoada"
            category="Alimentação"
            date="15 Jan 2022"
            time="12h"
          />
        </Link>
        <Link
          href="/webapp/reservas"
          onClick={() => handleCardClick(eventImg3, "Double GIN", "15 Jan 2024")}
        >
          <EventCard
            img={eventImg3}
            title="Double GIN"
            category="Bebida"
            date="15 Jan 2024"
            time="17h"
          />
        </Link>
        <Link
          href="/webapp/reservas"
          onClick={() => handleCardClick(eventImg4, "Double CHOPP", "15 Jan 2024")}
        >
          <EventCard
            img={eventImg4}
            title="Double CHOPP"
            category="Pagode"
            date="15 Jan 2024"
            time="20h"
          />
        </Link>
        <Link
          href="/webapp/reservas"
          onClick={() => handleCardClick(eventImg5, "Dj KVSH", "15 Jan 2024")}
        >
          <EventCard
            img={eventImg5}
            title="Dj KVSH"
            category="Pagode"
            date="15 Jan 2024"
            time="20h"
          />
        </Link>
      </div>
    </div>
  );
};

const EventCard = ({ img, title, category, date, time }: { img: StaticImageData; title: string; category: string; date: string; time: string; }) => (
  <div className={styles.eventCard}>
    <div className={styles.dateDotLine}>
      <div className={styles.dotLine}></div>
      <p className={styles.eventDate}>{date}</p>
    </div>
    <div className={styles.eventContent}>
      <Image src={img} alt={title} className={styles.eventImage} />
      <div className={styles.eventDetails}>
        <h3 className={styles.eventTitle}>{title}</h3>
        <p className={styles.eventCategory}>{category}</p>
        <div className={styles.eventTimeContainer}>
          <MdAccessTime className={styles.icon} />
          <p className={styles.eventTime}>{time}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Programacao;
