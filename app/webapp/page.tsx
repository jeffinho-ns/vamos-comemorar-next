"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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

export default function Home() {

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      redirect('/login');
    }
  }, []);

  return (
    <>
      <Header />
      <div id="home-container" className="flex flex-col min-h-screen">
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        <p className="text-center text-2xl font-medium py-10 px-6">Qual evento você procura?</p>


        {/* Barra de busca */}
        <div className="flex justify-center w-full px-12 py-4">
          <Form
            id="form-search"
            className="w-full px-4 py-2"
          >
            <div className="flex items-center w-full px-4 py-2">
              <div className="relative w-full">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-xl" />
                <input
                  placeholder="Buscar eventos"
                  type="text"
                  value=""
                  id="data"
                  className="bg-gray-800 text-white rounded-full pl-12 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Form>
        </div>
        
        {/* Banner de topo com bordas mais arredondadas */}
        <div className="flex justify-center items-center w-full h-auto px-4 mb-8">
          <motion.div
            className="relative w-full h-[250px] sm:h-[300px] rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={img01}
              alt="Seu Justino"
              layout="fill"
              objectFit="cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </div>

        
        {/* Cards de eventos na parte inferior */}
        <main className="container mx-auto px-4 pb-8">
          <div className="flex gap-4 overflow-x-auto pb-4">
            <Link href="/webapp/justino">
              <motion.div className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 w-[calc(100vw/1.5)] sm:w-[calc(100%/1.5)] h-[550px] sm:h-auto">
                <div className="relative w-full h-[550px]">
                  <Image src={img01} alt="Seu Justino" layout="fill" objectFit="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 text-shadow">
                    <h2 className="text-white text-xl font-bold mb-1">Seu Justino</h2>
                    <p className="text-white">Vila Madalena - SP</p>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-full p-2">
                    <FaHeart className="text-red-500 text-2xl" />
                  </div>
                </div>
              </motion.div>
            </Link>
            <Link href="/webapp/ohfregues">
              <motion.div className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 w-[calc(100vw/1.5)] sm:w-[calc(100%/1.5)] h-[550px] sm:h-auto">
                <div className="relative w-full h-[550px]">
                  <Image src={img02} alt="Oh Fregues" layout="fill" objectFit="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 text-shadow">
                    <h2 className="text-white text-xl font-bold mb-1">Oh Fregues</h2>
                    <p className="text-white">Largo da Matriz de Nossa Senhora do Ó, 145</p>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-full p-2">
                    <FaHeart className="text-red-500 text-2xl" />
                  </div>
                </div>
              </motion.div>
            </Link>
            {/* Outros cards continuam como antes */}
            <Link href="/webapp/pracinha">
              <motion.div className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 w-[calc(100vw/1.5)] sm:w-[calc(100%/1.5)] h-[550px] sm:h-auto">
                <div className="relative w-full h-[550px]">
                  <Image src={img03} alt="Pracinha" layout="fill" objectFit="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 text-shadow">
                    <h2 className="text-white text-xl font-bold mb-1">Pracinha</h2>
                    <p className="text-white">Vila Madalena - SP</p>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-full p-2">
                    <FaHeart className="text-red-500 text-2xl" />
                  </div>
                </div>
              </motion.div>
            </Link>
            <Link href="/webapp/highline">
              <motion.div className="relative bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 w-[calc(100vw/1.5)] sm:w-[calc(100%/1.5)] h-[550px] sm:h-auto">
                <div className="relative w-full h-[550px]">
                  <Image src={img04} alt="High Line" layout="fill" objectFit="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 text-shadow">
                    <h2 className="text-white text-xl font-bold mb-1">High Line</h2>
                    <p className="text-white">Vila Madalena - SP</p>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-full p-2">
                    <FaHeart className="text-red-500 text-2xl" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </main>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </>
  );
}
