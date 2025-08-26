'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MdStar, MdLocationOn, MdCalendarToday } from 'react-icons/md';
import Link from 'next/link';

interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
const PLACEHOLDER_BAR_URL = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop';

// Função auxiliar para construir URL completa da imagem
const getValidImageUrl = (imageUrl?: string | null): string => {
  if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return PLACEHOLDER_BAR_URL;
  }
  
  // Verifica se já é uma URL absoluta
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for apenas o nome do arquivo, constrói a URL completa
  return `https://grupoideiaum.com.br/cardapio-agilizaiapp/${imageUrl}`;
};

export default function CardapioPage() {
  const [allBars, setAllBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const barsRes = await fetch(`${API_BASE_URL}/bars`);
      
      if (!barsRes.ok) {
        throw new Error('Erro ao carregar dados da API');
      }

      const bars = await barsRes.json();
      const barsData = Array.isArray(bars) ? bars : [];
      setAllBars(barsData);
      
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar os dados. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const BarCard = ({ bar }: { bar: Bar }) => (
    <Link href={`/cardapio/${bar.slug}`} passHref>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`bar-card cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl`}
      >
        <div className="relative h-48">
          <Image
            src={getValidImageUrl(bar.coverImageUrl)}
            alt={bar.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-xl font-bold mb-1">{bar.name}</h3>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MdStar className="w-4 h-4 text-yellow-400" />
              <span>{bar.rating}</span>
              <span>({bar.reviewsCount} avaliações)</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white">
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {bar.description}
          </p>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <MdLocationOn className="w-3 h-3" />
            <span className="line-clamp-1">{bar.address}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar cardápio</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cardapio-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="header-section bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Cardápio Digital
            </h1>
            <p className="text-gray-600 text-lg">
              Descubra os sabores únicos dos nossos estabelecimentos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Evento Especial - Samba do Justino */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Evento Especial</h2>
            <p className="text-gray-600 text-lg">Uma experiência única que você não pode perder!</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Link href="/cardapio/samba-do-justino" passHref>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-3xl cursor-pointer group"
              >
                <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="text-4xl">🎵</span>
                      <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        SAMBA DO JUSTINO
                      </h3>
                      <span className="text-4xl">🎵</span>
                    </div>
                    <p className="text-xl text-blue-100 mb-4">
                      Uma noite especial com samba, drinks e muita animação!
                    </p>
                    <div className="flex items-center justify-center gap-6 text-blue-100">
                      <div className="flex items-center gap-2">
                        <MdCalendarToday className="w-5 h-5" />
                        <span>30 de Agosto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MdLocationOn className="w-5 h-5" />
                        <span>Mirante</span>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <span className="inline-block bg-yellow-400 text-blue-900 px-6 py-3 rounded-full font-bold text-lg group-hover:bg-yellow-300 transition-colors duration-300">
                        Ver Cardápio Especial →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Escolha um estabelecimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allBars.map((bar) => (
              <BarCard key={bar.id} bar={bar} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}