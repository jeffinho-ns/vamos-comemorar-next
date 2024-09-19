import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Para redirecionar
import styles from "./reservationModal.module.scss";
import prog from "../../../assets/banner01.webp";
import logoNew from "../../../assets/ohfregues/logoOhfregues.png";
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

  const incrementGuests = () => setGuests(guests + 1);
  const decrementGuests = () => setGuests(guests > 0 ? guests - 1 : 0);

  const handleReservation = () => {
    // Armazena os dados da reserva no localStorage
    localStorage.setItem("reservation", JSON.stringify({
      guests,
      table: selectedTable,
      date: eventDate,
      eventName,
    }));

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
            <h3 className={styles.sectionTitle}>Data / Evento</h3>
            <input
              type="date"
              className={styles.dateInput}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Nome do Evento</h3>
            <input
              type="text"
              className={styles.eventInput}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Insira o nome do evento"
            />
          </div>
        </div>
      </div>

      <div className={styles.reservationTitle}>
        Balde de cerveja ou combo de 142 Gin.
      </div>
      <div className={styles.reservationDescription}>
        - Entrada VIP para o aniversariante + acompanhante <br />
        - A partir de 15 convidados: balde com 12 long necks. <br />
        - A partir de 30 convidados: 1 COMBO de 142 Gin com água tônica, suco
        ou refrigerante. <br />
        <strong>Obs:</strong> as bonificações não são acumulativas.
      </div>

      <Image src={gin} alt="Gin 142" className={styles.gin} />

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
