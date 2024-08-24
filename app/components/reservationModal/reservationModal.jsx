import React, { useState } from "react";
import Modal from "react-modal";
import Image from "next/image";
import styles from "./reservationModal.module.scss";
import prog from "../../assets/banner01.webp";
import logoNew from "../../assets/ohfregues/logoOhfregues.png";
import gin from "../../assets/programacao/gin.png";

import icon1 from "../../assets/icones/area.png";
import icon2 from "../../assets/icones/acessivel.png";
import icon3 from "../../assets/icones/estacionamento.png";
import icon4 from "../../assets/icones/18.png";
import icon5 from "../../assets/icones/mesa.png";

const ReservationModal = ({ isOpen, onRequestClose }) => {
  const [guests, setGuests] = useState(0);

  const incrementGuests = () => setGuests(guests + 1);
  const decrementGuests = () => setGuests(guests > 0 ? guests - 1 : 0);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <Image src={prog} alt="Reserva" className={styles.image} />
          <div className={styles.rightColumn}>
            <Image src={logoNew} alt="Logo" className={styles.logo} />
            <p className={styles.address}>
              Largo da Matriz Nossa Senhora do Ó, 145
            </p>
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
                <Image
                  src={icon3}
                  width={40}
                  height={40}
                  alt="Estacionamento"
                />
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
              <span className={styles.sectionIcon}>👥</span>
              <h3 className={styles.sectionTitle}>Convidados</h3>
              <div className={styles.counter}>
                <button
                  onClick={decrementGuests}
                  className={styles.counterButton}
                >
                  -
                </button>
                <span className={styles.counterValue}>{guests}</span>
                <button
                  onClick={incrementGuests}
                  className={styles.counterButton}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🪑</span>
              <h3 className={styles.sectionTitle}>Mesas</h3>
              <div className={styles.priceContainer}>
                <select className={styles.select}>
                  <option value="1">Selecionar Mesa</option>
                  {/* Adicione mais opções conforme necessário */}
                </select>
                <p className={styles.priceInfo}>R$ 800 / consome R$ 600</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📅</span>
              <h3 className={styles.sectionTitle}>Data / Evento</h3>
              <input type="date" className={styles.dateInput} />
            </div>
          </div>
          
        </div>
        <div className={styles.reservationTitle}>Balde de cerveja ou combo de 142 Gin.</div>
          <div className={styles.reservationDescription}>- Entrada VIP para o aniversariante + acompanhante - A partir de 15 convidados: balde com 12 long necks. - 
A partir de 30 convidados: 1 COMBO de 142 Gin com água tônica, suco ou refrigerante. 
Obs: as bonificações não são acumulativas.
</div>

<Image src={gin} alt="Gin 142" className={styles.gin} />

        <div className={styles.footer}>
          <button onClick={onRequestClose} className={styles.reserveButton}>
            Solicitar Reserva
          </button>
          <p className={styles.disclaimer}>
            * O estabelecimento não garante que todos os convidados terão
            assentos e a exata localização da mesa.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationModal;