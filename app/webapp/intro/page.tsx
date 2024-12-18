"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import imgBanner from "@/app/assets/intro.png"; // Fundo
import logoWhite from "@/app/assets/logo_white.png"; // Logo
import "../../webapp/global.scss";
const Intro = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false); // Transição após 3 segundos
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative w-full h-screen ${isVisible ? "flex" : "hidden"} justify-center items-center`}>
      {/* Fundo cobrindo toda a tela */}
      <Image
        src={imgBanner}
        alt="Banner"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
        priority
        unoptimized
      />

      {/* Logo centralizada com animação */}
      <Image
        src={logoWhite}
        alt="Logo"
        className="w-40 sm:w-60 animate-intro"
      />
    </div>
  );
};

export default Intro;
