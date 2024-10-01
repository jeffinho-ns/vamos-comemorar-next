"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import "../webapp/global.scss";
import { MdSearch } from "react-icons/md";
import { FaHeart } from "react-icons/fa";

import Header from "./components/header/header";
import Form from "./components/form/form";
import Footer from "./components/footer/footer";

import img01 from "@/app/webapp/assetsMobile/justino.png";
import img02 from "@/app/webapp/assetsMobile/ohfregues.png";
import img03 from "@/app/webapp/assetsMobile/pracinha.png";
import img04 from "@/app/webapp/assetsMobile/highline.png";

import { redirect } from 'next/navigation';

// Define a interface para os props do Card
interface CardProps {
  image: StaticImageData; // Use 'StaticImageData' se estiver usando imagens importadas
  title: string;
  address: string;
  link: string;
}

export default function Home() {

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // Se não houver token, redireciona para a página de login
    if (!token) {
      redirect('/login');
    }
  }, []);


  const Card: React.FC<CardProps> = ({ image, title, address, link }) => (
    <Link href={link}>
      <motion.div
        className="relative bg-white rounded-lg shadow-md overflow-hidden card-container"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-full h-[550px]">
          <Image
            src={image}
            alt={title}
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-shadow">
            <h2 className="text-white text-xl font-bold mb-1">{title}</h2>
            <p className="text-white">{address}</p>
          </div>
          <div className="absolute bottom-4 right-4 bg-white rounded-full p-2">
            <FaHeart className="text-red-500 text-2xl" />
          </div>
        </div>
        <div className="card-button">Reservar</div>
      </motion.div>
    </Link>
  );


  return (
    <>
      <Header />
      <div id="home-container" className="container-mobile">
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <p className="title">Qual evento você procura? </p>
        <div className="flex justify-center w-full px-4 py-4">
          <Form
            id="form-search"
            className="w-full border-b-0 form-search bg-white px-4 py-2"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center w-full relative">
                <MdSearch className="text-blue-600 text-2xl absolute right-2" />
                <input
                  placeholder="Buscar eventos"
                  type="text"
                  value=""
                  id="data"
                  className="bg-gray-300 p-2 rounded-lg w-full border-blue-600"
                />
              </div>
            </div>
          </Form>
        </div>
        <main className="container mx-auto px-4 bg-white pb-8">
          <div className="cards-container">
            <Card
              image={img01}
              title="Seu Justino"
              address="Vila Madalena - SP"
              link="/webapp/justino"
            />
            <Card
              image={img02}
              title="Oh Fregues"
              address="Largo da Matriz de Nossa Senhora do Ó, 145"
              link="/webapp/ohfregues"
            />
            <Card
              image={img03}
              title="Pracinha"
              address="Vila Madalena - SP"
              link="/webapp/pracinha"
            />
            <Card
              image={img04}
              title="High Line"
              address="Vila Madalena - SP"
              link="/webapp/highline"
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}