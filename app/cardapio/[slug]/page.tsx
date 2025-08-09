'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdLocationOn, MdArrowBack } from 'react-icons/md';
import { IoChevronBack } from 'react-icons/io5';
import Link from 'next/link';
import Image from 'next/image';

import ImageSlider from '../../components/ImageSlider/ImageSlider';
import { scrollToSection } from '../../utils/scrollToSection';

// Interfaces
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
  categoryId: string | number;
  barId: string | number;
  subCategoryId?: string | number; // ID da sub-categoria
  subCategoryName?: string; // Nome da sub-categoria para exibição
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

// Interface para dados vindos da API (antes do processamento)
interface BarFromAPI {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[] | string | null; // Permite string JSON, array ou null
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

// Interface para dados processados (após conversão)
interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[]; // Sempre array após processamento
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
}

interface GroupedCategory {
  id: string | number;
  name: string;
  subCategories: {
    name: string;
    items: MenuItem[];
  }[];
}

interface CardapioBarPageProps {
  params: Promise<{ slug: string }>
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
const PLACEHOLDER_IMAGE_URL = 'https://images.unsplash.com/photo-1504674900240-9c9c0c1d0b1a?w=400&h=300&fit=crop';
const PLACEHOLDER_LOGO_URL = 'https://via.placeholder.com/150';

const getValidImageUrl = (imageUrl?: string | null): string => {
  if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return PLACEHOLDER_IMAGE_URL;
  }
  
  // Verifica se já é uma URL absoluta
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for apenas o nome do arquivo, constrói a URL completa
  return `https://grupoideiaum.com.br/cardapio-agilizaiapp/${imageUrl}`;
};

const groupItemsBySubcategory = (items: MenuItem[]): { name: string; items: MenuItem[] }[] => {
  const grouped = items.reduce((acc, item) => {
    // Usa a sub-categoria definida no banco de dados ou 'Tradicional' como fallback
    const subCategoryName = item.subCategoryName && item.subCategoryName.trim() !== '' ? item.subCategoryName : 'Tradicional';
    if (!acc[subCategoryName]) {
      acc[subCategoryName] = [];
    }
    acc[subCategoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return Object.keys(grouped).map(name => ({
    name,
    items: grouped[name],
  }));
};

export default function CardapioBarPage({ params }: CardapioBarPageProps) {
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [menuCategories, setMenuCategories] = useState<GroupedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');

  useEffect(() => {
    const fetchBarData = async () => {
      const { slug } = await params;
      if (slug) {
        try {
          const barsResponse = await fetch(`${API_BASE_URL}/bars`);
          if (!barsResponse.ok) throw new Error('Erro ao carregar estabelecimentos');
          const bars = await barsResponse.json();
          const bar = bars.find((b: BarFromAPI) => b.slug === slug);
          
          if (!bar) {
            setError('Estabelecimento não encontrado');
            setIsLoading(false);
            return;
          }

          // Processar coverImages que podem vir como string JSON do banco
          let coverImages: string[] = [];
          
          if (bar.coverImages) {
            if (typeof bar.coverImages === 'string') {
              try {
                // Se for string, tenta fazer parse do JSON
                const parsed = JSON.parse(bar.coverImages);
                coverImages = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                // Se falhar o parse, trata como string única
                coverImages = bar.coverImages.trim() ? [bar.coverImages] : [];
              }
            } else if (Array.isArray(bar.coverImages)) {
              // Se já for array, usa diretamente
              coverImages = bar.coverImages;
            }
          }

          const barWithImages: Bar = {
            ...bar,
            coverImages: coverImages.length > 0
              ? coverImages.map((img: string) => getValidImageUrl(img))
              : [getValidImageUrl(bar.coverImageUrl)]
          };

          setSelectedBar(barWithImages);

          const [categoriesResponse, itemsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/categories`),
            fetch(`${API_BASE_URL}/items`)
          ]);

          if (!categoriesResponse.ok || !itemsResponse.ok) throw new Error('Erro ao carregar dados do cardápio');

          const [categories, items] = await Promise.all([
            categoriesResponse.json(),
            itemsResponse.json()
          ]);

          const barCategories = categories.filter((cat: MenuCategory) => cat.barId === bar.id);
          const barItems = items.filter((item: MenuItem) => item.barId === bar.id);

          const groupedCategories = barCategories.map((category: MenuCategory) => ({
            ...category,
            subCategories: groupItemsBySubcategory(barItems.filter((item: MenuItem) => item.categoryId === category.id))
          }));

          setMenuCategories(groupedCategories);
          
          if (groupedCategories.length > 0) {
            setSelectedCategory(groupedCategories[0].name);
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
  }, [params]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const subcategoryName = entry.target.getAttribute('data-subcategory-name');
            if (subcategoryName) {
              setActiveSubcategory(subcategoryName);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '-50% 0px -50% 0px' }
    );

    const sections = document.querySelectorAll('[data-subcategory-name]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [menuCategories, selectedCategory]);

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
          src={getValidImageUrl(item.imageUrl)}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

  const currentCategory = menuCategories.find(cat => cat.name === selectedCategory);

  return (
    <div className="cardapio-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6">
          <div className="bar-header bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64 md:h-80">
              <ImageSlider images={selectedBar.coverImages} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="absolute top-4 left-4 p-2 bg-white rounded-xl shadow-md">
                <Image
                  src={getValidImageUrl(selectedBar.logoUrl)}
                  alt={`${selectedBar.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              </div>

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
                    <span>({selectedBar.reviewsCount || 0})</span>
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

        {/* Menu de categorias principal */}
        {menuCategories.length > 0 && (
          <div className="mb-8 sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-gray-100 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

        {/* Itens do menu com sub-categorias e menu pegajoso */}
        <AnimatePresence mode="wait">
          {currentCategory && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedCategory}
              </h2>

              {/* Sub-menu pegajoso para as sub-categorias */}
              <div className="sticky top-20 z-10 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {currentCategory.subCategories.map((subcat) => (
                    <button
                      key={subcat.name}
                      onClick={() => scrollToSection(subcat.name)}
                      className={`subcategory-tab px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        activeSubcategory === subcat.name
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {subcat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listagem dos itens agrupados por sub-categoria */}
              {currentCategory.subCategories.map((subcat) => (
                <div
                  key={subcat.name}
                  id={subcat.name.replace(/\s+/g, '-').toLowerCase()}
                  data-subcategory-name={subcat.name}
                  className="mt-8"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {subcat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {subcat.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}