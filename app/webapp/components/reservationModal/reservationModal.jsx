import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./reservationModal.module.scss";
import gin from "../../../assets/programacao/gin.png";

import icon1 from "../../../assets/icones/area.png";
import icon2 from "../../../assets/icones/acessivel.png";
import icon3 from "../../../assets/icones/estacionamento.png";
import icon4 from "../../../assets/icones/18.png";
import icon5 from "../../../assets/icones/mesa.png";

const ReservationModal = () => {
  const [guests, setGuests] = useState(0);
  const [selectedTable, setSelectedTable] = useState("Selecionar Mesa");
  const [eventDate, setEventDate] = useState("");
  const [eventName, setEventName] = useState("");
  const router = useRouter();

  // Recupera o nome e a data do evento do localStorage ao montar o componente
  useEffect(() => {
    const savedEventName = localStorage.getItem("selectedEventTitle");
    const savedEventDate = localStorage.getItem("selectedEventDate");
    if (savedEventName) {
      setEventName(savedEventName);
    }
    if (savedEventDate) {
      setEventDate(savedEventDate);
    }
  }, []);

  const incrementGuests = () => setGuests(guests + 1);
  const decrementGuests = () => setGuests(guests > 0 ? guests - 1 : 0);

  const handleReservation = () => {
    // Armazena os dados da reserva no localStorage
    localStorage.setItem(
      "reservation",
      JSON.stringify({
        guests,
        table: selectedTable,
        date: eventDate,
        eventName,
      })
    );

    // Redireciona para a página de reservas
    router.push("/webapp/minhasReservas");
  };

  return (
    <div className={`${styles.modalContent} mobile-only`}>
      <div className={styles.header}>
        <div className={styles.rightColumn}>
          <div className={styles.iconContainer}>
            <div className={styles.iconItem}>
              <Image src={icon1} width={40} height={40} alt="Área aberta" />
              <p className={styles.iconTitle}>Área aberta</p>
            </div>
            <div className={styles.iconItem}>
              <Image src={icon2} width={40} height={40} alt="Acessível" />
              <p className={styles.iconTitle}>Acessível</p>
            </div>
            <div className={styles.iconItem}>
              <Image src={icon3} width={40} height={40} alt="Estacionamento" />
              <p className={styles.iconTitle}>Estacionamento</p>
            </div>
            <div className={styles.iconItem}>
              <Image src={icon4} width={40} height={40} alt="+18" />
              <p className={styles.iconTitle}>+18</p>
            </div>
            <div className={styles.iconItem}>
              <Image src={icon5} width={40} height={40} alt="Mesas" />
              <p className={styles.iconTitle}>Mesas</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Convidados</h3>
            <div className={styles.counter}>
              <button onClick={decrementGuests} className={styles.counterButton}>
                -
              </button>
              <span className={styles.counterValue}>{guests}</span>
              <button onClick={incrementGuests} className={styles.counterButton}>
                +
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Mesas</h3>
            <div className={styles.priceContainer}>
              <select
                className={styles.select}
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="Selecionar Mesa">Selecionar Mesa</option>
                <option value="Bistro">Bistro</option>
                <option value="Salão central">Salão central</option>
                <option value="Área externa">Área externa</option>
              </select>
              <p className={styles.priceInfo}>R$ 800 / consome R$ 600</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Data do Evento</h3>
            <p className={styles.eventDateDisplay}>{eventDate || "Data não disponível"}</p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
           
            <p className={styles.eventInput}>{eventName}</p>
          </div>
          
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={handleReservation} className={styles.reserveButton}>
          Solicitar Reserva
        </button>
        <p className={styles.disclaimer}>
          * O estabelecimento não garante que todos os convidados terão assentos
          e a exata localização da mesa.
        </p>
      </div>
    </div>
  );
};

export default ReservationModal;
