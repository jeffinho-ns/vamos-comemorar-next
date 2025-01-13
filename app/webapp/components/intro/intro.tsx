"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import imgBanner from "@/app/assets/intro.png";
import logoWhite from "@/app/assets/logo_white.png";
import IphoneX1 from "@/app/assets/intro/📱iPhoneX-1.png";
import IphoneX2 from "@/app/assets/intro/📱iPhoneX-2.png";
import IphoneX3 from "@/app/assets/intro/📱iPhoneX-3.png";
import { useRouter } from "next/navigation";

interface IntroProps {
  className?: string; // Agora o className é opcional
}

const Intro = () => {
  const [showLogo, setShowLogo] = useState(true); // Controle da animação da logo
  const [currentPage, setCurrentPage] = useState(0); // Controle das páginas
  const router = useRouter();

  // Exibir logo de entrada por 2 segundos
  useEffect(() => {
    const logoTimer = setTimeout(() => setShowLogo(false), 2000); // Duração da animação
    return () => clearTimeout(logoTimer); // Limpar timeout
  }, []);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      router.push("/login");
    }
  };

  const handleSkip = () => {
    router.push("/login");
  };

  const pages = [
    {
      title: "Explore eventos próximos",
      description:
        "Descubra eventos emocionantes perto de você! Encontre os melhores shows e experiências para curtir com amigos e familiares.",
      image: IphoneX1,
    },
    {
      title: "Recurso de calendário moderno",
      description:
        "Mantenha-se organizado e nunca perca um evento! Acompanhe suas atividades e sincronize com seu telefone.",
      image: IphoneX2,
    },
    {
      title: "Descubra eventos no mapa",
      description:
        "Use nosso mapa interativo para encontrar eventos e atividades perto de você.",
      image: IphoneX3,
    },
  ];

  if (showLogo) {
    return (
<div className="relative flex items-center justify-center w-full h-screen bg-black overflow-hidden">
  {/* Banner de fundo */}
  <Image
    src={imgBanner}
    alt="Banner"
    fill
    className="absolute inset-0 object-cover w-full h-full"
    priority
  />
  {/* Logo centralizada */}
  <Image
    src={logoWhite}
    alt="Logo"
    className="z-10 w-[180px] sm:w-[220px] object-contain animate-fadeIn"
  />
</div>

    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-black">
      {/* Imagem principal no topo, ocupando o espaço entre a parte azul e o topo */}
      <div className="flex justify-center items-start w-full" style={{ height: 'calc(98vh - 200px)' }}>
        <Image
          src={pages[currentPage].image}
          alt={`Page ${currentPage + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Texto e botões na parte inferior */}
      <div className="w-full bg-blue-500 rounded-t-3xl py-6 px-4 text-center">
        <h1 className="text-white text-xl font-bold mb-3">
          {pages[currentPage].title}
        </h1>
        <p className="text-gray-200 text-sm mb-6">
          {pages[currentPage].description}
        </p>
        <div className="flex justify-between items-center px-4">
          <button className="text-white text-sm" onClick={handleSkip}>
            Skip
          </button>
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((dot, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentPage === index ? "bg-white" : "bg-gray-400"
                }`}
              ></span>
            ))}
          </div>
          <button className="text-white text-sm" onClick={handleNext}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Intro;
