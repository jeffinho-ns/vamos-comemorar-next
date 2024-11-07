import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./programacao.module.scss";
import { MdAccessTime } from "react-icons/md";
import Link from "next/link";

// Interface para o tipo de dados do evento
interface EventData {
  id: number;
  nome_do_evento: string;
  data_do_evento: string;
  hora_do_evento: string;
  valor_da_entrada: string;
  imagem_do_evento: string;
}

const Programacao = () => {
  const [events, setEvents] = useState<EventData[]>([]);

  // Efeito para buscar os eventos ao carregar a página
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

  // Função para salvar os dados do evento no localStorage ao clicar
  const handleEventClick = (event: EventData) => {
    localStorage.setItem("selectedEvent", JSON.stringify(event)); // Salva os dados do evento no localStorage
  };

  return (
    <div className={styles.programacao}>
      <h2 className={styles.sectionTitle}>Programação da semana</h2>
      <div className={styles.events}>
        {events.map((event) => (
          <Link key={event.id} href="/webapp/reservas">
            <div onClick={() => handleEventClick(event)}>
              <EventCard
                img={`http://localhost:5000/uploads/events/${event.imagem_do_evento}`}
                title={event.nome_do_evento}
                date={new Date(event.data_do_evento).toLocaleDateString("pt-BR")}
                time={event.hora_do_evento}
                price={`R$${event.valor_da_entrada}`}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const EventCard = ({ img, title, date, time, price }: { img: string; title: string; date: string; time: string; price: string }) => (
  <div className={styles.eventCard}>
    <div className={styles.dateDotLine}>
      <div className={styles.dotLine}></div>
      <p className={styles.eventDate}>{date}</p>
    </div>
    <div className={styles.eventContent}>
      <Image src={img} alt={title} className={styles.eventImage} width={500} height={300} unoptimized />
      <div className={styles.eventDetails}>
        <h3 className={styles.eventTitle}>{title}</h3>
        <div className={styles.eventTimeContainer}>
          <MdAccessTime className={styles.icon} />
          <p className={styles.eventTime}>{time}</p>
        </div>
        <p className={styles.eventPrice}>{price}</p>
      </div>
    </div>
  </div>
);

export default Programacao;
