'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdWifi, MdContentCopy, MdCheck, MdMenu, MdClose, MdLocationOn } from 'react-icons/md';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';
import { PublicEventResponse, EventCategory, EventItem, EventSeal } from '@/app/types/executiveEvents';
import ImageSlider from '../../components/ImageSlider/ImageSlider';

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

// Função para agrupar itens por subcategoria
const groupItemsBySubcategory = (items: EventItem[]): { name: string; items: EventItem[] }[] => {
  const grouped = items.reduce((acc, item) => {
    const subCategoryName = item.subCategoryName && item.subCategoryName.trim() !== '' ? item.subCategoryName : 'Tradicional';
    if (!acc[subCategoryName]) {
      acc[subCategoryName] = [];
    }
    acc[subCategoryName].push(item);
    return acc;
  }, {} as Record<string, EventItem[]>);

  return Object.keys(grouped).map(name => ({
    name,
    items: grouped[name],
  }));
};

interface GroupedCategory {
  id: string | number;
  name: string;
  subCategories: {
    name: string;
    items: EventItem[];
  }[];
}

const normalizeToDomId = (value: string) => {
  if (!value) return 'secao';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'secao';
};

const getCategoryDomId = (categoryName: string) => `category-${normalizeToDomId(categoryName)}`;
const getSubcategoryDomId = (categoryName: string, subcategoryName: string) =>
  `subcategory-${normalizeToDomId(categoryName)}-${normalizeToDomId(subcategoryName)}`;

export default function PublicEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  
  const [eventData, setEventData] = useState<PublicEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<EventItem | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [categoryBarHeight, setCategoryBarHeight] = useState<number>(0);
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  
  // Refs para ScrollSpy
  const subcategoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const subcategoryMenuRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const categoryMenuRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isScrollingProgrammatically = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentActiveCategoryRef = useRef<string>('');
  const currentActiveSubcategoryRef = useRef<string>('');

  // Hook para verificar se a tela é mobile
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Agrupar categorias com subcategorias
  const menuCategories = useMemo<GroupedCategory[]>(() => {
    if (!eventData?.categories) return [];
    
    return eventData.categories.map(category => ({
      id: category.id,
      name: category.name,
      subCategories: groupItemsBySubcategory(category.items)
    }));
  }, [eventData]);

  useEffect(() => {
    fetchEvent(slug);
  }, [slug]);

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
      
      // Definir primeira categoria como selecionada
      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0].name);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const headerElement = document.querySelector('header');
    if (!headerElement) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (!categoryBarRef.current) return;

    const updateCategoryBarHeight = () => {
      if (!categoryBarRef.current) return;
      setCategoryBarHeight(categoryBarRef.current.getBoundingClientRect().height);
    };

    updateCategoryBarHeight();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateCategoryBarHeight());
      resizeObserver.observe(categoryBarRef.current);
    }

    window.addEventListener('resize', updateCategoryBarHeight);

    return () => {
      window.removeEventListener('resize', updateCategoryBarHeight);
      if (resizeObserver && categoryBarRef.current) {
        resizeObserver.unobserve(categoryBarRef.current);
      }
    };
  }, [menuCategories.length, isMobile]);

  const copyWifiPassword = () => {
    if (eventData?.event.settings?.wifi_info?.password) {
      navigator.clipboard.writeText(eventData.event.settings.wifi_info.password);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  const handleItemClick = useCallback((item: EventItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const stickyCategoryOffset = useMemo(
    () => Math.max(headerHeight, 0),
    [headerHeight]
  );

  const stickySubcategoryOffset = useMemo(
    () => stickyCategoryOffset + Math.max(categoryBarHeight, 0),
    [stickyCategoryOffset, categoryBarHeight]
  );

  // Função para obter selo por ID
  const getSealById = (sealId: string): EventSeal | null => {
    if (!eventData?.seals) return null;
    return eventData.seals.find(s => s.id.toString() === sealId) || null;
  };

  // Função para atualizar visualmente os botões sem re-render
  const updateActiveButton = useCallback((categoryName: string, subcategoryName: string) => {
    const event = eventData?.event;
    if (!event) return;
    
    const colors = event.settings?.custom_colors || {};
    const categoryBgColor = colors.categoryBgColor || '#3b82f6';
    const categoryTextColor = colors.categoryTextColor || '#ffffff';
    const subcategoryBgColor = colors.subcategoryBgColor || '#3b82f6';
    const subcategoryTextColor = colors.subcategoryTextColor || '#ffffff';
    
    const activeSubcategoryKey = `${categoryName}-${subcategoryName}`;
    
    // Atualizar botões de CATEGORIA PRINCIPAL
    categoryMenuRefs.current.forEach((button, key) => {
      if (!button) return;
      const isActive = key === categoryName;
      
      if (isActive) {
        button.style.backgroundColor = categoryBgColor;
        button.style.color = categoryTextColor;
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        button.classList.add('active-category');
      } else {
        button.style.backgroundColor = '#ffffff';
        button.style.color = '#374151';
        button.style.boxShadow = '';
        button.classList.remove('active-category');
      }
    });
    
    // Atualizar botões de SUBCATEGORIA
    subcategoryMenuRefs.current.forEach((button, key) => {
      if (!button) return;
      const isActive = key === activeSubcategoryKey;
      
      if (isActive) {
        button.style.backgroundColor = subcategoryBgColor;
        button.style.color = subcategoryTextColor;
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        button.classList.add('active-subcategory');
      } else {
        button.style.backgroundColor = '';
        button.style.color = '';
        button.style.boxShadow = '';
        button.classList.remove('active-subcategory');
      }
    });

    // Auto-scroll horizontal no menu de subcategorias
    const menuButton = subcategoryMenuRefs.current.get(activeSubcategoryKey);
    if (menuButton) {
      requestAnimationFrame(() => {
        menuButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      });
    }
  }, [eventData]);

  // Intersection Observer para ScrollSpy das subcategorias
  useEffect(() => {
    if (typeof window === 'undefined' || menuCategories.length === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;

        let closestEntry: IntersectionObserverEntry | null = null;
        let closestDistance = Infinity;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const distance = Math.abs(rect.top - stickySubcategoryOffset);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestEntry = entry;
            }
          }
        }

        if (closestEntry) {
          const target = closestEntry.target;
          if (!(target instanceof HTMLElement)) return;
          const subcategoryName = target.getAttribute('data-subcategory-name');
          const categoryName = target.getAttribute('data-category-name');

          if (subcategoryName && categoryName) {
            if (
              currentActiveCategoryRef.current !== categoryName ||
              currentActiveSubcategoryRef.current !== subcategoryName
            ) {
              currentActiveCategoryRef.current = categoryName;
              currentActiveSubcategoryRef.current = subcategoryName;
              updateActiveButton(categoryName, subcategoryName);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: `-${stickySubcategoryOffset + 20}px 0px -50% 0px`,
        threshold: [0, 0.1, 0.5, 1]
      }
    );

    observerRef.current = observer;

    subcategoryRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [menuCategories, stickySubcategoryOffset, updateActiveButton]);

  const registerSubcategoryRef = useCallback((categoryName: string, subcategoryName: string, element: HTMLDivElement | null) => {
    if (element) {
      subcategoryRefs.current.set(`${categoryName}-${subcategoryName}`, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      const key = `${categoryName}-${subcategoryName}`;
      const oldElement = subcategoryRefs.current.get(key);
      if (oldElement && observerRef.current) {
        observerRef.current.unobserve(oldElement);
      }
      subcategoryRefs.current.delete(key);
    }
  }, []);

  const registerSubcategoryMenuRef = useCallback((categoryName: string, subcategoryName: string, element: HTMLButtonElement | null) => {
    if (element) {
      subcategoryMenuRefs.current.set(`${categoryName}-${subcategoryName}`, element);
    } else {
      subcategoryMenuRefs.current.delete(`${categoryName}-${subcategoryName}`);
    }
  }, []);

  const registerCategoryMenuRef = useCallback((categoryName: string, element: HTMLButtonElement | null) => {
    if (element) {
      categoryMenuRefs.current.set(categoryName, element);
    } else {
      categoryMenuRefs.current.delete(categoryName);
    }
  }, []);

  const scrollToIdWithOffset = useCallback((targetId: string, offset: number) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(targetId);
    if (!element) return;

    isScrollingProgrammatically.current = true;

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const targetPosition = Math.max(elementPosition - offset, 0);

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
          <p className="text-gray-600">{error || 'O evento solicitado não existe ou está inativo.'}</p>
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
  const sidebarBgColor = colors.sidebarBgColor || '#667eea';
  const sidebarTextColor = colors.sidebarTextColor || '#ffffff';

  // Preparar imagens de capa
  const coverImages = event.cover_image_url ? [getValidImageUrl(event.cover_image_url)] : [];

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: bgColor,
        color: textColor
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com Logo e Cover */}
        <div className="mb-6">
          <div className="bar-header overflow-hidden bg-white rounded-xl shadow-lg">
            <div className="relative h-64 md:h-80">
              {coverImages.length > 0 ? (
                <ImageSlider images={coverImages} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div 
                className="logo-container absolute top-4 left-4 cursor-pointer md:cursor-default p-2 bg-white rounded-xl shadow-md"
                onClick={() => window.innerWidth < 768 && setShowMobileSidebar(true)}
              >
                {event.logo_url && (
                  <Image
                    src={getValidImageUrl(event.logo_url)}
                    alt={event.name}
                    width={64}
                    height={64}
                    className="rounded-lg"
                    unoptimized={event.logo_url?.includes('cloudinary.com') || false}
                  />
                )}
                
                <div className="menu-indicator absolute -top-1 -right-1 md:hidden">
                  <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                    <MdMenu className="menu-icon w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bar-content absolute bottom-6 left-6 right-6 hidden md:block">
                <h1 className="text-white text-3xl md:text-4xl font-bold mb-3">
                  {event.name}
                </h1>
                {event.establishment_name && (
                  <p className="text-white/90 text-lg mb-3">
                    {event.establishment_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de Boas-Vindas e WiFi */}
        {(event.settings?.welcome_message || event.settings?.wifi_info?.network) && (
          <div className="mb-6 space-y-4">
            {event.settings?.welcome_message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {event.settings.welcome_message}
                </p>
              </motion.div>
            )}

            {event.settings?.wifi_info?.network && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
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
          </div>
        )}

        {/* Menu de categorias fixo */}
        {menuCategories.length > 0 && (
          <div
            ref={categoryBarRef}
            className="sticky z-40 bg-gradient-to-br from-gray-50 to-gray-100"
            style={{ top: `${stickyCategoryOffset}px` }}
          >
            <div className="text-center py-2 px-4 bg-blue-50 border-b border-blue-200">
              <span className="text-sm text-gray-600">
                Categoria atual: <span className="font-bold">{selectedCategory}</span>
              </span>
            </div>
            <div className="pb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {menuCategories.map((category) => (
                  <button
                    key={category.id}
                    ref={(el) => registerCategoryMenuRef(category.name, el)}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      currentActiveCategoryRef.current = category.name;
                      scrollToIdWithOffset(
                        getCategoryDomId(category.name),
                        stickyCategoryOffset + Math.max(categoryBarHeight, 0) + 12
                      );
                    }}
                    className="category-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 px-4 py-2 text-sm hover:bg-gray-50 shadow-md"
                    style={{
                      backgroundColor: selectedCategory === category.name ? categoryBgColor : '#ffffff',
                      color: selectedCategory === category.name ? categoryTextColor : '#374151',
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do Menu */}
        {isMobile ? (
          <div className="mt-8">
            {menuCategories.map((category) => (
              <div
                key={category.id}
                id={getCategoryDomId(category.name)}
                data-category-name={category.name}
              >
                <h2 className="text-2xl font-bold mt-8 mb-6" style={{ color: textColor }}>
                  {category.name}
                </h2>
                
                {/* Menu de subcategorias fixo (mobile) */}
                <div
                  className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                  style={{ top: `${stickySubcategoryOffset}px` }}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {category.subCategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        ref={(el) => registerSubcategoryMenuRef(category.name, subcat.name, el)}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setActiveSubcategory(subcat.name);
                          currentActiveCategoryRef.current = category.name;
                          currentActiveSubcategoryRef.current = subcat.name;
                          updateActiveButton(category.name, subcat.name);
                          scrollToIdWithOffset(
                            getSubcategoryDomId(category.name, subcat.name),
                            stickySubcategoryOffset + 12
                          );
                        }}
                        className="subcategory-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {category.subCategories.map((subcat) => (
                  <div
                    key={subcat.name}
                    ref={(el) => registerSubcategoryRef(category.name, subcat.name, el)}
                    id={getSubcategoryDomId(category.name, subcat.name)}
                    data-subcategory-name={subcat.name}
                    data-category-name={category.name}
                    className="mt-8"
                  >
                    <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>
                      {subcat.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {subcat.items.map((item) => (
                        <EventItemCard 
                          key={item.id} 
                          item={item} 
                          onClick={handleItemClick}
                          colors={colors}
                          getSealById={getSealById}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            {menuCategories.map((category) => (
              <div
                key={category.id}
                id={getCategoryDomId(category.name)}
                data-category-name={category.name}
              >
                <h2 className="text-2xl font-bold mt-8 mb-6" style={{ color: textColor }}>
                  {category.name}
                </h2>

                {/* Menu de subcategorias fixo (desktop) */}
                <div
                  className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                  style={{ top: `${stickySubcategoryOffset}px` }}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {category.subCategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        ref={(el) => registerSubcategoryMenuRef(category.name, subcat.name, el)}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setActiveSubcategory(subcat.name);
                          currentActiveCategoryRef.current = category.name;
                          currentActiveSubcategoryRef.current = subcat.name;
                          updateActiveButton(category.name, subcat.name);
                          scrollToIdWithOffset(
                            getSubcategoryDomId(category.name, subcat.name),
                            stickySubcategoryOffset + 12
                          );
                        }}
                        className="subcategory-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 px-4 py-2 text-sm bg-white text-gray-600 hover:bg-gray-50"
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {category.subCategories.map((subcat) => (
                  <div
                    key={subcat.name}
                    ref={(el) => registerSubcategoryRef(category.name, subcat.name, el)}
                    id={getSubcategoryDomId(category.name, subcat.name)}
                    data-subcategory-name={subcat.name}
                    data-category-name={category.name}
                    className="mt-8"
                  >
                    <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>
                      {subcat.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {subcat.items.map((item) => (
                        <EventItemCard 
                          key={item.id} 
                          item={item} 
                          onClick={handleItemClick}
                          colors={colors}
                          getSealById={getSealById}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
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
              <div 
                className="sidebar-header p-6"
                style={{
                  backgroundColor: sidebarBgColor,
                  color: sidebarTextColor
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {event.logo_url && (
                      <Image
                        src={getValidImageUrl(event.logo_url)}
                        alt={event.name}
                        width={48}
                        height={48}
                        className="rounded-lg"
                        unoptimized={event.logo_url?.includes('cloudinary.com') || false}
                      />
                    )}
                    <h2 className="text-xl font-bold">{event.name}</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="transition-colors opacity-80 hover:opacity-100"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
                
                {event.establishment_name && (
                  <p className="text-sm mb-4" style={{ opacity: 0.9 }}>
                    {event.establishment_name}
                  </p>
                )}

                {event.settings?.welcome_message && (
                  <p className="text-sm mb-4" style={{ opacity: 0.9 }}>
                    {event.settings.welcome_message}
                  </p>
                )}

                {event.settings?.wifi_info?.network && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MdWifi size={20} />
                      <span className="text-sm font-semibold">WiFi</span>
                    </div>
                    <p className="text-sm" style={{ opacity: 0.9 }}>
                      {event.settings.wifi_info.network}
                    </p>
                    {event.settings.wifi_info.password && (
                      <p className="text-sm" style={{ opacity: 0.9 }}>
                        Senha: {event.settings.wifi_info.password}
                      </p>
                    )}
                  </div>
                )}
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
                <div className="flex-shrink-0 w-full md:w-1/2 relative">
                  <Image
                    src={getValidImageUrl(selectedItem.imageUrl)}
                    alt={selectedItem.name}
                    width={500}
                    height={400}
                    className="w-full h-auto object-cover rounded-lg shadow-lg"
                    unoptimized={selectedItem.imageUrl?.includes('cloudinary.com') || false}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + PLACEHOLDER_IMAGE_URL) {
                        target.src = PLACEHOLDER_IMAGE_URL;
                      }
                    }}
                  />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {selectedItem.name}
                  </h2>
                  {selectedItem.description && (
                    <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  )}
                  
                  {/* Selos/Badges */}
                  {selectedItem.seals && selectedItem.seals.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedItem.seals.map((sealId) => {
                        const seal = getSealById(sealId);
                        if (!seal) return null;
                        return (
                          <span
                            key={seal.id}
                            className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-lg"
                            style={{ 
                              backgroundColor: seal.color,
                              boxShadow: `0 4px 12px ${seal.color}50`
                            }}
                          >
                            {seal.name}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {selectedItem.subCategoryName && (
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                      style={{
                        backgroundColor: subcategoryBgColor,
                        color: subcategoryTextColor
                      }}
                    >
                      {selectedItem.subCategoryName}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
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

// Componente de Card do Item
const EventItemCard = React.memo(({ 
  item, 
  onClick,
  colors,
  getSealById
}: { 
  item: EventItem; 
  onClick: (item: EventItem) => void;
  colors: any;
  getSealById: (sealId: string) => EventSeal | null;
}) => {
  const [imageSrc, setImageSrc] = useState<string>(() => getValidImageUrl(item.imageUrl));

  React.useEffect(() => {
    setImageSrc(getValidImageUrl(item.imageUrl));
  }, [item.imageUrl]);

  const subcategoryBgColor = colors.subcategoryBgColor || '#e5e7eb';
  const subcategoryTextColor = colors.subcategoryTextColor || '#000000';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="menu-item-card cursor-pointer overflow-hidden transition-all duration-300 flex flex-col bg-white rounded-lg shadow-lg hover:shadow-xl"
      onClick={() => onClick(item)}
    >
      <div className="relative overflow-hidden h-48">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          unoptimized={imageSrc.includes('cloudinary.com') || imageSrc.startsWith('blob:')}
          onError={() => {
            if (imageSrc !== PLACEHOLDER_IMAGE_URL) {
              setImageSrc(PLACEHOLDER_IMAGE_URL);
            }
          }}
        />
      </div>
    
      <div className="flex flex-col h-full p-3 sm:p-4">
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
              {item.description.length > 120 ? `${item.description.slice(0, 117)}...` : item.description}
            </p>
          )}
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
          {item.seals && item.seals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.seals.slice(0, 2).map((sealId) => {
                const seal = getSealById(sealId);
                if (!seal) return null;
                return (
                  <span
                    key={seal.id}
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm"
                    style={{
                      backgroundColor: seal.color,
                      boxShadow: `0 2px 8px ${seal.color}33`,
                    }}
                  >
                    {seal.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-auto">
          <button
            type="button"
            className="w-full rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={(event) => {
              event.stopPropagation();
              onClick(item);
            }}
          >
            Ver mais
          </button>
        </div>
      </div>
    </motion.div>
  );
});

EventItemCard.displayName = 'EventItemCard';
