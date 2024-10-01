// reservationModal.tsx
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "react-modal";
import styles from "./reservationModal.module.scss";

interface ReservationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onRequestClose }) => {
  const [guests, setGuests] = useState(0);
  const [selectedTable, setSelectedTable] = useState("Selecionar Mesa");
  const [eventDate, setEventDate] = useState("");
  const [eventName, setEventName] = useState("");
  const router = useRouter();

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
    localStorage.setItem(
      "reservation",
      JSON.stringify({
        guests,
        table: selectedTable,
        date: eventDate,
        eventName,
      })
    );

    router.push("/webapp/minhasReservas");
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} className={styles.modalContent} overlayClassName={styles.overlay}>
      <div className={styles.header}>
        {/* Conteúdo do cabeçalho */}
      </div>
      <div className={styles.body}>
        {/* Conteúdo do corpo */}
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
    </Modal>
  );
};

export default ReservationModal;
