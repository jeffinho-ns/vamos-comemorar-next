'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdWifi, MdContentCopy, MdCheck } from 'react-icons/md';
import Image from 'next/image';
import { PublicEventResponse, EventCategory, EventItem, EventSeal } from '@/app/types/executiveEvents';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
const PLACEHOLDER_IMAGE_URL = '/placeholder-cardapio.svg';

const getValidImageUrl = (filename?: string | null): string => {
  if (!filename || typeof filename !== 'string' || filename.trim() === '' || filename === 'null') {
    return PLACEHOLDER_IMAGE_URL;
  }
  
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  return `${BASE_IMAGE_URL}${filename}`;
};

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicEventPage({ params }: EventPageProps) {
  const [slug, setSlug] = useState<string>('');
  const [eventData, setEventData] = useState<PublicEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);

  useEffect(() => {
    params.then(({ slug }) => {
      setSlug(slug);
      fetchEvent(slug);
    });
  }, [params]);

  const fetchEvent = async (eventSlug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/executive-events/public/${eventSlug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Evento não encontrado ou inativo.');
        }
        throw new Error('Erro ao carregar evento.');
      }

      const data = await response.json();
      setEventData(data);
    } catch (err) {
      console.error('❌ Erro ao buscar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar evento.');
    } finally {
      setLoading(false);
    }
  };

  const copyWifiPassword = () => {
    if (eventData?.event.settings?.wifi_info?.password) {
      navigator.clipboard.writeText(eventData.event.settings.wifi_info.password);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-lg">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-4">
          <h1 className="text-2xl font-bold text-white mb-4">Evento não encontrado</h1>
          <p className="text-gray-300">{error || 'O evento solicitado não existe ou está inativo.'}</p>
        </div>
      </div>
    );
  }

  const { event, categories, seals } = eventData;
  const colors = event.settings?.custom_colors || {};
  const bgColor = colors.backgroundColor || '#ffffff';
  const textColor = colors.textColor || '#000000';
  const categoryBgColor = colors.categoryBgColor || '#f3f4f6';
  const categoryTextColor = colors.categoryTextColor || '#000000';
  const subcategoryBgColor = colors.subcategoryBgColor || '#e5e7eb';
  const subcategoryTextColor = colors.subcategoryTextColor || '#000000';

  // Função para obter selo por ID
  const getSealById = (sealId: string): EventSeal | null => {
    return seals.find(s => s.id.toString() === sealId) || null;
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: bgColor,
        color: textColor
      }}
    >
      {/* Header com Logo e Cover */}
      <div className="relative">
        {event.cover_image_url && (
          <div className="w-full h-64 md:h-96 relative">
            <Image
              src={getValidImageUrl(event.cover_image_url)}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}
        
        <div className={`${event.cover_image_url ? 'absolute bottom-0 left-0 right-0' : 'pt-8'} px-4 md:px-8 pb-6`}>
          <div className="max-w-6xl mx-auto">
            {event.logo_url && (
              <div className="mb-4">
                <Image
                  src={getValidImageUrl(event.logo_url)}
                  alt={event.name}
                  width={200}
                  height={100}
                  className="object-contain"
                  priority
                />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">
              {event.name}
            </h1>
            {event.establishment_name && (
              <p className="text-lg md:text-xl opacity-90">
                {event.establishment_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Mensagem de Boas-Vindas */}
        {event.settings?.welcome_message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
          >
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {event.settings.welcome_message}
            </p>
          </motion.div>
        )}

        {/* Informações de WiFi */}
        {event.settings?.wifi_info?.network && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <MdWifi size={24} />
              <h2 className="text-xl font-semibold">WiFi</h2>
            </div>
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-medium">Rede:</span> {event.settings.wifi_info.network}
              </p>
              {event.settings.wifi_info.password && (
                <div className="flex items-center gap-2">
                  <p className="text-lg">
                    <span className="font-medium">Senha:</span> {event.settings.wifi_info.password}
                  </p>
                  <button
                    onClick={copyWifiPassword}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copiar senha"
                  >
                    {copiedWifi ? (
                      <MdCheck size={20} className="text-green-400" />
                    ) : (
                      <MdContentCopy size={20} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Menu por Categorias */}
        <div className="space-y-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              {/* Cabeçalho da Categoria */}
              <div
                className="rounded-t-xl p-4 mb-4"
                style={{
                  backgroundColor: categoryBgColor,
                  color: categoryTextColor
                }}
              >
                <h2 className="text-2xl md:text-3xl font-bold">{category.name}</h2>
              </div>

              {/* Itens da Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {/* Imagem do Item */}
                    {item.imageUrl && (
                      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={getValidImageUrl(item.imageUrl)}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Nome e Descrição */}
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm opacity-80 mb-4 line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {/* Subcategoria */}
                    {item.subCategoryName && (
                      <div
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                        style={{
                          backgroundColor: subcategoryBgColor,
                          color: subcategoryTextColor
                        }}
                      >
                        {item.subCategoryName}
                      </div>
                    )}

                    {/* Selos/Badges */}
                    {item.seals && item.seals.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.seals.map((sealId) => {
                          const seal = getSealById(sealId);
                          if (!seal) return null;
                          return (
                            <span
                              key={seal.id}
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${seal.color}20`,
                                color: seal.color,
                                border: `1px solid ${seal.color}`
                              }}
                            >
                              {seal.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* NOTA: SEM PREÇO e SEM BOTÃO "Add to Cart" */}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mensagem Final */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl opacity-70">
              Nenhum item disponível no momento.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 py-8 text-center opacity-60 text-sm">
        <p>Cardápio exclusivo para este evento</p>
      </div>
    </div>
  );
}

