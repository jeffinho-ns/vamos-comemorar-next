"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent, MdStar, MdAccessTime, MdPhone, MdRestaurant } from "react-icons/md";
import Link from "next/link";
import Footer from "../components/footer/footer";
import Header from "../components/header/header";
import logoWhite from "@/app/assets/logo-agilizai-h.png";
import logoBlue from "@/app/assets/logo-agilizai-h.png";
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
import logoNew from "@/app/assets/justino/justinologo.png";
import icon1 from "@/app/assets/icones/area.png";
import icon2 from "@/app/assets/icones/acessivel.png";
import icon3 from "@/app/assets/icones/estacionamento.png";
import icon4 from "@/app/assets/icones/18.png";
import icon5 from "@/app/assets/icones/mesa.png";

import Modal from '../components/ui/Modal';
import { redirect } from 'next/navigation';

interface SectionProps {
  title: string;
  images: StaticImageData[];
  openImage: (img: StaticImageData) => void;
}

const Justino = () => {
  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<StaticImageData | null>(null);
  const [user, setUser] = useState<any>(null);

  // Removido: login não é mais obrigatório para visualizar a página

  const toggleContent = (content: string) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => {
    localStorage.setItem('logo', logoNew.src);
    localStorage.setItem('localInfo', 'Rua Azevedo Soares, 940');
    setModalIsOpen(true);
  };
  
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img: StaticImageData) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  const addUser = (user: any) => {
    console.log("Usuário adicionado:", user);
    setUser(user);
  };

  const handleSaveUser = (user: any) => {
    console.log("Salvando usuário:", user);
  };

  return (
    <>
      <Header logo={logoWhite} />

      {/* Banner Section */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src={imgBanner}
          alt="Justino Bar"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/70 to-gray-900/70"></div>
        
        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-4">
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                showDescription 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg' 
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
              onClick={() => toggleContent("sobre")}
            >
              <MdInfoOutline className="text-xl" />
              <span>Sobre</span>
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                !showDescription 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg' 
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
              onClick={() => toggleContent("eventos")}
            >
              <MdEvent className="text-xl" />
              <span>Eventos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bar Info Section */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/20">
        <div className="container mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Column - Info */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-800">Justino</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn className="text-yellow-500 text-xl" />
                <span className="text-lg">Rua Azevedo Soares, 940</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MdStar className="text-yellow-500" />
                  <span>4.6 (1.8k avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdAccessTime className="text-blue-500" />
                  <span>Aberto até 01:00</span>
                </div>
              </div>
            </div>

            {/* Middle Column - Logo */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/20">
                <Image src={logoNew} alt="Justino Logo" width={200} height={200} className="rounded-xl" />
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                <Image src={icon1} width={40} height={40} alt="Área aberta" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Área aberta</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl text-center">
                <Image src={icon2} width={40} height={40} alt="Acessível" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Acessível</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                <Image src={icon3} width={40} height={40} alt="Estacionamento" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Estacionamento</p>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl text-center">
                <Image src={icon4} width={40} height={40} alt="+18" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">+18</p>
              </div>
            </div>
          </div>

          {/* Reserve Button */}
          <div className="text-center mt-8">
            <Link href="/reservar?establishment=Seu Justino">
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto">
                <MdRestaurant size={24} />
                Fazer Reserva
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Sobre o Justino</h2>
            <p className="text-gray-700 text-lg leading-relaxed text-center">
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
          </div>
        </div>
      </div>

      {/* Events Section */}
      {!showDescription && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Programação de Eventos</h2>
            <Programacao
              barId={2}
              logo={logoNew.src}
              location="Rua Azevedo Soares, 940"
              establishmentName="Seu Justino"
            />
          </div>
        </div>
      )}

      {/* Gallery Sections */}
      {showDescription && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-8 space-y-16">
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
              title="Bebidas"
              images={[bebida1, bebida2, bebida3, bebida4]}
              openImage={openImage}
            />
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Localização</h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.8531229789736!2d-46.70965078450384!3d-23.504566264570394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef8c55b0f2e7b%3A0x6b9156a1e51233b3!2sLargo%20da%20Matriz%20de%20Nossa%20Senhora%20do%20%C3%93%2C%20145%20-%20Freguesia%20do%20%C3%93%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2002925-040!5e0!3m2!1sen!2sbr!4v1625157527756!5m2!1sen!2sbr"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Entre em Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdPhone className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Telefone</h3>
              <p className="text-gray-300">(11) 88888-8888</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdLocationOn className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Endereço</h3>
              <p className="text-gray-300">Rua Azevedo Soares, 940<br />Tatuapé</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
              <MdAccessTime className="text-3xl text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Horário</h3>
              <p className="text-gray-300">Seg - Dom<br />18h às 01h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {expandedImage && (
        <Modal
          isOpen={!!expandedImage}
          onRequestClose={closeImage}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-4 max-w-4xl w-full mx-4"
          overlayClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
        >
          <div className="relative">
            <button
              onClick={closeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
            >
              ✕
            </button>
            <Image
              src={expandedImage}
              alt="Expanded"
              className="w-full h-auto rounded-xl"
              width={800}
              height={600}
            />
          </div>
        </Modal>
      )}

      {/* Profile Modal */}
      <Profile 
        isOpen={modalIsOpen} 
        onRequestClose={closeModal} 
        addUser={addUser}
        user={user}
        userType={user?.type}
        onSaveUser={handleSaveUser}
      />

      <Footer logo={logoBlue} />
    </>
  );
};

// Section Component
const Section: React.FC<SectionProps> = ({ title, images, openImage }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 text-center">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {images.map((img, index) => (
        <div
          key={index}
          className="group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative h-64"
          onClick={() => openImage(img)}
        >
          <Image 
            src={img} 
            alt={`${title} ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300" 
          />
        </div>
      ))}
    </div>
  </div>
);

export default Justino;
