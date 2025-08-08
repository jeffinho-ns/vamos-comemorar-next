'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MdStar, MdLocationOn, MdPhone } from 'react-icons/md';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Link from 'next/link';

// Interfaces atualizadas para corresponder à API
interface Topping {
  id: string | number;
  name: string;
  price: number;
}

interface MenuItem {
  id: string | number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryId: string | number;
  barId: string | number;
  toppings: Topping[];
  order: number;
}

interface MenuCategory {
  id: string | number;
  name: string;
  barId: string | number;
  order: number;
  items: MenuItem[];
}

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
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/400x300';
const PLACEHOLDER_BAR_URL = 'https://placehold.co/800x400';

// Função auxiliar para construir URL completa da imagem
const getValidImageUrl = (imageUrl: string): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return PLACEHOLDER_BAR_URL;
  }
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for apenas o nome do arquivo (do banco de dados), construir a URL completa
  return `https://grupoideiaum.com.br/cardapio-agilizaiapp/${imageUrl}`;
};

export default function CardapioPage() {
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allBars, setAllBars] = useState<Bar[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [barsRes, categoriesRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bars`),
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`)
      ]);
      
      if (!barsRes.ok || !categoriesRes.ok || !itemsRes.ok) {
        throw new Error('Erro ao carregar dados da API');
      }

      const [bars, categories, items] = await Promise.all([
        barsRes.json(),
        categoriesRes.json(),
        itemsRes.json()
      ]);

      const barsData = Array.isArray(bars) ? bars : [];
      const categoriesData = Array.isArray(categories) ? categories : [];
      const itemsData = Array.isArray(items) ? items : [];

      setAllBars(barsData);

      if (selectedBar) {
        const barCategories = categoriesData
          .filter((cat: MenuCategory) => cat.barId === selectedBar.id);
        
        const barItems = itemsData
          .filter((item: MenuItem) => item.barId === selectedBar.id);

        const categoriesWithItems = barCategories.map((category: MenuCategory) => ({
          ...category,
          items: barItems.filter((item: MenuItem) => item.categoryId === category.id)
        }));
        
        setMenuCategories(categoriesWithItems);
        if (categoriesWithItems.length > 0) {
          setSelectedCategory(categoriesWithItems[0].name);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar os dados. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBarSelect = (bar: Bar) => {
    setSelectedBar(bar);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="menu-item-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={item.imageUrl || PLACEHOLDER_IMAGE_URL}
          alt={item.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3 price-badge bg-white px-2 py-1 rounded-full shadow-md">
          <span className="text-sm font-bold text-green-600">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {item.description}
        </p>
        
        {item.toppings && item.toppings.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Adicionais:</p>
            <div className="flex flex-wrap gap-1">
              {item.toppings.map((topping) => (
                <span
                  key={topping.id}
                  className="topping-tag text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {topping.name} +{formatPrice(topping.price)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const BarCard = ({ bar }: { bar: Bar }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleBarSelect(bar)}
      className={`bar-card cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        selectedBar?.id === bar.id
          ? 'ring-4 ring-blue-500 shadow-xl'
          : 'hover:shadow-xl'
      }`}
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
      {/* Header */}
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
        {!selectedBar ? (
          // Seleção de bares
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
        ) : (
          // Menu do bar selecionado
          <div>
            {/* Header do bar */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedBar(null)}
                className="back-button flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
              >
                <IoChevronBack className="w-5 h-5" />
                Voltar aos estabelecimentos
              </button>
              
              <div className="bar-header bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={getValidImageUrl(selectedBar.coverImageUrl)}
                    alt={selectedBar.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="bar-content absolute bottom-6 left-6 right-6">
                    <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
                      {selectedBar.name}
                    </h1>
                    <p className="text-white/90 text-lg mb-3">
                      {selectedBar.description}
                    </p>
                    <div className="flex items-center gap-4 text-white/90">
                      <div className="flex items-center gap-1">
                        <MdStar className="w-5 h-5 text-yellow-400" />
                        <span className="font-semibold">{selectedBar.rating}</span>
                        <span>({selectedBar.reviewsCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdLocationOn className="w-4 h-4" />
                        <span className="text-sm">{selectedBar.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorias */}
            {menuCategories.length > 0 && (
              <div className="mb-8">
                <div className="category-tabs flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {menuCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`category-tab px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'active bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Itens do menu */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {selectedCategory && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {selectedCategory}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {menuCategories
                        .find(cat => cat.name === selectedCategory)
                        ?.items.map((item) => (
                          <MenuItemCard key={item.id} item={item} />
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
