'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdLocationOn, MdArrowBack } from 'react-icons/md';
import { IoChevronBack } from 'react-icons/io5';
import Link from 'next/link';
import Image from 'next/image';
import '../styles.scss';

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
  image_url: string;
  category: string;
  category_id: string | number;
  bar_id: string | number;
  toppings: Topping[];
  order: number;
}

interface MenuCategory {
  id: string | number;
  name: string;
  bar_id: string | number;
  order: number;
  items: MenuItem[];
}

interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  address: string;
  rating: number;
  reviews_count: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

interface CardapioBarPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';

// Função auxiliar para construir URL completa da imagem
const getValidImageUrl = (imageUrl: string): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop';
  }
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for apenas o nome do arquivo (do banco de dados), construir a URL completa
  return `https://grupoideiaum.com.br/cardapio-agilizaiapp/${imageUrl}`;
};

export default function CardapioBarPage({ params }: CardapioBarPageProps) {
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchBarData = async () => {
      if (resolvedParams?.slug) {
        try {
          // Buscar o bar pelo slug
          const barsResponse = await fetch(`${API_BASE_URL}/bars`);
          if (!barsResponse.ok) {
            throw new Error('Erro ao carregar estabelecimentos');
          }
          const bars = await barsResponse.json();
          const bar = bars.find((b: Bar) => b.slug === resolvedParams?.slug);
          
          if (!bar) {
            setError('Estabelecimento não encontrado');
            setIsLoading(false);
            return;
          }

          setSelectedBar(bar);

          // Buscar categorias e itens
          const [categoriesResponse, itemsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/categories`),
            fetch(`${API_BASE_URL}/items`)
          ]);

          if (!categoriesResponse.ok || !itemsResponse.ok) {
            throw new Error('Erro ao carregar dados do cardápio');
          }

          const [categories, items] = await Promise.all([
            categoriesResponse.json(),
            itemsResponse.json()
          ]);

          // Filtrar categorias e itens do bar
          const barCategories = categories.filter((cat: MenuCategory) => cat.bar_id === bar.id);
          const barItems = items.filter((item: MenuItem) => item.bar_id === bar.id);

          // Organizar itens por categoria
          const categoriesWithItems = barCategories.map((category: MenuCategory) => ({
            ...category,
            items: barItems.filter((item: MenuItem) => item.category_id === category.id)
          }));

          setMenuCategories(categoriesWithItems);
          
          if (categoriesWithItems.length > 0) {
            setSelectedCategory(categoriesWithItems[0].name);
          }

        } catch (err) {
          console.error('Erro ao carregar dados:', err);
          setError('Erro ao carregar dados do estabelecimento');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBarData();
  }, [resolvedParams?.slug]);

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
          src={getValidImageUrl(item.image_url)}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1504674900240-9c9c0c1d0b1a?w=400&h=300&fit=crop';
          }}
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

  if (error || !selectedBar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Estabelecimento não encontrado</h1>
          <p className="text-gray-600 mb-4">{error || 'O estabelecimento solicitado não foi encontrado.'}</p>
          <Link 
            href="/cardapio"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cardapio-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="header-section bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/cardapio"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <IoChevronBack className="w-5 h-5" />
              Voltar ao cardápio
            </Link>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {selectedBar.name}
              </h1>
              <p className="text-gray-600 text-lg">
                Cardápio Digital
              </p>
            </div>
            <div className="w-20"></div> {/* Spacer para centralizar */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header do bar */}
        <div className="mb-6">
          <div className="bar-header bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64 md:h-80">
              <Image
                src={getValidImageUrl(selectedBar.cover_image_url)}
                alt={selectedBar.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop';
                }}
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
                    <span className="font-semibold">{selectedBar.rating || 0}</span>
                    <span>({selectedBar.reviews_count || 0})</span>
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
                    ?.items?.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    )) || []}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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