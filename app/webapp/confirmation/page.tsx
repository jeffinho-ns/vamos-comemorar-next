"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent } from "react-icons/md";
import Footer from "../components/footer/footer";
import Header from "../components/headerNotificatioin/headerNotification";
import imgBanner from "../../assets/highline/capa-highline.jpeg";
import Link from "next/link";
import styles from "./confirmation.module.scss";
import Carousel from "react-multi-carousel";

import defaultLogo from "@/app/assets/highline/highlinelogo.png";
import Modal from "react-modal";
import { redirect } from "next/navigation"; // Aqui importa a função de redirecionamento

// Define a interface para as propriedades do componente Section
interface SectionProps {
  title: string;
  images: StaticImageData[]; // Ajuste para StaticImageData
  openImage: (img: StaticImageData) => void; // Ajuste para StaticImageData
}

const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 3,
    slidesToSlide: 3,
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 2,
    slidesToSlide: 2,
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1,
    slidesToSlide: 1,
  },
};

const Confirmation = () => {
  const [logoSrc, setLogoSrc] = useState(defaultLogo.src); // Usa a logo padrão inicialmente
  const [reservationData, setReservationData] = useState<{
    eventName: string;
    date: string;
    table: string;
    guests: number;
  } | null>(null); // Estado para armazenar os dados da reserva

  useEffect(() => {
    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo); // Atualiza a logo com a última logo armazenada
    }

    // Recuperar os dados da reserva do localStorage
    const reservation = localStorage.getItem("reservation");
    if (reservation) {
      setReservationData(JSON.parse(reservation));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // Se não houver token, redireciona para a página de login
    if (!token) {
      redirect("/login");
    }
  }, []);

  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
  const [selectedImage, setSelectedImage] = useState(imgBanner);

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: StaticImageData) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const handleCancelReservation = () => {
    // Apagar os dados da reserva no localStorage
    localStorage.removeItem("reservation");
  
    // Exibir mensagem de popup
    alert("Sua reserva foi cancelada.");
  
    // Recarregar a página
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div id="home-container" className="container-mobile flex-grow">
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <h2 className={styles.title}>Reservas</h2>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>Detalhes da reserva</h1>
                <p className={styles.barDescription}>
                  Sua reserva está aprovada! Basta apresentar o QR code na entrada.
                </p>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            {/* Exibindo os detalhes da reserva */}
            {reservationData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Pessoas</span>
                  <span className="font-bold text-gray-700">{reservationData.guests} Pessoas</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Mesas</span>
                  <span className="font-bold text-gray-700">{reservationData.table}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Data</span>
                  <span className="font-bold text-gray-700">{reservationData.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Evento</span>
                  <span className="font-bold text-gray-700">{reservationData.eventName}</span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center my-8">
                  <img
                    src="https://via.placeholder.com/150" // Substitua pela URL real do QR Code
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>

                {/* Botão Cancelar Reserva */}
                <div className="flex justify-center">
                  <button 
                    className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700"
                    onClick={() => handleCancelReservation()}
                  >
                    Cancelar Reserva
                  </button>
                </div>
              </div>
            ) : (
              <p>Carregando detalhes da reserva...</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footerContainer}>
        <Footer />
      </div>
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
            layout="fill"
            objectFit="contain"
            className={styles.expandedImage}
          />
        )}
      </Modal>
    </div>
  );
};

export default Confirmation;
