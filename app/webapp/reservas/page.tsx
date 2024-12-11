"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import styles from "./reservas.module.scss";

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
  const [userId, setUserId] = useState<number | null>(null);
  const [comboImage, setComboImage] = useState<string | null>(null);
  const [observacao, setObservacao] = useState<string>("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId && !isNaN(Number(storedUserId))) {
      setUserId(Number(storedUserId));
    } else {
      router.push('/login');
      return;
    }

    const storedEventData = localStorage.getItem("selectedEvent");
    if (storedEventData) {
      setEventData(JSON.parse(storedEventData));
    }

    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }
    if (eventData) {
      setComboImage(eventData.imagem_do_combo);
      setObservacao(eventData.observacao || "Sem observação.");
    }
  }, [router, eventData, API_URL]);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const openImage = (img: string) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const handleSubmitReservation = async () => {
    if (!eventData || !userId) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        openModal(); // Abre o modal após a reserva ser criada
      } else {
        alert("Erro ao criar a reserva.");
      }
    } catch (error) {
      console.error("Erro ao enviar reserva:", error);
      alert("Erro ao criar a reserva.");
    }
  };

  const handleFinalize = () => {
    closeModal();
    router.push("/webapp/minhasReservas"); // Redireciona após finalizar
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

{/* Exibição da imagem do combo e observação */}
{comboImage && (
  <div className="flex flex-col items-center mt-4">
    <div className="w-48 h-48 mb-2 rounded-lg overflow-hidden">
      <Image
        src={`${API_URL}/uploads/events/${comboImage}`}
        alt="Imagem do Combo"
        width={192}
        height={192}
        objectFit="cover"
      />
    </div>
    {observacao && (
      <p className="text-center text-sm font-medium text-gray-700 mt-2">
        {observacao}
      </p>
    )}
  </div>
)}

            <button onClick={handleSubmitReservation} className={styles.openModalButton}>
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
      <Footer />

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Confirmação de Reserva"
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
      >
        <h2 className={styles.formTitle}>Falta Pouco!</h2>
        <p>Sua reserva está sendo processada e você terá um retorno nos próximos minutos!</p>
        <button onClick={handleFinalize} className={styles.openModalButton}>
          Finalizar
        </button>
      </Modal>

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
