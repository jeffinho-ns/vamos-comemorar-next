"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent } from "react-icons/md";
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

// Definindo a interface para os dados do bar
interface Bar {
    id: number;
    name: string;
    location: string;
    banner: StaticImageData;
    logo: StaticImageData;
    ambientes: StaticImageData[];
    gastronomia: StaticImageData[];
    bebidas: StaticImageData[];
    description: string;
}

// Definindo a interface para o usuário
interface User {
    type?: string;
    // Adicione outras propriedades do usuário conforme necessário
}

// Array de dados dos bares
const barData: Bar[] = [
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
        ambientes: [highlineAmbiente1, highlineAmbiente2, highlineAmbiente3, highlineAmbiente4],
        gastronomia: [highlineGastronomia1, highlineGastronomia2, highlineGastronomia3, highlineGastronomia4],
        bebidas: [highlineBebidas1, highlineBebidas2, highlineBebidas3, highlineBebidas4],
        description: "O bar High Line oferece um ambiente sofisticado e moderno...",
    },
];

const Bares = () => {
    const [selectedBar, setSelectedBar] = useState<Bar>(barData[0]); // Bar selecionado
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [showDescription, setShowDescription] = useState(true);
    const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
    const [user, setUser] = useState<User | null>(null);
    
    const closeModal = () => setModalIsOpen(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        // Se não houver token, redireciona para a página de login
        if (!token) {
            redirect('/login');
        }
    }, []);

    const handleBarSelection = (bar: Bar) => {
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

    const addUser = (user: User) => {
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
                            <button key={bar.id} className={styles.button} onClick={() => handleBarSelection(bar)}>
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
                        <h2 className={styles.location}>
                            <MdLocationOn className={styles.icon} />
                            {selectedBar.location}
                        </h2>
                    </div>
                    <div className={styles.rightColumn}>
                        <Image src={selectedBar.logo} alt={`${selectedBar.name} Logo`} width={150} height={150} />
                    </div>
                </div>

                {showDescription ? (
                    <p className={styles.description}>{selectedBar.description}</p>
                ) : (
              <Programacao
                  barId={selectedBar.id}
                  logo={selectedBar.logo.src} // Modificado aqui
                  location={selectedBar.location}
              />

                )}
            </div>

            <div className={styles.iconGrid}>
                <div className={styles.iconContainer}>
                    <Image src={icon1} alt="Icon 1" />
                    <p>Área ao ar livre</p>
                </div>
                <div className={styles.iconContainer}>
                    <Image src={icon2} alt="Icon 2" />
                    <p>Acessível</p>
                </div>
                <div className={styles.iconContainer}>
                    <Image src={icon3} alt="Icon 3" />
                    <p>Estacionamento</p>
                </div>
                <div className={styles.iconContainer}>
                    <Image src={icon4} alt="Icon 4" />
                    <p>Maior de 18 anos</p>
                </div>
                <div className={styles.iconContainer}>
                    <Image src={icon5} alt="Icon 5" />
                    <p>Mesa para reserva</p>
                </div>
            </div>

            {/* Seção de ambientes */}
            <Section title="Ambientes" images={selectedBar.ambientes} openImage={openImage} />
            <Section title="Gastronomia" images={selectedBar.gastronomia} openImage={openImage} />
            <Section title="Bebidas" images={selectedBar.bebidas} openImage={openImage} />

            <Footer />

            {/* Modal para exibir a imagem ampliada */}
            {modalIsOpen && expandedImage && (
    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className={styles.modal}>
        <Image src={expandedImage} alt="Imagem ampliada" fill className={styles.modalImage} />
        <button onClick={closeModal}>Fechar</button>
    </Modal>
)}
        </>
    );
};

// Seção genérica para exibir imagens
const Section = ({ title, images, openImage }: { title: string; images: StaticImageData[]; openImage: (img: StaticImageData) => void; }) => (
    <div className={styles.section}>
        <h2>{title}</h2>
        <div className={styles.imageGrid}>
            {images.map((image, index) => (
                <div key={index} className={styles.imageContainer} onClick={() => openImage(image)}>
                    <Image src={image} alt={`Imagem ${index + 1}`} fill className={styles.image} />
                </div>
            ))}
        </div>
    </div>
);

export default Bares;
