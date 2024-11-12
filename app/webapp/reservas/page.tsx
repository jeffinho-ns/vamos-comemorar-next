"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import styles from "./reservas.module.scss";
import ReservationModal from "../../webapp/components/reservationModal/reservationModal";
import defaultLogo from "@/app/assets/highline/highlinelogo.png";
import Modal from "react-modal";

const Reservas = () => {
  const [eventData, setEventData] = useState<any>(null);
  const [logoSrc, setLogoSrc] = useState(defaultLogo.src);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    const storedEventData = localStorage.getItem("selectedEvent");
    if (storedEventData) {
      setEventData(JSON.parse(storedEventData));
    } else {
      console.log("Nenhum evento selecionado.");
    }

    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, []);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const openImage = (img: string) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  if (!eventData) return <div>Carregando...</div>;

  return (
    <>
      <div id="home-container" className={styles.containerMobile}>
        <HeaderLike />
        <div className={styles.bannerContainer}>
          {eventData.imagem_do_evento && (
            <Image
              src={`http://localhost:5000/uploads/events/${eventData.imagem_do_evento}`}
              alt="Banner"
              fill
              className={styles.bannerImage}
              unoptimized
            />
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>{eventData.nome_do_evento}</h1>
                <p className={styles.barDescription}>
                  {new Date(eventData.data_do_evento).toLocaleDateString()} - {eventData.hora_do_evento}
                </p>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            {/* Passando eventData para ReservationModal */}
            <button onClick={openModal} className={styles.openModalButton}>Abrir Reserva</button>
            <ReservationModal isOpen={modalIsOpen} onRequestClose={closeModal} eventData={eventData} />
          </div>
        </div>
      </div>
      <Footer />

      <Modal
        isOpen={!!expandedImage}
        onRequestClose={closeImage}
        contentLabel="Image Modal"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        {expandedImage && (
          <Image
            src={expandedImage}
            alt="Expanded"
            fill
            objectFit="contain"
            className={styles.expandedImage}
          />
        )}
      </Modal>
    </>
  );
};

export default Reservas;
