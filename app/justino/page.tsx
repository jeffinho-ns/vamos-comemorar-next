"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent } from "react-icons/md";
import Footer from "../components/footer/footer";
import Header from "../components/header/header";
import imgBanner from "@/app/assets/justino/capa-justino.png";
import "react-multi-carousel/lib/styles.css";
import Programacao from "../components/programacao/programacao";
import Profile from "../components/profile/profile";
import styles from "./justino.module.scss";

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
import logoNew from "@/app/assets/justino/justinologo.png";  // Logo da página Justino
import icon1 from "@/app/assets/icones/area.png";
import icon2 from "@/app/assets/icones/acessivel.png";
import icon3 from "@/app/assets/icones/estacionamento.png";
import icon4 from "@/app/assets/icones/18.png";
import icon5 from "@/app/assets/icones/mesa.png";

import Modal from 'react-modal';
import { redirect } from 'next/navigation'; // Aqui importa a função de redirecionamento

interface SectionProps {
  title: string;
  images: StaticImageData[]; // Ajuste para StaticImageData
  openImage: (img: StaticImageData) => void; // Ajuste para StaticImageData
}

const Justino = () => {
  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
  const [user, setUser] = useState<any>(null);

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

  const openModal = () => {
    // Armazena a logo e a informação do local no local storage
    localStorage.setItem('logo', logoNew.src); // Armazenando o caminho da logo
    localStorage.setItem('localInfo', 'Rua Girassol, 144 - Vila Madalena');
    setModalIsOpen(true);
  };
  
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: StaticImageData) => setExpandedImage(img); // Ajuste para StaticImageData
  const closeImage = () => setExpandedImage(null);

  const addUser = (user: any) => {
    console.log("Usuário adicionado:", user);
    setUser(user); // Atualiza o estado do usuário
  };

  return (
    <>
      <Header />

      <div className={styles.bannerContainer}>
        <Image
          src={imgBanner}
          alt="Banner"
          fill
          className={styles.bannerImage}
        />
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
          </div>
        </div>
      </div>

      <div className={styles.barInfo}>
        <div className={styles.infoContainer}>
          <div className={styles.leftColumn}>
            <h1 className={styles.barName}>Justino</h1>
            <div className={styles.barDetails}>
              <MdLocationOn className={styles.icon} />
              <span>Rua Azevedo Soares, 940</span>
            </div>
          </div>
          <div className={styles.middleColumn}>
            <div className={styles.logoContainer}>
              <Image src={logoNew} alt="Logo" width={200} height={200} />
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.iconContainer}>
              <div className={styles.iconItem}>
                <Image src={icon1} width={40} height={40} alt="Ícone de área aberta" />
                <p className={styles.iconTitle}>Área aberta</p>
              </div>
              <div className={styles.iconItem}>
                <Image src={icon2} alt="Ícone acessível" width={40} height={40} />
                <p className={styles.iconTitle}>Acessível</p>
              </div>
              <div className={styles.iconItem}>
                <Image src={icon3} alt="Ícone de estacionamento" width={40} height={40} />
                <p className={styles.iconTitle}>Estacionamento</p>
              </div>
              <div className={styles.iconItem}>
                <Image src={icon4} alt="Ícone de +18" width={40} height={40} />
                <p className={styles.iconTitle}>+18</p>
              </div>
              <div className={styles.iconItem}>
                <Image src={icon5} alt="Ícone de mesas" width={40} height={40} />
                <p className={styles.iconTitle}>Mesas</p>
              </div>
            </div>
          </div>
        </div>
        <button onClick={openModal} className={styles.reserveButton}>Fazer reserva</button>
        <Profile 
          isOpen={modalIsOpen} 
          onRequestClose={closeModal} 
          addUser={addUser} // Passando a função addUser
          user={user} // Passando a propriedade user
          userType={user?.type}
        />
      </div>

      <p className={styles.barDescription}>
        O bar Justino oferece uma experiência única de interação com o público,
        é um ponto de encontro moderno entre os jovens e adultos, um lugar
        perfeito para happy hour, aniversários ou eventos corporativos. A
        decoração e estilo segue o modelo dos mais diversos hostels espalhados
        pelo mundo. São quatro ambientes: calçada, onde passa a sensação de
        estar em uma cidade de interior; piso térreo, que conta com uma
        decoração moderna; rooftop, área externa com uma linda vista que, aos
        fins de semana, conta com uma roda de samba para agitar as tardes; além
        da balada, para finalizar a noite com um ótimo clima de paquera.
      </p>

      {!showDescription && (
        <div className={styles.programacao}>
          <Programacao
  barId={1} // Exemplo de ID da casa
  logo={logoNew.src} // URL da imagem do logo
  location="Rua Girassol, 144 - Vila Madalena" // Endereço da casa
/>
        </div>
      )}

      <div className={styles.sections}>
        {showDescription && (
          <>
            <Section
              title="Ambientes"
              images={[newImg1, newImg2, newImg3, newImg4]}
              openImage={openImage} // Passando openImage
            />
            <Section
              title="Gastronomia"
              images={[gastro1, gastro2, gastro3, gastro4]}
              openImage={openImage} // Passando openImage
            />
            <Section
              title="Bebidas"
              images={[bebida1, bebida2, bebida3, bebida4]}
              openImage={openImage} // Passando openImage
            />
          </>
        )}
      </div>

      <div className={styles.mapContainer}>
      <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.8531229789736!2d-46.70965078450384!3d-23.504566264570394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef8c55b0f2e7b%3A0x6b9156a1e51233b3!2sLargo%20da%20Matriz%20de%20Nossa%20Senhora%20do%20%C3%93%2C%20145%20-%20Freguesia%20do%20%C3%93%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2002925-040!5e0!3m2!1sen!2sbr!4v1625157527756!5m2!1sen!2sbr"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Google Maps"
        ></iframe>
      </div>

      {expandedImage && (
        <Modal
          isOpen={!!expandedImage}
          onRequestClose={closeImage}
          className={styles.modal}
          overlayClassName={styles.modalOverlay}
        >
          <div className={styles.modalImageContainer}>
            <Image
              src={expandedImage}
              alt="Expanded"
              className={styles.modalImage}
              layout="intrinsic"
              width={800}
              height={600}
            />
          </div>
        </Modal>
      )}

      <Footer />
    </>
  );
};
// Componente Section para mostrar as imagens
const Section: React.FC<SectionProps> = ({ title, images, openImage }) => (
  <div className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <div className={styles.images}>
      {images.map((img, index) => (
        <div
          key={index}
          className={styles.imageContainer}
          onClick={() => openImage(img)}
        >
          <Image src={img} alt={title} className={styles.image} />
        </div>
      ))}
    </div>
  </div>
);

export default Justino;
