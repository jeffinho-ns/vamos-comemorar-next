"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent } from "react-icons/md";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import imgBanner from "../../assets/justino/capa-justino.png";
import "react-multi-carousel/lib/styles.css";
import styles from "./justino.module.scss";
import Programacao from "../components/programacao/programacao";
import Profile from "../components/profile/profile";
import Carousel from "react-multi-carousel";

import { useRouter } from "next/navigation"; // Para o redirecionamento

import newImg1 from "@/app/assets/justino/ambiente-1.jpeg";
import newImg2 from "@/app/assets/justino/ambiente-2.jpeg";
import newImg3 from "@/app/assets/justino/ambiente-3.jpeg";
import newImg4 from "@/app/assets/justino/ambiente-4.jpeg";

import bebida1 from "@/app/assets/justino/bebida-1.jpeg";
import bebida2 from "@/app/assets/justino/bebida-2.jpeg";
import bebida3 from "@/app/assets/justino/bebida-3.jpeg";
import bebida4 from "@/app/assets/justino/bebida-4.jpeg";

import gastro1 from "@/app/assets/justino/gastronomia-1.jpeg";
import gastro2 from "@/app/assets/justino/gastronomia-2.jpeg";
import gastro3 from "@/app/assets/justino/gastronomia-3.jpeg";
import gastro4 from "@/app/assets/justino/gastronomia-4.jpeg";
import logoNew from "@/app/assets/justino/justinologo.png";

import icon1 from "@/app/assets/icones/area.png";
import icon2 from "@/app/assets/icones/acessivel.png";
import icon3 from "@/app/assets/icones/estacionamento.png";
import icon4 from "@/app/assets/icones/18.png";
import icon5 from "@/app/assets/icones/mesa.png";

import Modal from "../../components/ui/Modal";

import { redirect } from 'next/navigation';

interface SectionProps {
  title: string;
  images: StaticImageData[]; // Ajuste para StaticImageData
  openImage: (img: StaticImageData) => void; // Ajuste para StaticImageData
}

const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 3,
    slidesToSlide: 3, // Number of slides to scroll on each swipe
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

const Justino = () => {

  useEffect(() => {
    // Armazena a URL da logo no localStorage
    localStorage.setItem("lastPageLogo", logoNew.src);
    localStorage.setItem("lastPageBanner", imgBanner.src);
  }, []);

  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
  const router = useRouter(); // Hook para redirecionar


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // Se não houver token, redireciona para a página de login
    if (!token) {
      redirect('/login');
    }
  }, []);

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: StaticImageData) => setExpandedImage(img); // Ajuste para StaticImageData
  const closeImage = () => setExpandedImage(null);


  return (
    <>
      <div id="home-container" className={styles.containerMobile}>
        <HeaderLike />
        <div className={styles.bannerContainer}>
          <Image
            src={imgBanner}
            alt="Banner"
            fill
            className={styles.bannerImage}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>Seu Justino</h1>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoNew} alt="Logo" width={200} height={200} />
                </div>
              </div>
            </div>
            <div className={styles.flexButtonContainer}>
              <div className={styles.flexButtonContainerBar}>
                <button
                  className={styles.button}
                  onClick={() => toggleContent("sobre")}
                >
                  <MdInfoOutline className={styles.icon} />
                  <span>Sobre</span>
                </button>
                <button
                  className={styles.button}
                  onClick={() => toggleContent("eventos")}
                >
                  <MdEvent className={styles.icon} />
                  <span>Eventos</span>
                </button>
                <button
                  className={styles.button}
                  onClick={() => toggleContent("Reviews")}
                >
                  <MdEvent className={styles.icon} />
                  <span>Reviews</span>
                </button>
              </div>
            </div>

            <Profile isOpen={modalIsOpen} onRequestClose={closeModal} />
          </div>

          <p className={styles.barDescription}>
            O bar Seu Justino oferece uma experiência única de interação com o
            público, é um ponto de encontro moderno entre os jovens e adultos,
            um lugar perfeito para happy hour, aniversários ou eventos
            corporativos.
          </p>

          {!showDescription && (
            <div className={styles.programacao}>
              <Programacao />
            </div>
          )}

          <div className={styles.sections}>
            {showDescription && (
              <>
                <Section
                  title="Ambientes"
                  images={[newImg1, newImg2, newImg3, newImg4]}
                  openImage={openImage}
                />
                <Section
                  title="Gastronomia"
                  images={[gastro1, gastro2, gastro3, gastro4]}
                  openImage={openImage}
                />
                <Section
                  title="Drinks"
                  images={[bebida1, bebida2, bebida3, bebida4]}
                  openImage={openImage}
                />
              </>
            )}
          </div>

          <div className={styles.barDetails}>
            <MdLocationOn className={styles.icon} />
            <span>Rua Azevedo Soares, 940 - Tatuapé</span>
          </div>
          <div className={styles.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.8531229789736!2d-46.70965078450384!3d-23.504566264570394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef8c55b0f2e7b%3A0x6b9156a1e51233b3!2sLargo%20da%20Matriz%20de%20Nossa%20Senhora%20do%20%C3%93%2C%20145%20-%20Freguesia%20do%20%C3%93%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2002925-040!5e0!3m2!1sen!2sbr!4v1625157527756!5m2!1sen!2sbr"
              width="100%"
              height="450"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>

          <div className={styles.barInfo}>
            <div className={styles.infoContainer}>
              <div className={styles.rightColumn}>
                <div className={styles.iconContainer}>
                  <div className={styles.iconItem}>
                    <Image
                      src={icon1}
                      width={40}
                      height={40}
                      alt="Área aberta"
                    />
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
            <div className={styles.valores}>
              <div className={styles.barValores}>R$ 145,00 </div>
              <div className={styles.userValores}>/pessoa</div>
              <button onClick={openModal} className={styles.reserveButton}>
                Reservar
              </button>
            </div>
            <Profile isOpen={modalIsOpen} onRequestClose={closeModal} />
          </div>
        </div>
      </div>
      <Footer />

      <Modal
  isOpen={!!expandedImage} // Deve ser um booleano
  onRequestClose={closeImage} // Função de fechamento
  contentLabel="Image Modal" // Um rótulo descritivo
  className={styles.modal} // Classes CSS podem ser string
  overlayClassName={styles.overlay} // Overlay CSS também pode ser string
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
  images: StaticImageData[]; // Certifique-se de que as imagens estão no formato correto
  openImage: (img: StaticImageData) => void; // Função que recebe uma imagem
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
            onClick={() => openImage(image)}
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

export default Justino;
