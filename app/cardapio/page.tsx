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
  coverImages?: string[];
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
// Placeholder local para evitar erros 404 externos e reduzir ruído no terminal
const PLACEHOLDER_BAR_URL = '/placeholder-cardapio.svg';

// Função auxiliar para construir URL completa da imagem
const getValidImageUrl = (imageUrl?: string | null, coverImages?: string[]): string => {
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
  
  // Primeiro, tenta usar a imagem principal
  if (imageUrl && typeof imageUrl === 'string') {
    const trimmed = imageUrl.trim();
    if (trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined') {
      // Verifica se já é uma URL absoluta
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const url = new URL(trimmed);
          // Se a URL aponta para algum host antigo mas o caminho contém /cardapio-agilizaiapp/,
          // reescrevemos para o domínio atual usando apenas o nome do arquivo
          if (url.pathname.includes('/cardapio-agilizaiapp/')) {
            const parts = url.pathname.split('/');
            const lastSegment = parts[parts.length - 1]?.trim();
            if (lastSegment) {
              const fullUrl = `${BASE_IMAGE_URL}${lastSegment}`;
              new URL(fullUrl);
              return fullUrl;
            }
          }
          // Caso contrário, mantemos a URL como está (ex.: Unsplash, outros domínios permitidos)
          return trimmed;
        } catch {
          // Se der erro ao parsear, cai para a lógica de filename abaixo
        }
      }

      // Extrair sempre apenas o nome do arquivo (último segmento) para evitar base duplicada
      const withoutLeadingSlash = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
      const parts = withoutLeadingSlash.split('/');
      const lastSegment = parts[parts.length - 1]?.trim();

      if (lastSegment) {
        try {
          const fullUrl = `${BASE_IMAGE_URL}${lastSegment}`;
          new URL(fullUrl); // Validar URL
          return fullUrl;
        } catch (e) {
          console.warn('URL de imagem inválida:', imageUrl, '-> usando placeholder');
        }
      }
    }
  }
  
  // Se não tiver imagem principal, tenta usar a primeira imagem do array coverImages
  if (Array.isArray(coverImages) && coverImages.length > 0 && coverImages[0]) {
    const firstImage = coverImages[0];
    if (typeof firstImage === 'string') {
      const trimmed = firstImage.trim();
      if (trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined') {
        // Verifica se já é uma URL absoluta
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
        
        // Extrair sempre apenas o nome do arquivo (último segmento) para evitar base duplicada
        const withoutLeadingSlash = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
        const parts = withoutLeadingSlash.split('/');
        const lastSegment = parts[parts.length - 1]?.trim();

        if (lastSegment) {
          try {
            const fullUrl = `${BASE_IMAGE_URL}${lastSegment}`;
            new URL(fullUrl); // Validar URL
            return fullUrl;
          } catch (e) {
            console.warn('URL de imagem inválida:', firstImage, '-> usando placeholder');
          }
        }
      }
    }
  }
  
  // Se não tiver nenhuma imagem, usa placeholder
  return PLACEHOLDER_BAR_URL;
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
            src={getValidImageUrl(bar.coverImageUrl, bar.coverImages)}
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