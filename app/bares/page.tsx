"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import {  MdLocationOn, MdInfoOutline, MdEvent  } from "react-icons/md";
import Footer from "../components/footer/footer";
import Header from "../components/header/header";
import Profile from "../components/profile/profile";
import Programacao from "../components/programacao/programacao";
import logoImage from "@/app/assets/ohfregues/logoOhfregues.png";
import styles from "./bares.module.scss";
import { redirect } from 'next/navigation';
import Modal from 'react-modal';

// Importação de todas as imagens necessárias
import ohfreguesBanner from "@/app/assets/oh-fregues.jpg";
import highlineBanner from "@/app/assets/highline/capa-highline.jpeg";

import ohfreguesLogo from "@/app/assets/ohfregues/logoOhfregues.png";
import highlineLogo from "@/app/assets/highline/highlinelogo.png";

import icon1 from "@/app/assets/icones/area.png";
import icon2 from "@/app/assets/icones/acessivel.png";
import icon3 from "@/app/assets/icones/estacionamento.png";
import icon4 from "@/app/assets/icones/18.png";
import icon5 from "@/app/assets/icones/mesa.png";

import ohfreguesAmbiente1 from "@/app/assets/ohfregues/ambiente-1.jpg";
import ohfreguesAmbiente2 from "@/app/assets/ohfregues/ambiente-2.jpg";
import ohfreguesAmbiente3 from "@/app/assets/ohfregues/ambiente-3.jpg";
import ohfreguesAmbiente4 from "@/app/assets/ohfregues/ambiente-4.jpg";

import ohfreguesGastronomia1 from "@/app/assets/ohfregues/gastronomia-1.jpg";
import ohfreguesGastronomia2 from "@/app/assets/ohfregues/gastronomia-2.jpg";
import ohfreguesGastronomia3 from "@/app/assets/ohfregues/gastronomia-3.jpg";
import ohfreguesGastronomia4 from "@/app/assets/ohfregues/gastronomia-4.jpg";

import ohfreguesBebidas1 from "@/app/assets/ohfregues/bebidas-1.jpg";
import ohfreguesBebidas2 from "@/app/assets/ohfregues/bebidas-2.jpg";
import ohfreguesBebidas3 from "@/app/assets/ohfregues/bebidas-3.jpg";
import ohfreguesBebidas4 from "@/app/assets/ohfregues/bebidas-4.jpg";

import highlineAmbiente1 from "@/app/assets/highline/ambiente-1.jpeg";
import highlineAmbiente2 from "@/app/assets/highline/ambiente-2.jpeg";
import highlineAmbiente3 from "@/app/assets/highline/ambiente-3.jpeg";
import highlineAmbiente4 from "@/app/assets/highline/ambiente-4.jpeg";

import highlineGastronomia1 from "@/app/assets/highline/gastronomia-1.jpeg";
import highlineGastronomia2 from "@/app/assets/highline/gastronomia-2.jpeg";
import highlineGastronomia3 from "@/app/assets/highline/gastronomia-3.jpeg";
import highlineGastronomia4 from "@/app/assets/highline/gastronomia-4.jpeg";

import highlineBebidas1 from "@/app/assets/highline/bebida-1.jpeg";
import highlineBebidas2 from "@/app/assets/highline/bebida-2.jpeg";
import highlineBebidas3 from "@/app/assets/highline/bebida-3.jpeg";
import highlineBebidas4 from "@/app/assets/highline/bebida-4.jpeg";


interface SectionProps {
    title: string;
    images: StaticImageData[]; // Ajuste para StaticImageData
    openImage: (img: StaticImageData) => void; // Ajuste para StaticImageData
  }

  
// Array de dados dos bares
const barData = [
  {
    id: 1,
    name: "Oh Freguês",
    location: "Largo da Matriz de Nossa Senhora do Ó",
    banner: ohfreguesBanner,
    logo: ohfreguesLogo,
    ambientes: [ohfreguesAmbiente1, ohfreguesAmbiente2, ohfreguesAmbiente3, ohfreguesAmbiente4],
    gastronomia: [ohfreguesGastronomia1, ohfreguesGastronomia2, ohfreguesGastronomia3, ohfreguesGastronomia4],
    bebidas: [ohfreguesBebidas1, ohfreguesBebidas2, ohfreguesBebidas3, ohfreguesBebidas4],
    description: "O bar Oh Freguês oferece uma experiência única de interação com o público...",
  },
  {
    id: 2,
    name: "High Line",
    location: "Rua Girassol, 144 - Vila Madalena",
    banner: highlineBanner,
    logo: highlineLogo,
    ambientes: [highlineAmbiente1, highlineAmbiente2, highlineAmbiente3, ohfreguesAmbiente4],
    gastronomia: [highlineGastronomia1, highlineGastronomia2, highlineGastronomia3, highlineGastronomia4],
    bebidas: [highlineBebidas1, highlineBebidas2, highlineBebidas3, highlineBebidas4],
    description: "O bar High Line oferece um ambiente sofisticado e moderno...",
  },
];

const Bares = () => {
    const [selectedBar, setSelectedBar] = useState(barData[0]); // Bar selecionado
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [showDescription, setShowDescription] = useState(true);
    const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
    const [user, setUser] = useState<any>(null);


  const closeModal = () => setModalIsOpen(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // Se não houver token, redireciona para a página de login
    if (!token) {
      redirect('/login');
    }
  }, []);

  const handleBarSelection = (bar: typeof barData[0]) => {
    setSelectedBar(bar);
    // Armazena a logo e a localização no local storage
    localStorage.setItem("logo", bar.logo.src); 
    localStorage.setItem("location", bar.location);
  };

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const openImage = (img: StaticImageData) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const addUser = (user: any) => {
    console.log("Usuário adicionado:", user);
    setUser(user); 
  };


  return (
    <>
      <Header />

      {/* Banner e informações dinâmicas do bar */}
      <div className={styles.bannerContainer}>
        <Image src={selectedBar.banner} alt={`${selectedBar.name} Banner`} fill className={styles.bannerImage} />
        <div className={styles.flexButtonContainer}>
          <div className={styles.flexButtonContainerBar}>
            {/* Botões para trocar de bar */}
            {barData.map((bar) => (
              <button key={bar.id} className={styles.button} onClick={() => setSelectedBar(bar)}>
                {bar.name}
              </button>
            ))}
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
          </div>
        </div>

      <div className={styles.barInfo}>
        <div className={styles.infoContainer}>
          <div className={styles.leftColumn}>
            <h1 className={styles.barName}>{selectedBar.name}</h1>
            <div className={styles.barDetails}>
            
              <MdLocationOn className={styles.icon} aria-label="Localização" />
              <span>{selectedBar.location}</span>
            </div>
          </div>
          <div className={styles.middleColumn}>
            <div className={styles.logoContainer}>
              <Image src={selectedBar.logo} alt={`${selectedBar.name} Logo`} width={200} height={200} />
            </div>
          </div>
          <div className={styles.rightColumn}>
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
                <Image src={icon3} width={40} height={40} alt="Estacionamento" />
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
        <button onClick={openModal} className={styles.reserveButton}>
          Fazer reserva
        </button>

                <Profile 
          isOpen={modalIsOpen} 
          onRequestClose={closeModal} 
          addUser={addUser} // Passando a função addUser
          user={user} // Passando a propriedade user
          userType={user?.type}
        />
      </div>

      {/* Descrição do bar */}
      <p className={styles.barDescription}>{selectedBar.description}</p>

      {!showDescription && (
        <div className={styles.programacao}>
          <Programacao logo={ohfreguesLogo} location="Largo da Matriz de Nossa Senhora do Ó, 145"/>
          <Programacao logo={highlineLogo} location="Rua Girassol, 144 - Vila Madalena"/>
        </div>
      )}

      {/* Imagens dos ambientes */}
      <div className={styles.sections}>
      {showDescription && (
          <>
        <Section 
        title="Ambientes" 
        images={selectedBar.ambientes} 
        openImage={openImage}
        />
        <Section title="Gastronomia" images={selectedBar.gastronomia} openImage={openImage}/>
        <Section title="Bebidas" images={selectedBar.bebidas} openImage={openImage}/>
        </>
        )}
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

// Componente Section para mostrar as imagens das categorias
interface SectionProps {
  title: string;
  images: StaticImageData[];
}

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

export default Bares;
