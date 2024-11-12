import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./reservationModal.module.scss";
import icon1 from "../../../assets/icones/area.png";
import icon2 from "../../../assets/icones/acessivel.png";
import icon3 from "../../../assets/icones/estacionamento.png";
import icon4 from "../../../assets/icones/18.png";
import icon5 from "../../../assets/icones/mesa.png";

interface ReservationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  eventData: {
    data_do_evento: string;
    nome_do_evento: string;
    valor_entrada: string;
  } | null;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onRequestClose, eventData }) => {
  const [guests, setGuests] = useState(0);
  const [selectedTable, setSelectedTable] = useState("Selecionar Mesa");
  const router = useRouter();

  if (!isOpen || !eventData) return null; // Retorna nulo se o modal estiver fechado ou sem dados

  const incrementGuests = () => setGuests(guests + 1);
  const decrementGuests = () => setGuests(guests > 0 ? guests - 1 : 0);

  const handleReservation = () => {
    localStorage.setItem(
      "reservation",
      JSON.stringify({
        guests,
        table: selectedTable,
        date: eventData.data_do_evento,
        eventName: eventData.nome_do_evento,
      })
    );
    router.push("/webapp/minhasReservas");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Reservation Modal"
      className={styles.modalContent}
      overlayClassName={styles.overlay}
    >
      <div className={styles.header}>
        <h2>Reserva para {eventData.nome_do_evento}</h2>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <h3>Data do Evento</h3>
          <p>{new Date(eventData.data_do_evento).toLocaleDateString()}</p>
        </div>

        <div className={styles.section}>
          <h3>Valor da Entrada</h3>
          <p>{eventData.valor_entrada || "Valor não disponível"}</p>
        </div>

        <div className={styles.section}>
          <h3>Convidados</h3>
          <div className={styles.counter}>
            <button onClick={decrementGuests}>-</button>
            <span>{guests}</span>
            <button onClick={incrementGuests}>+</button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={handleReservation}>Solicitar Reserva</button>
        <button onClick={onRequestClose}>Fechar</button>
      </div>
    </Modal>
  );
};

export default ReservationModal;
