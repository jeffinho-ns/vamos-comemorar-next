"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import imgBanner from "../../assets/highline/capa-highline.jpeg";
import styles from "./reservas.module.scss";
import Carousel from "react-multi-carousel";
import ReservationModal from "../../webapp/components/reservationModal/reservationModal";
import defaultLogo from "@/app/assets/highline/highlinelogo.png";
import Modal from "react-modal";
import { redirect } from 'next/navigation'; // Importa a função de redirecionamento

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

const Reservas = () => {
  const [logoSrc, setLogoSrc] = useState(defaultLogo.src);
  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>(imgBanner.src); // Inicia com a URL da imagem

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      redirect('/login');
    }

    // Recupera a imagem selecionada do localStorage
    const storedImage = localStorage.getItem("selectedEventImage");
    if (storedImage) {
      setSelectedImage(storedImage); // Armazena a URL diretamente como string
    }

    // Recupera a logo armazenada no localStorage
    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo); // Atualiza a logo com a última logo armazenada
    }
  }, []);

  // Função para alterar a logo de acordo com a página
  const updateLogo = (logo: string) => {
    setLogoSrc(logo); // Atualiza a logo no estado
    localStorage.setItem("lastPageLogo", logo); // Armazena a logo no localStorage
  };

  // Função para cada página que quiser alterar a logo
  const changeLogo = () => {
    const newLogo = 'caminho/para/nova/logo.png'; // Exemplo: nova logo
    updateLogo(newLogo); // Atualiza a logo
  };

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: string) => setExpandedImage(img); // Armazena como string
  const closeImage = () => setExpandedImage(null);

  return (
    <>
      <div id="home-container" className={styles.containerMobile}>
        <HeaderLike />
        <div className={styles.bannerContainer}>
          <Image
            src={selectedImage}
            alt="Banner"
            fill
            className={styles.bannerImage}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>Nova Reserva</h1>
                <p className={styles.barDescription}>
                  Agora falta pouco para garantir a sua reserva! Basta preencher
                  os campos abaixo.
                </p>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            <ReservationModal
              isOpen={modalIsOpen}
              onRequestClose={closeModal}
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

interface SectionProps {
  title: string;
  images: string[]; // Supondo que images é um array de strings
  openImage: (img: string) => void; // Função que aceita uma string como argumento
}

const Section: React.FC<SectionProps> = ({ title, images, openImage }) => {
  return (
    <div className={styles.section}>
      <h2>{title}</h2>
      <Carousel
        responsive={responsive}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={3000}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={styles.imageContainer}
            onClick={() => openImage(image)} // Chama a função passando a URL
          >
            <Image
              src={image}
              alt={`${title} ${index + 1}`}
              className={styles.image}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};


export default Reservas;