"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  MdLocationOn, 
  MdStar, 
  MdAccessTime, 
  MdPhone, 
  MdEmail,
  MdRestaurant,
  MdMusicNote,
  MdWifi,
  MdLocalParking,
  MdBalcony
} from "react-icons/md";
import Link from "next/link";

// Importar imagens (usando placeholders até as imagens específicas serem adicionadas)
import capaReservaRooftop from "@/app/assets/highline/capa-highline.jpeg";
import logoReservaRooftop from "@/app/assets/highline/highlinelogo.png";

export default function ReservaRooftopPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <Image
          src={capaReservaRooftop}
          alt="Reserva Rooftop"
          className="w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-white hover:text-orange-400 transition-colors">
              ← Voltar
            </Link>
            <Link 
              href="/reservar?establishment=Reserva%20Rooftop"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Fazer Reserva
            </Link>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Image
                  src={logoReservaRooftop}
                  alt="Logo Reserva Rooftop"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
                  Reserva Rooftop
                </h1>
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-1">
                    <MdStar className="text-yellow-400" size={20} />
                    <span className="font-semibold">4.8</span>
                    <span>(1.9K avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdLocationOn size={16} />
                    <span>Jardim das Perdizes</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-8"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Sobre o Reserva Rooftop</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                No Reserva Rooftop, fusionamos sabores excepcionais com uma trilha sonora envolvente, 
                destacando ingredientes frescos e locais em cada experiência única. Nossa localização 
                privilegiada oferece uma vista panorâmica deslumbrante da cidade, criando o cenário 
                perfeito para momentos inesquecíveis.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Com um ambiente sofisticado e acolhedor, oferecemos uma experiência gastronômica 
                diferenciada, combinando a tradição culinária brasileira com toques contemporâneos 
                e uma seleção cuidadosa de drinks e vinhos.
              </p>
            </motion.div>

            {/* Amenities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Comodidades</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: MdWifi, label: "Wi-Fi Gratuito" },
                  { icon: MdLocalParking, label: "Estacionamento" },
                  { icon: MdMusicNote, label: "Música ao Vivo" },
                  { icon: MdBalcony, label: "Rooftop" },
                  { icon: MdRestaurant, label: "Gastronomia Premium" },
                  { icon: MdStar, label: "Vista Panorâmica" }
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <amenity.icon className="text-orange-500" size={24} />
                    <span className="text-gray-700 font-medium">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Informações de Contato</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MdLocationOn className="text-orange-500" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Endereço</p>
                    <p className="text-gray-600 text-sm">
                      Em frente ao portão 2 - Rua Marc Chagal, Parque<br />
                      Jardim das Perdizes, São Paulo - SP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdPhone className="text-orange-500" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Telefone</p>
                    <p className="text-gray-600">(11) 99999-5555</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdEmail className="text-orange-500" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Email</p>
                    <p className="text-gray-600">contato@reservarooftop.com.br</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdAccessTime className="text-orange-500" size={20} />
                  <div>
                    <p className="text-gray-700 font-medium">Horário de Funcionamento</p>
                    <p className="text-gray-600">Ter - Dom: 18h às 02h</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reservation CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
            >
              <h3 className="text-xl font-bold mb-4">Faça sua Reserva</h3>
              <p className="text-orange-100 mb-6">
                Garanta sua mesa no Reserva Rooftop e viva uma experiência gastronômica única com vista panorâmica da cidade.
              </p>
              <Link 
                href="/reservar?establishment=Reserva%20Rooftop"
                className="block w-full bg-white text-orange-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Reservar Agora
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
