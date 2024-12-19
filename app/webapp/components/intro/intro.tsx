"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import imgBanner from "@/app/assets/intro.png";
import logoWhite from "@/app/assets/logo_white.png";
import { useRouter } from "next/navigation";
import "../intro/style.scss";

const Intro = () => {
  const [currentPage, setCurrentPage] = useState(1); // Página atual
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado de login
  const router = useRouter();

  // Verificar login e redirecionar se já estiver logado
// Verificar login e redirecionar se já estiver logado
useEffect(() => {
  const user = localStorage.getItem("user");

  if (user) {
    // Se o usuário já está logado, redireciona para a página principal
    router.push("/webapp");
  } else {
    // Inicia a sequência de introdução se o usuário não estiver logado
    const logoAnimationTimer = setTimeout(() => setCurrentPage(2), 3000);
    return () => clearTimeout(logoAnimationTimer);
  }
}, [router]);

  // Controlar animação da logo e exibição das páginas
  useEffect(() => {
    if (!isLoggedIn) {
      const logoAnimationTimer = setTimeout(() => setCurrentPage(2), 3000);
      return () => clearTimeout(logoAnimationTimer);
    }
  }, [isLoggedIn]);

  // Função para trocar de página
  const handleNavigation = (direction: "next" | "skip") => {
    if (direction === "next") {
      setCurrentPage((prev) => Math.min(prev + 1, 5));
    }
    if (direction === "skip" || currentPage === 4) {
      router.push("/login");
    }
  };

  if (isLoggedIn) {
    return null; // Usuário logado é redirecionado para /webapp
  }

  return (
    <div className="relative w-full h-screen flex justify-center items-center">
      {/* Fundo do banner */}
      <Image src={imgBanner} alt="Banner" fill className="absolute inset-0 object-cover" priority unoptimized />

      {/* Página 1: Animação da logo */}
      {currentPage === 1 && (
        <div className="absolute flex justify-center items-center w-full h-full">
          <Image src={logoWhite} alt="Logo" className="w-40 sm:w-60 animate-intro" />
        </div>
      )}

      {/* Páginas de introdução */}
      {currentPage > 1 && currentPage <= 4 && (
        <div className="content text-center text-white px-6">
          {/* Texto e imagens específicas por página */}
          {currentPage === 2 && (
  <div className="absolute flex flex-col justify-center items-center w-full h-full bg-cover bg-center bg-no-repeat text-center px-6 py-12" style={{ backgroundImage: 'url(/path/to/your/background-image.jpg)' }}>
    <div className="bg-black bg-opacity-50 w-full h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
        Explore Upcoming and Nearby Events
      </h1>
      <p className="text-lg sm:text-xl text-white mb-8 max-w-2xl mx-auto">
        Discover exciting events happening near you! Find the best activities, shows, and experiences to enjoy with your friends and family.
      </p>
      <div className="flex space-x-6">
        <button
          className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-xl hover:bg-blue-600 transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("next")}
        >
          Learn More
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full shadow-xl hover:bg-white hover:text-black transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("skip")}
        >
          Skip
        </button>
      </div>
    </div>
  </div>
)}

{currentPage === 3 && (
  <div className="absolute flex flex-col justify-center items-center w-full h-full bg-cover bg-center bg-no-repeat text-center px-6 py-12" style={{ backgroundImage: 'url(/path/to/your/calendar-image.jpg)' }}>
    <div className="bg-black bg-opacity-50 w-full h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
        Web Have Modern Events Calendar Feature
      </h1>
      <p className="text-lg sm:text-xl text-white mb-8 max-w-2xl mx-auto">
        Stay organized and never miss an event again! Our modern event calendar lets you easily track your upcoming activities, and even sync them with your phone.
      </p>
      <div className="flex space-x-6">
        <button
          className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-xl hover:bg-blue-600 transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("next")}
        >
          Explore Calendar
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full shadow-xl hover:bg-white hover:text-black transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("skip")}
        >
          Skip
        </button>
      </div>
    </div>
  </div>
)}

{currentPage === 4 && (
  <div className="absolute flex flex-col justify-center items-center w-full h-full bg-cover bg-center bg-no-repeat text-center px-6 py-12" style={{ backgroundImage: 'url(/path/to/your/map-image.jpg)' }}>
    <div className="bg-black bg-opacity-50 w-full h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
        To Look Up More Events or Activities Nearby By Map
      </h1>
      <p className="text-lg sm:text-xl text-white mb-8 max-w-2xl mx-auto">
        Discover new events and activities in your area. Use our interactive map to find what's happening around you, from concerts to outdoor adventures.
      </p>
      <div className="flex space-x-6">
        <button
          className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-xl hover:bg-blue-600 transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("next")}
        >
          Start Exploring
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full shadow-xl hover:bg-white hover:text-black transform hover:scale-105 transition duration-300"
          onClick={() => handleNavigation("skip")}
        >
          Skip
        </button>
      </div>
    </div>
  </div>
)}


          {/* Botões de navegação */}
          <div className="flex justify-between items-center">
            <button
              className="text-sm text-blue-300 underline"
              onClick={() => handleNavigation("skip")}
            >
              Skip
            </button>
            <div className="flex space-x-2">
              {[2, 3, 4].map((page) => (
                <span
                  key={page}
                  className={`w-2 h-2 rounded-full ${
                    currentPage === page ? "bg-blue-500" : "bg-gray-400"
                  }`}
                ></span>
              ))}
            </div>
            <button
              className="text-sm text-blue-300 underline"
              onClick={() => handleNavigation("next")}
            >
              {currentPage === 4 ? "Start" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Intro;
