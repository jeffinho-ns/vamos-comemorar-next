"use client";

import imgBanner from "@/app/assets/banner01.webp";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MdSearch } from "react-icons/md";
import { FaHeart } from "react-icons/fa";
import { useRouter } from "next/navigation";
import logoWhite from "@/app/assets/logo_blue.png";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import "../webapp/global.scss";
import Intro from "./components/intro/intro"; 

// Importação das imagens das logos
import Logo1 from "../webapp/assetsMobile/logos/justinologo.png";
import Logo2 from "../webapp/assetsMobile/logos/logo-pracinha.png";
import Logo3 from "../webapp/assetsMobile/logos/logoOhfregues.png";
import Logo4 from "../webapp/assetsMobile/logos/highlinelogo.png";

interface Event {
  id: string;
  title: string;
  address: string;
  imagem_do_evento: string;
  nome_do_evento: string;
  casa_do_evento: string;
  local_do_evento: string;
  place: {
    name: string;
    logo: string;
  };
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showIntro, setShowIntro] = useState(true); // Estado para gerenciar o Intro
  const [currentIntroPage, setCurrentIntroPage] = useState(0); // Página atual do Intro
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (token) {
      // Se o usuário está logado, não mostrar o Intro e ir direto para os eventos
      setShowIntro(false);
      fetchEvents();
    } else {
      // Se não está logado, continuar mostrando o Intro
      setShowIntro(true);
    }
  }, []); // Chama apenas uma vez, quando o componente for montado

  const fetchEvents = () => {
    setLoading(true);
    setEvents([]);
    fetch(`${API_URL}/api/events`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
      })
      .catch((error) => console.error("Erro ao buscar eventos:", error))
      .finally(() => setLoading(false));
  };

  // Função para avançar no componente Intro
  const handleNextIntro = () => {
    if (currentIntroPage < 2) {
      setCurrentIntroPage((prev) => prev + 1);
    } else {
      setShowIntro(false);
    }
  };

  const Card: React.FC<{ event: Event }> = ({ event }) => {
    const getEventPagePath = (place: string) => {
      switch (place) {
        case "Justino":
          return `/webapp/justino/reservas/`;
        case "Pracinha":
          return `/webapp/pracinha/reservas/`;
        case "Oh Freguês":
          return `/webapp/ohfregues/reservas/`;
        case "Highline":
          return `/webapp/highline/reservas/`;
        default:
          return `/webapp/reservas/`;
      }
    };

    return (
      <Link href={getEventPagePath(event.casa_do_evento)}>
        <motion.div
          className="relative bg-white rounded-lg shadow-md overflow-hidden card-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative w-full h-[550px]">
            <div className="absolute inset-0 bg-black opacity-50 z-10" />
            <Image
              src={`${API_URL}/uploads/events/${event.imagem_do_evento}`}
              alt={event.nome_do_evento}
              layout="fill"
              objectFit="cover"
              className="absolute inset-0 w-full h-full object-cover"
              unoptimized
            />
            <div className="absolute bottom-4 left-4 text-shadow z-20">
              <h2 className="text-white text-xl font-bold mb-1">{event.casa_do_evento}</h2>
              <p className="text-white">{event.local_do_evento}</p>
            </div>
            <div className="absolute bottom-4 right-4 bg-white rounded-full p-2 z-20">
              <FaHeart className="text-red-500 text-2xl" />
            </div>
          </div>
          <div className="card-button">Reservar</div>
        </motion.div>
      </Link>
    );
  };

  return (
    
    <>
          {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <Intro className="w-full h-full" />
        </div>
      )}
      <Header className="z-20" />

      <div className="relative">
        <div id="home-container" className="container-mobile relative z-1">
        <div className="flex justify-center mt-8 z-10">
            <Link href="/">
              <Image src={logoWhite} alt="Logo" className="w-100" />
            </Link>
          </div>
          <p className="title text-white text-center mt-4 z-10">Qual evento você procura?</p>
          <div className="absolute inset-0 w-full h-[280px] z-0">
            <Image
              src={imgBanner}
              alt="Banner"
              layout="fill"
              objectFit="cover"
              className="absolute inset-0 w-full h-full"
              unoptimized
            />
          </div>

 

          <div className="flex justify-center mt-8">
            <form className="w-11/12 max-w-md">
              <div className="relative">
                <input
                  placeholder="Buscar eventos"
                  type="text"
                  id="search"
                  className="w-full p-3 rounded-lg bg-white shadow-md border border-gray-300"
                />
                <MdSearch className="absolute top-1/2 transform -translate-y-1/2 right-4 text-blue-600 text-2xl" />
              </div>
            </form>
          </div>

          <div className="flex justify-center gap-6 my-8">
            <Link href="/webapp/justino">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <Image src={Logo1} alt="Justino" width={50} height={50} className="object-contain rounded-full" unoptimized />
              </div>
            </Link>
            <Link href="/webapp/pracinha">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <Image src={Logo2} alt="Pracinha" width={50} height={50} className="object-contain rounded-full" unoptimized />
              </div>
            </Link>
            <Link href="/webapp/ohfregues">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <Image src={Logo3} alt="Oh Freguês" width={50} height={50} className="object-contain rounded-full" unoptimized />
              </div>
            </Link>
            <Link href="/webapp/highline">
              <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                <Image src={Logo4} alt="Highline" width={50} height={50} className="object-contain rounded-full" unoptimized />
              </div>
            </Link>
          </div>

          <div className="cards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
            {loading
              ? [...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="border border-blue-300 shadow rounded-lg p-4 w-full h-[550px] mx-auto animate-pulse"
                  >
                    <div className="animate-pulse flex flex-col h-full">
                      <div className="bg-slate-700 h-3/4 w-full rounded-t-lg"></div>
                      <div className="flex-1 space-y-4 pt-4">
                        <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                ))
              : events.map((event) => <Card key={event.id} event={event} />)}
          </div>
          <Footer />
        </div>
      </div>

      
    </>
  );
}
