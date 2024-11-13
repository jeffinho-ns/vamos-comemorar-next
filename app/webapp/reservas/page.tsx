"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import styles from "./reservas.module.scss";
import ReservationModal from "../../webapp/components/reservationModal/reservationModal";
import defaultLogo from "@/app/assets/highline/highlinelogo.png";
import Modal from "react-modal";
import { useRouter } from 'next/navigation';

const Reservas = () => {
  const [eventData, setEventData] = useState<any>(null);
  const [logoSrc, setLogoSrc] = useState(defaultLogo.src);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [mesas, setMesas] = useState("1 Mesa / 6 cadeiras");
  const [userId, setUserId] = useState<number | null>(null); // Novo estado para userId
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const router = useRouter(); // Instancia o router para redirecionamento

  useEffect(() => {
    // Recupera o ID do usuário do localStorage
    const storedUserId = localStorage.getItem("userId");
    console.log("ID armazenado no localStorage:", storedUserId);

    if (storedUserId && !isNaN(Number(storedUserId))) {
      setUserId(Number(storedUserId));
      console.log("User ID carregado:", storedUserId);
    } else {
      console.log("Usuário não logado ou ID não encontrado no localStorage.");
      // Redireciona para a página de login
      router.push('/login'); // Utiliza o router para redirecionar
      return; // Evita a renderização da página de reservas
    }

    const storedEventData = localStorage.getItem("selectedEvent");
    if (storedEventData) {
      setEventData(JSON.parse(storedEventData));
      console.log("Dados do evento carregados:", JSON.parse(storedEventData));
    } else {
      console.log("Nenhum evento selecionado.");
    }

    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
  }, [router]); // Adiciona o router como dependência para garantir que o redirecionamento seja feito

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const openImage = (img: string) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const handleSubmitReservation = async () => {
    if (!eventData || !userId) {
      console.error("Dados ausentes: eventData ou userId");
      alert("Dados do evento ou do usuário estão ausentes.");
      return;
    }

    const reservationData = {
      userId,
      eventId: eventData.id,
      quantidade_pessoas: quantidadePessoas,
      mesas,
      data_da_reserva: new Date().toISOString().split("T")[0],
      casa_da_reserva: eventData.casa_do_evento,
    };

    try {
      const response = await fetch(`${API_URL}/api/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        alert("Reserva criada com sucesso!");
        // Redirecionar ou atualizar a página se necessário
    } else {
        alert("Erro ao criar a reserva.");
    }
    } catch (error) {
      console.error("Erro ao enviar reserva:", error);
      alert("Erro ao criar a reserva.");
    }
  };

  if (!eventData) return <div>Carregando...</div>;

  return (
    <>
      <div id="home-container" className={styles.containerMobile}>
        <HeaderLike />
        <div className={styles.bannerContainer}>
          {eventData.imagem_do_evento && (
            <Image
              src={`${API_URL}/uploads/events/${eventData.imagem_do_evento}`}
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
                <h1 className={styles.formTitle}>Nova Reserva</h1>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>
            <p className={styles.formSubtitle}>
              Agora falta pouco para garantir a sua reserva! Basta preencher os campos abaixo.
            </p>

            <div className={styles.formGroup}>
              <label>Pessoas</label>
              <select
                value={quantidadePessoas}
                onChange={(e) => setQuantidadePessoas(Number(e.target.value))}
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} Pessoa{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Mesas</label>
              <select
                value={mesas}
                onChange={(e) => setMesas(e.target.value)}
              >
                {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={`${num} Mesa${num > 1 ? "s" : ""} / ${num * 6} cadeiras`}>
                    {num} Mesa{num > 1 ? "s" : ""} / {num * 6} cadeiras
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Data</label>
              <span>{new Date(eventData.data_do_evento).toLocaleDateString()}</span>
            </div>

            <div className={styles.formGroup}>
              <label>Evento</label>
              <span>{eventData.nome_do_evento}</span>
            </div>

            <button onClick={handleSubmitReservation} className={styles.submitButton}>
              Confirmar Reserva
            </button>

            <button onClick={openModal} className={styles.openModalButton}>Abrir Reserva</button>
            <ReservationModal 
              isOpen={modalIsOpen} 
              onRequestClose={closeModal} 
              eventId={eventData.id}
            />
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
