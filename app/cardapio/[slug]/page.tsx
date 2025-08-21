'use client';

import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdLocationOn, MdArrowBack, MdClose, MdMenu } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa'; // Importado os ícones
import Link from 'next/link';
import Image from 'next/image';

import ImageSlider from '../../components/ImageSlider/ImageSlider';
import { scrollToSection } from '../../utils/scrollToSection';

// Importe a imagem do banner
import bannerRegua from '../../assets/banner-regua.jpg';

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
  subCategoryId?: string | number;
  subCategoryName?: string;
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

// **CORREÇÃO**: Adicionados os novos campos à interface da API
interface BarFromAPI {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[] | string | null;
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[];
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
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
  params: Promise<{ slug: string }>;
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
const PLACEHOLDER_IMAGE_URL = 'https://images.unsplash.com/photo-1504674900240-9c9c0c1d0b1a?w=400&h=300&fit=crop';
const PLACEHOLDER_LOGO_URL = 'https://via.placeholder.com/150';

const getValidImageUrl = (filename?: string | null): string => {
  if (typeof filename !== 'string' || filename.trim() === '') {
    return PLACEHOLDER_IMAGE_URL;
  }
  
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  const fullUrl = `${BASE_IMAGE_URL}${filename}`;
  
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch (e) {
    return PLACEHOLDER_IMAGE_URL;
  }
};

const groupItemsBySubcategory = (items: MenuItem[]): { name: string; items: MenuItem[] }[] => {
  const grouped = items.reduce((acc, item) => {
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
  // Use React.use() para extrair o valor de params
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [menuCategories, setMenuCategories] = useState<GroupedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null); // Estado para o item selecionado no modal
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };
  
  const handleClosePopup = () => {
    setShowPopup(false);
  };
  
  const fetchBarData = useCallback(async () => {
    try {
      if (!slug) return;

      const barsResponse = await fetch(`${API_BASE_URL}/bars`);
      if (!barsResponse.ok) throw new Error('Erro ao carregar estabelecimentos');
      
      const bars = await barsResponse.json();
      const bar = bars.find((b: BarFromAPI) => b.slug === slug);
      
      if (!bar) {
        setError('Estabelecimento não encontrado');
        setIsLoading(false);
        return;
      }
      
      let coverImages: string[] = [];
      if (bar.coverImages && typeof bar.coverImages === 'string') {
        try {
          const parsed = JSON.parse(bar.coverImages);
          if (Array.isArray(parsed)) {
            coverImages = parsed.map((img: string) => getValidImageUrl(img));
          }
        } catch (e) {
          coverImages = bar.coverImages.trim() ? [getValidImageUrl(bar.coverImages)] : [];
        }
      } else if (Array.isArray(bar.coverImages)) {
        coverImages = bar.coverImages.map((img: string) => getValidImageUrl(img));
      }

      const barWithImages: Bar = {
        ...bar,
        logoUrl: getValidImageUrl(bar.logoUrl),
        coverImageUrl: getValidImageUrl(bar.coverImageUrl),
        coverImages: coverImages.length > 0 ? coverImages : [getValidImageUrl(bar.coverImageUrl)],
        popupImageUrl: bar.popupImageUrl,
        // **CORREÇÃO**: Mapeia os novos campos para o estado
        facebook: bar.facebook || '',
        instagram: bar.instagram || '',
        whatsapp: bar.whatsapp || ''
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
  }, [slug]);

  useEffect(() => {
    fetchBarData();
  }, [fetchBarData]);

  useEffect(() => {
    if (selectedBar && selectedBar.popupImageUrl && selectedBar.popupImageUrl.trim() !== '') {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2000); // Exibe o popup após 2 segundos
      
      return () => clearTimeout(timer);
    }
    
    // Retorna uma função vazia quando a condição é falsa
    return undefined; 
  }, [selectedBar]);

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

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }, []);

  const currentCategory = useMemo(() => 
    menuCategories.find(cat => cat.name === selectedCategory), 
    [menuCategories, selectedCategory]
  );

  const MenuItemCard = useCallback(({ item, onClick }: { item: MenuItem, onClick: (item: MenuItem) => void }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="menu-item-card cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
      onClick={() => onClick(item)}
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
  ), [formatPrice]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6">
          <div className="bar-header bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64 md:h-80">
              <ImageSlider images={selectedBar.coverImages} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Logo clicável para mobile */}
              <div 
                className="logo-container absolute top-4 left-4 p-2 bg-white rounded-xl shadow-md cursor-pointer md:cursor-default"
                onClick={() => window.innerWidth < 768 && setShowMobileSidebar(true)}
              >
                <Image
                  src={getValidImageUrl(selectedBar.logoUrl)}
                  alt={`${selectedBar.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              </div>

              {/* Informações do bar - visíveis apenas em desktop */}
              <div className="bar-content absolute bottom-6 left-6 right-6 hidden md:block">
                <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
                  {selectedBar.name}
                </h1>
                <p className="text-white/90 text-lg mb-3">
                  {selectedBar.description}
                </p>
                
                {/* **NOVO**: Ícones das redes sociais */}
                <div className="flex items-center gap-4 text-white/90 mb-3">
                  {selectedBar.facebook && (
                    <a href={selectedBar.facebook} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500 transition-colors">
                      <FaFacebook className="w-6 h-6" />
                    </a>
                  )}
                  {selectedBar.instagram && (
                    <a href={selectedBar.instagram} target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-500 transition-colors">
                      <FaInstagram className="w-6 h-6" />
                    </a>
                  )}
                  {selectedBar.whatsapp && (
                    <a href={selectedBar.whatsapp} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-500 transition-colors">
                      <FaWhatsapp className="w-6 h-6" />
                    </a>
                  )}
                </div>

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

        {menuCategories.length > 0 && (
          <div className="sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="pb-2">
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
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {currentCategory && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              
              <div className="w-full relative mb-8 z-10">
                <Link href="/decoracao-aniversario">
                <Image
                    src={bannerRegua}
                    alt="Banner de promoção"
                    layout="responsive"
                    width={1200}
                    height={150}
                    className="rounded-xl shadow-lg"
                    priority={true}
                />
                </Link>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedCategory}
              </h2>

              <div className="sticky top-[56px] z-10 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4">
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
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {subcat.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Modal Sidebar Mobile */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-sidebar fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do sidebar */}
              <div className="sidebar-header bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={getValidImageUrl(selectedBar.logoUrl)}
                      alt={`${selectedBar.name} logo`}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                    <h2 className="text-xl font-bold">{selectedBar.name}</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
                
                <p className="text-white/90 text-sm mb-4">
                  {selectedBar.description}
                </p>
              </div>

              {/* Conteúdo do sidebar */}
              <div className="sidebar-content p-6 space-y-6 overflow-y-auto h-[calc(100%-120px)]">
                {/* Redes sociais */}
                {(selectedBar.facebook || selectedBar.instagram || selectedBar.whatsapp) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Redes Sociais</h3>
                    <div className="flex items-center gap-4">
                      {selectedBar.facebook && (
                        <a 
                          href={selectedBar.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="social-link flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50"
                        >
                          <FaFacebook className="w-5 h-5" />
                          <span className="text-sm">Facebook</span>
                        </a>
                      )}
                      {selectedBar.instagram && (
                        <a 
                          href={selectedBar.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="social-link flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors p-3 rounded-lg hover:bg-pink-50"
                        >
                          <FaInstagram className="w-5 h-5" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                      {selectedBar.whatsapp && (
                        <a 
                          href={selectedBar.whatsapp} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="social-link flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors p-3 rounded-lg hover:bg-green-50"
                        >
                          <FaWhatsapp className="w-5 h-5" />
                          <span className="text-sm">WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Avaliações */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Avaliações</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MdStar className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">{selectedBar.rating || 0}</span>
                    <span className="text-sm text-gray-600">({selectedBar.reviewsCount || 0} avaliações)</span>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Localização</h3>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MdLocationOn className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-sm">{selectedBar.address}</span>
                  </div>
                </div>

                {/* Amenidades */}
                {selectedBar.amenities && selectedBar.amenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Serviços</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBar.amenities.map((amenity, index) => (
                        <span 
                          key={index}
                          className="amenity-tag px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O Modal do Popup */}
      <AnimatePresence>
        {showPopup && selectedBar?.popupImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClosePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-2xl p-4 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClosePopup}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="w-6 h-6" />
                </button>
              <div className="text-center">
                <Image
                  src={getValidImageUrl(selectedBar.popupImageUrl)}
                  alt="Popup de Propaganda"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes do Item */}
      <AnimatePresence>
          {selectedItem && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70"
                  onClick={handleCloseModal}
              >
                  <motion.div
                      initial={{ scale: 0.9, y: 50, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.9, y: 50, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-xl shadow-2xl p-6 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <button
                          onClick={handleCloseModal}
                          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
                      >
                          <MdClose className="w-8 h-8" />
                      </button>
                      
                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0 w-full md:w-1/2">
                              <Image
                                  src={getValidImageUrl(selectedItem.imageUrl)}
                                  alt={selectedItem.name}
                                  width={500}
                                  height={400}
                                  className="w-full h-auto object-cover rounded-lg shadow-lg"
                              />
                          </div>
                          
                          <div className="flex-1">
                              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                  {selectedItem.name}
                              </h2>
                              <p className="text-2xl font-semibold text-green-600 mb-4">
                                  {formatPrice(selectedItem.price)}
                              </p>
                              <p className="text-gray-700 mb-6 leading-relaxed">
                                  {selectedItem.description}
                              </p>
                              
                              {selectedItem.toppings && selectedItem.toppings.length > 0 && (
                                  <div className="mb-6">
                                      <h4 className="text-lg font-bold text-gray-800 mb-2">Adicionais</h4>
                                      <ul className="space-y-2">
                                          {selectedItem.toppings.map((topping) => (
                                              <li key={topping.id} className="flex items-center justify-between text-gray-700">
                                                  <span>{topping.name}</span>
                                                  <span className="font-medium text-gray-600">+{formatPrice(topping.price)}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      
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