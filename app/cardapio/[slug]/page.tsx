
 
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdLocationOn, MdArrowBack, MdClose, MdMenu } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive'; // Importação do hook
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics';

import ImageSlider from '../../components/ImageSlider/ImageSlider';
import { scrollToSection } from '../../utils/scrollToSection';

// Constantes dos selos
const FOOD_SEALS: { [key: string]: { name: string; color: string } } = {
  'especial-do-dia': { name: 'Especial do Dia', color: '#FF6B35' },
  'vegetariano': { name: 'Vegetariano', color: '#4CAF50' },
  'saudavel-leve': { name: 'Saudável/Leve', color: '#8BC34A' },
  'prato-da-casa': { name: 'Prato da Casa', color: '#FF9800' },
  'artesanal': { name: 'Artesanal', color: '#795548' },
};

const DRINK_SEALS: { [key: string]: { name: string; color: string } } = {
  'assinatura-bartender': { name: 'Assinatura do Bartender', color: '#9C27B0' },
  'edicao-limitada': { name: 'Edição Limitada', color: '#E91E63' },
  'processo-artesanal': { name: 'Processo Artesanal', color: '#673AB7' },
  'sem-alcool': { name: 'Sem Álcool', color: '#00BCD4' },
  'refrescante': { name: 'Refrescante', color: '#00E5FF' },
  'citrico': { name: 'Cítrico', color: '#FFEB3B' },
  'doce': { name: 'Doce', color: '#FFC107' },
  'picante': { name: 'Picante', color: '#F44336' },
};

const ALL_SEALS = { ...FOOD_SEALS, ...DRINK_SEALS };

// Função para obter selo por ID, incluindo customizados do bar
const getSealById = (sealId: string, bar?: BarFromAPI) => {
  // Primeiro tenta nos selos padrão
  if (ALL_SEALS[sealId]) {
    // Se o bar tem custom_seals e esse selo está customizado, usa o customizado
    if (bar?.custom_seals) {
      const customSeal = bar.custom_seals.find((s) => s.id === sealId);
      if (customSeal) {
        return { name: customSeal.name, color: customSeal.color };
      }
    }
    return ALL_SEALS[sealId];
  }
  
  // Se não encontrou nos padrão, tenta nos customizados
  if (bar?.custom_seals) {
    const customSeal = bar.custom_seals.find((s) => s.id === sealId);
    if (customSeal) {
      return { name: customSeal.name, color: customSeal.color };
    }
  }
  
  return null;
};

// Interfaces
type MenuDisplayStyle = 'normal' | 'clean';

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
  seals?: string[];
  visible?: boolean | number | null;
}

interface MenuCategory {
  id: string | number;
  name: string;
  barId: string | number;
  order: number;
  items: MenuItem[];
}

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
  // 🎨 Campos de personalização de cores
  menu_category_bg_color?: string;
  menu_category_text_color?: string;
  menu_subcategory_bg_color?: string;
  menu_subcategory_text_color?: string;
  mobile_sidebar_bg_color?: string;
  mobile_sidebar_text_color?: string;
  custom_seals?: Array<{ id: string; name: string; color: string; type: 'food' | 'drink' }>;
  menu_display_style?: MenuDisplayStyle;
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
  // 🎨 Campos de personalização de cores
  menu_category_bg_color?: string;
  menu_category_text_color?: string;
  menu_subcategory_bg_color?: string;
  menu_subcategory_text_color?: string;
  mobile_sidebar_bg_color?: string;
  mobile_sidebar_text_color?: string;
  custom_seals?: Array<{ id: string; name: string; color: string; type: 'food' | 'drink' }>;
  menu_display_style: MenuDisplayStyle;
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
  // Verificar se filename é válido
  if (!filename || typeof filename !== 'string' || filename.trim() === '' || filename === 'null' || filename === 'undefined') {
    return PLACEHOLDER_IMAGE_URL;
  }
  
  // Se já é uma URL completa, retornar como está
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // Remover barras iniciais se houver
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  
  // Construir URL completa
  const fullUrl = `${BASE_IMAGE_URL}${cleanFilename}`;
  
  // Validar URL
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch (e) {
    console.warn('URL de imagem inválida:', filename, '-> usando placeholder');
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

export default function CardapioBarPage({ params }: CardapioBarPageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const { trackClick, trackMenuItemClick, trackMenuItemView, trackCategoryView, trackMenuPageView } = useGoogleAnalytics();

  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [menuCategories, setMenuCategories] = useState<GroupedCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
  const trackedCategoryRef = useRef<string>('');
  const trackedSubcategoryRef = useRef<string>('');
  const selectedBarRef = useRef<Bar | null>(null);

  // Hook para verificar se a tela é mobile
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const isCleanStyle = useMemo(() => {
    if (!selectedBar) return false;
    return (
      selectedBar.menu_display_style === 'clean' ||
      (selectedBar.slug === 'reserva-rooftop' && selectedBar.menu_display_style !== 'normal')
    );
  }, [selectedBar]);

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    
    // Rastrear clique no item do cardápio
    if (selectedBar) {
      const pageLocation = typeof window !== 'undefined' ? window.location.href : `/cardapio/${slug}`;
      const category = menuCategories.find(cat => 
        cat.subCategories.some(sub => 
          sub.items.some(i => i.id === item.id)
        )
      );
      const categoryName = category?.name || 'Sem categoria';
      
      trackMenuItemClick(
        item.name,
        item.id,
        selectedBar.name,
        slug,
        categoryName,
        item.price,
        pageLocation
      );
    }
  }, [setSelectedItem, selectedBar, menuCategories, slug, trackMenuItemClick]);

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
        facebook: bar.facebook || '',
        instagram: bar.instagram || '',
        whatsapp: bar.whatsapp || '',
        custom_seals: bar.custom_seals || [],
        menu_display_style: bar.menu_display_style === 'clean' ? 'clean' : 'normal',
      };
      
      setSelectedBar(barWithImages);
      selectedBarRef.current = barWithImages;

      const [categoriesResponse, itemsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`)
      ]);

      if (!categoriesResponse.ok || !itemsResponse.ok) throw new Error('Erro ao carregar dados do cardápio');

      const [categories, items] = await Promise.all([
        categoriesResponse.json(),
        itemsResponse.json()
      ]);

      // Normalizar IDs para comparação (pode ser string ou number)
      const normalizedBarId = String(bar.id);
      const barCategories = categories.filter((cat: MenuCategory) => String(cat.barId) === normalizedBarId);
      const barItems = items.filter((item: MenuItem) => {
        // Filtrar por barId e apenas itens visíveis (visible === 1 ou true ou null/undefined)
        const matchesBar = String(item.barId) === normalizedBarId;
        const isVisible = item.visible === undefined || item.visible === null || item.visible === 1 || item.visible === true;
        return matchesBar && isVisible;
      });
      
      console.log('🔍 Debug fetchBarData:', {
        slug,
        barId: bar.id,
        normalizedBarId,
        totalCategories: categories.length,
        totalItems: items.length,
        barCategoriesCount: barCategories.length,
        barItemsCount: barItems.length,
        sampleItems: barItems.slice(0, 3).map((i: MenuItem) => ({ id: i.id, name: i.name, barId: i.barId, visible: i.visible }))
      });

      const groupedCategories = barCategories.map((category: MenuCategory) => {
        const normalizedCategoryId = String(category.id);
        const categoryItems = barItems.filter((item: MenuItem) => String(item.categoryId) === normalizedCategoryId);
        return {
          ...category,
          subCategories: groupItemsBySubcategory(categoryItems)
        };
      });
      
      console.log('📊 Categorias agrupadas:', {
        totalCategories: groupedCategories.length,
        categoriesWithItems: groupedCategories.filter((c: GroupedCategory) => c.subCategories.some((sub: { name: string; items: MenuItem[] }) => sub.items.length > 0)).length,
        categories: groupedCategories.map((c: GroupedCategory) => ({
          id: c.id,
          name: c.name,
          itemsCount: c.subCategories.reduce((sum: number, sub: { name: string; items: MenuItem[] }) => sum + sub.items.length, 0)
        }))
      });

      setMenuCategories(groupedCategories);
      
      if (groupedCategories.length > 0) {
        setSelectedCategory(groupedCategories[0].name);
      }

      // Rastrear visualização da página do cardápio
      const pageLocation = typeof window !== 'undefined' ? window.location.href : `/cardapio/${slug}`;
      trackMenuPageView(barWithImages.name, slug, pageLocation);

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
  }, [menuCategories.length, isMobile, isCleanStyle]);

  // Rastreamento de categoria/subcategoria agora é feito diretamente no IntersectionObserver
  // para evitar re-renders. Este useEffect foi removido.

  useEffect(() => {
    if (selectedBar && selectedBar.popupImageUrl && selectedBar.popupImageUrl.trim() !== '') {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    return undefined; 
  }, [selectedBar]);


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

  const stickyCategoryOffset = useMemo(
    () => Math.max(headerHeight, 0),
    [headerHeight]
  );

  const stickySubcategoryOffset = useMemo(
    () => stickyCategoryOffset + Math.max(categoryBarHeight, 0),
    [stickyCategoryOffset, categoryBarHeight]
  );

  // Função para atualizar visualmente os botões sem re-render (ZERO re-render do React)
  // Esta função é usada tanto no IntersectionObserver quanto nos cliques
  const updateActiveButton = useCallback((categoryName: string, subcategoryName: string) => {
      const bar = selectedBarRef.current;
      const activeSubcategoryKey = `${categoryName}-${subcategoryName}`;
      
      // 1. Atualizar botões de CATEGORIA PRINCIPAL via DOM direto
      categoryMenuRefs.current.forEach((button, key) => {
        if (!button) return;
        const isActive = key === categoryName;
        
        if (isActive) {
          // Botão ativo: aplicar cores do selectedBar
          if (bar) {
            button.style.backgroundColor = bar.menu_category_bg_color || '#3b82f6';
            button.style.color = bar.menu_category_text_color || '#ffffff';
          } else {
            button.style.backgroundColor = '#3b82f6';
            button.style.color = '#ffffff';
          }
          button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          button.classList.add('active-category');
        } else {
          // Botão inativo: voltar para padrão
          if (bar?.menu_display_style === 'clean') {
            button.style.backgroundColor = '#f6efe3';
            button.style.color = '#403a31';
          } else {
            button.style.backgroundColor = '#ffffff';
            button.style.color = '#374151';
          }
          button.style.boxShadow = '';
          button.classList.remove('active-category');
        }
      });
      
      // 2. Atualizar botões de SUBCATEGORIA via DOM direto
      subcategoryMenuRefs.current.forEach((button, key) => {
        if (!button) return;
        const isActive = key === activeSubcategoryKey;
        
        if (isActive) {
          // Botão ativo: aplicar cores do selectedBar
          if (bar) {
            button.style.backgroundColor = bar.menu_subcategory_bg_color || '#3b82f6';
            button.style.color = bar.menu_subcategory_text_color || '#ffffff';
          } else {
            button.style.backgroundColor = '#3b82f6';
            button.style.color = '#ffffff';
          }
          button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          button.classList.add('active-subcategory');
        } else {
          // Botão inativo: voltar para padrão
          button.style.backgroundColor = '';
          button.style.color = '';
          button.style.boxShadow = '';
          button.classList.remove('active-subcategory');
        }
      });

      // 3. Auto-scroll horizontal no menu de subcategorias
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
  }, []);

  // Intersection Observer para ScrollSpy das subcategorias
  useEffect(() => {
    if (typeof window === 'undefined' || menuCategories.length === 0) return;

    // Limpar observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Ignorar atualizações durante scroll programático
        if (isScrollingProgrammatically.current) return;

        // Encontrar a entrada que está mais próxima do topo da viewport
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

        // Se encontrou uma entrada, atualizar a subcategoria ativa
        if (closestEntry) {
          const target = closestEntry.target;
          if (!(target instanceof HTMLElement)) return;
          const subcategoryName = target.getAttribute('data-subcategory-name');
          const categoryName = target.getAttribute('data-category-name');

          if (subcategoryName && categoryName) {
            // Verificar se realmente mudou antes de atualizar
            if (
              currentActiveCategoryRef.current !== categoryName ||
              currentActiveSubcategoryRef.current !== subcategoryName
            ) {
              // Atualizar refs imediatamente
              currentActiveCategoryRef.current = categoryName;
              currentActiveSubcategoryRef.current = subcategoryName;

              // Atualizar visualmente SEM RE-RENDER (DOM direto apenas)
              updateActiveButton(categoryName, subcategoryName);

              // Rastreamento de Analytics (sem causar re-render)
              if (
                trackedCategoryRef.current !== categoryName ||
                trackedSubcategoryRef.current !== subcategoryName
              ) {
                trackedCategoryRef.current = categoryName;
                trackedSubcategoryRef.current = subcategoryName;
                
                const bar = selectedBarRef.current;
                if (bar) {
                  const pageLocation = typeof window !== 'undefined' ? window.location.href : `/cardapio/${slug}`;
                  trackCategoryView(
                    categoryName,
                    subcategoryName,
                    bar.name,
                    slug,
                    pageLocation
                  );
                }
              }
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

    // Observar todas as seções de subcategorias já registradas
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
  }, [menuCategories, stickySubcategoryOffset]);

  // Função auxiliar para registrar refs de subcategorias
  const registerSubcategoryRef = useCallback((categoryName: string, subcategoryName: string, element: HTMLDivElement | null) => {
    if (element) {
      subcategoryRefs.current.set(`${categoryName}-${subcategoryName}`, element);
      // Observar o elemento imediatamente se o observer já existir
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

  // Função auxiliar para registrar refs dos botões do menu de subcategorias
  const registerSubcategoryMenuRef = useCallback((categoryName: string, subcategoryName: string, element: HTMLButtonElement | null) => {
    if (element) {
      subcategoryMenuRefs.current.set(`${categoryName}-${subcategoryName}`, element);
    } else {
      subcategoryMenuRefs.current.delete(`${categoryName}-${subcategoryName}`);
    }
  }, []);

  // Função auxiliar para registrar refs dos botões do menu de categorias principais
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

    // Marcar que estamos fazendo scroll programático
    isScrollingProgrammatically.current = true;

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const targetPosition = Math.max(elementPosition - offset, 0);

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Resetar a flag após o scroll terminar
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 1000);
  }, []);


  // Vinhos - listas auxiliares para renderização
  const WINE_COUNTRIES = [
    { id: 'vinho:pais:brasil', label: 'Brasil', emoji: '🇧🇷' },
    { id: 'vinho:pais:franca', label: 'França', emoji: '🇫🇷' },
    { id: 'vinho:pais:argentina', label: 'Argentina', emoji: '🇦🇷' },
    { id: 'vinho:pais:portugal', label: 'Portugal', emoji: '🇵🇹' },
    { id: 'vinho:pais:chile', label: 'Chile', emoji: '🇨🇱' },
    { id: 'vinho:pais:italia', label: 'Itália', emoji: '🇮🇹' },
    { id: 'vinho:pais:espanha', label: 'Espanha', emoji: '🇪🇸' },
  ];
  const WINE_TYPES = [
    { id: 'vinho:tipo:champagne', label: 'Champagne', color: '#A7D3F2' },
    { id: 'vinho:tipo:espumante', label: 'Espumante', color: '#B8E1FF' },
    { id: 'vinho:tipo:branco', label: 'Branco', color: '#F3FAD7' },
    { id: 'vinho:tipo:rose', label: 'Rosé', color: '#FFD1DC' },
    { id: 'vinho:tipo:tinto', label: 'Tinto', color: '#B71C1C' },
  ];

  const renderWineSeal = (sealId: string, size: 'card' | 'modal') => {
    if (sealId.startsWith('vinho:pais:')) {
      const c = WINE_COUNTRIES.find(x => x.id === sealId);
      if (!c) return null;
      return (
        <span key={sealId} className={`${size === 'modal' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 border border-gray-300 shadow-sm`}>
          <span className="mr-1">{c.emoji}</span>
          País: {c.label}
        </span>
      );
    }
    if (sealId.startsWith('vinho:tipo:')) {
      const t = WINE_TYPES.find(x => x.id === sealId);
      if (!t) return null;
      return (
        <span key={sealId} className={`${size === 'modal' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} inline-flex items-center rounded-full font-semibold text-gray-900`} style={{ backgroundColor: `${t.color}44`, boxShadow: `0 2px 8px ${t.color}40` }}>
          <span className="inline-block w-2.5 h-2.5 mr-2 rounded" style={{ backgroundColor: t.color }} />
          Tipo: {t.label}
        </span>
      );
    }
    if (sealId.startsWith('vinho:safra:')) {
      const safra = sealId.split(':')[2] || '';
      if (!safra) return null;
      return (
        <span key={sealId} className={`${size === 'modal' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 border border-gray-300 shadow-sm`}>
          <span className="mr-1">🍇</span>
          Safra: {safra}
        </span>
      );
    }
    if (sealId.startsWith('vinho:local:')) {
      const local = decodeURIComponent(sealId.split(':')[2] || '');
      if (!local) return null;
      return (
        <span key={sealId} className={`${size === 'modal' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} inline-flex items-center rounded-full font-semibold bg-white text-gray-800 border border-gray-300 shadow-sm`}>
          <span className="mr-1">📍</span>
          Local: {local}
        </span>
      );
    }
    return null;
  };

  // Componente para renderizar selos no modal - Versão otimizada para mobile
  const renderModalSeals = useCallback((seals: string[]) => {
    if (!seals || seals.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {seals.map((sealId) => {
          const wine = renderWineSeal(sealId, 'modal');
          if (wine) return wine;
          const seal = getSealById(sealId, selectedBar as BarFromAPI);
          if (!seal) return null;
          return (
            <span
              key={sealId}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
    );
  }, [selectedBar]);

  // Componente para rastrear visualização de item
  const MenuItemCardWithTracking = React.memo(({ 
    item, 
    onClick, 
    selectedBar, 
    menuCategories, 
    slug,
    formatPrice,
    trackMenuItemView,
    getValidImageUrl,
    renderWineSeal,
    getSealById
  }: { 
    item: MenuItem; 
    onClick: (item: MenuItem) => void;
    selectedBar: Bar | null;
    menuCategories: GroupedCategory[];
    slug: string;
    formatPrice: (price: number) => string;
    trackMenuItemView: (itemName: string, itemId: string | number, establishmentName: string, establishmentSlug: string, category: string, price: number, pageLocation: string) => void;
    getValidImageUrl: (filename?: string | null) => string;
    renderWineSeal: (sealId: string, type: 'card' | 'modal') => JSX.Element | null;
    getSealById: (sealId: string, bar?: BarFromAPI) => { name: string; color: string } | null;
  }) => {
    const isReservaRooftop = selectedBar?.slug === 'reserva-rooftop';
    const isCleanStyle =
      selectedBar?.menu_display_style === 'clean' ||
      (isReservaRooftop && selectedBar?.menu_display_style !== 'normal');
    const itemRef = React.useRef<HTMLDivElement>(null);
    const hasTrackedView = React.useRef(false);
    const hasAnimated = React.useRef(false);
    
    // Rastrear visualização quando o item aparece na tela
    React.useEffect(() => {
      if (!itemRef.current || hasTrackedView.current || !selectedBar) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasTrackedView.current) {
              hasTrackedView.current = true;
              
              const category = menuCategories.find(cat => 
                cat.subCategories.some(sub => 
                  sub.items.some(i => i.id === item.id)
                )
              );
              const categoryName = category?.name || 'Sem categoria';
              const pageLocation = typeof window !== 'undefined' ? window.location.href : `/cardapio/${slug}`;
              
              trackMenuItemView(
                item.name,
                item.id,
                selectedBar.name,
                slug,
                categoryName,
                item.price,
                pageLocation
              );
              
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      
      observer.observe(itemRef.current);
      
      return () => {
        if (itemRef.current) {
          observer.unobserve(itemRef.current);
        }
      };
    }, [item, selectedBar, slug, menuCategories, trackMenuItemView]);
    
    return (
      <motion.div
        ref={itemRef}
        initial={hasAnimated.current ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={() => {
          if (!hasAnimated.current) {
            hasAnimated.current = true;
          }
        }}
        className={`menu-item-card cursor-pointer overflow-hidden transition-all duration-300 ${
          isCleanStyle
            ? 'rounded-[28px] border border-[#d7c4a2] bg-[#f9f5ed]/95 shadow-[0_18px_38px_rgba(25,18,10,0.18)] hover:shadow-[0_28px_60px_rgba(25,18,10,0.28)]'
            : 'bg-white rounded-lg shadow-lg hover:shadow-xl'
        } ${isCleanStyle ? 'backdrop-blur-[2px]' : ''}`}
        onClick={() => onClick(item)}
      >
        <div
          className={`relative overflow-hidden ${
            isCleanStyle ? 'h-32 sm:h-36 md:h-40 lg:h-44' : 'h-48'
          } ${isCleanStyle ? 'border-b border-[#e7d9c3]' : ''}`}
        >
          <Image
            src={getValidImageUrl(item.imageUrl)}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover ${isCleanStyle ? 'scale-[1.02]' : ''}`}
          />
        </div>
      
        <div className={`flex flex-col gap-4 h-full p-3 sm:p-4 ${isCleanStyle ? 'sm:p-6' : ''}`}>
          <div className="space-y-2">
            <h3
              className={`mb-1 line-clamp-2 ${
                isCleanStyle
                  ? 'font-serif text-[1rem] font-semibold tracking-[0.12em] text-[#2b241a]'
                  : 'text-base sm:text-lg font-semibold text-gray-800'
              }`}
            >
              {item.name}
            </h3>
            {!isReservaRooftop && (
              <p
                className={`mb-2 font-semibold ${
                  isCleanStyle
                    ? 'text-[0.8rem] tracking-[0.14em] uppercase text-[#4a3c2d]'
                    : 'text-sm sm:text-base text-gray-700'
                }`}
              >
                {formatPrice(item.price)}
              </p>
            )}
            <p
              className={`${isCleanStyle ? 'text-[0.72rem]' : 'text-xs sm:text-sm'} ${
                isCleanStyle ? 'text-[#7a6d5b] leading-relaxed' : 'text-gray-600'
              }`}
            >
              {item.description.length > 120 ? `${item.description.slice(0, 117)}...` : item.description}
            </p>
            {item.seals && item.seals.length > 0 && (
              <div className={`flex flex-wrap gap-1.5 ${isCleanStyle ? 'gap-2' : ''}`}>
                {item.seals.slice(0, 2).map((sealId) => {
                  const wine = renderWineSeal(sealId, 'card');
                  if (wine) return wine;
                  const seal = getSealById(sealId, selectedBar as BarFromAPI);
                  if (!seal) return null;
                  return (
                    <span
                      key={sealId}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm ${
                        isCleanStyle ? 'uppercase tracking-[0.14em] text-[0.58rem] bg-[#3b3225]/80' : ''
                      }`}
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
            <div>
              <button
                type="button"
                className={`w-full rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                  isCleanStyle
                    ? 'bg-[#e9ddc8] text-[#2f251b] hover:bg-[#ddcfb3]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClick(item);
                }}
              >
                Ver mais
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  });

  const MenuItemCard = useCallback(({ item, onClick }: { item: MenuItem, onClick: (item: MenuItem) => void }) => {
    return (
      <MenuItemCardWithTracking
        item={item}
        onClick={onClick}
        selectedBar={selectedBar}
        menuCategories={menuCategories}
        slug={slug}
        formatPrice={formatPrice}
        trackMenuItemView={trackMenuItemView}
        getValidImageUrl={getValidImageUrl}
        renderWineSeal={renderWineSeal}
        getSealById={getSealById}
      />
    );
  }, [formatPrice, selectedBar, menuCategories, slug, trackMenuItemView, getValidImageUrl, renderWineSeal, getSealById]);

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
  
  const isReservaRooftop = selectedBar.slug === 'reserva-rooftop';
  const categorySelectedBg =
    selectedBar.menu_category_bg_color ||
    (isCleanStyle ? '#1f1b16' : '#3b82f6');
  const categorySelectedText =
    selectedBar.menu_category_text_color ||
    (isCleanStyle ? '#f5ede1' : '#ffffff');
  const categoryUnselectedBg = isCleanStyle ? '#f6efe3' : '#ffffff';
  const categoryUnselectedText = isCleanStyle ? '#403a31' : '#374151';

  return (
    <div
      className={`cardapio-page min-h-screen ${
        isCleanStyle ? 'bg-[#f3eee4]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}
    >
      <style jsx>{`
        .seal-badge-mobile {
          font-size: 0.7rem;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .seal-badge-mobile:hover {
          transform: scale(1.05);
        }
        
        @media (max-width: 640px) {
          .seal-badge-mobile {
            font-size: 0.65rem;
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            font-weight: 600;
          }
        }
        
        @media (min-width: 641px) {
          .seal-badge-mobile {
            font-size: 0.75rem;
            padding: 0.4rem 0.8rem;
            border-radius: 18px;
          }
        }
        
        .menu-item-card {
          transition: all 0.3s ease;
        }
        
        .menu-item-card:hover {
          transform: translateY(-2px);
        }
        
        @media (max-width: 640px) {
          .menu-item-card {
            min-height: 280px;
          }
        }
        
        .price-badge {
          z-index: 10;
        }
      `}</style>
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
          isCleanStyle ? 'text-[#342b22]' : ''
        }`}
      >
        
        <div className="mb-6">
          <div
            className={`bar-header overflow-hidden ${
              isCleanStyle
                ? 'rounded-[32px] border border-[#eadfca] bg-[#fbf8f1] shadow-[0_35px_90px_rgba(17,24,39,0.08)]'
                : 'bg-white rounded-xl shadow-lg'
            }`}
          >
            <div className={`relative ${isCleanStyle ? 'h-72 md:h-[22rem]' : 'h-64 md:h-80'}`}>
              <ImageSlider images={selectedBar.coverImages} />
              <div
                className={`absolute inset-0 ${
                  isCleanStyle
                    ? 'bg-gradient-to-t from-black/60 via-black/15 to-transparent md:from-black/40'
                    : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                }`}
              />
              
              <div 
                className={`logo-container absolute top-4 left-4 cursor-pointer md:cursor-default ${
                  isCleanStyle
                    ? 'rounded-2xl border border-white/70 bg-white/80 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl'
                    : 'p-2 bg-white rounded-xl shadow-md'
                }`}
                onClick={() => window.innerWidth < 768 && setShowMobileSidebar(true)}
              >
                <Image
                  src={getValidImageUrl(selectedBar.logoUrl)}
                  alt={`${selectedBar.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
                
                <div className="menu-indicator absolute -top-1 -right-1 md:hidden">
                  <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                    <MdMenu className="menu-icon w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="bar-content absolute bottom-6 left-6 right-6 hidden md:block">
                <h1
                  className={`mb-3 ${
                    isCleanStyle
                      ? 'text-[2.6rem] tracking-[0.32em] uppercase text-white drop-shadow-[0_14px_38px_rgba(0,0,0,0.55)]'
                      : 'text-white text-3xl md:text-4xl font-bold'
                  }`}
                >
                  {selectedBar.name}
                </h1>
                <p
                  className={`mb-3 ${
                    isCleanStyle
                      ? 'text-white/80 text-base leading-relaxed max-w-2xl tracking-[0.08em]'
                      : 'text-white/90 text-lg'
                  }`}
                >
                  {selectedBar.description}
                </p>
                
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
          // Menu de categorias fixo (visível em todas as telas)
          <div
            ref={categoryBarRef}
            className={`sticky z-40 ${
              isCleanStyle
                ? 'bg-[#f6f4ee]/95 backdrop-blur-sm'
                : 'bg-gradient-to-br from-gray-50 to-gray-100'
            }`}
            style={{ top: `${stickyCategoryOffset}px` }}
          >
            {/* Indicador de categoria ativa */}
            <div
              className={`text-center py-2 px-4 ${
                isCleanStyle
                  ? 'bg-[#efe6d8] border-b border-[#e1d6c0]'
                  : isReservaRooftop
                    ? 'bg-green-50 border-b border-green-200'
                    : 'bg-blue-50 border-b border-blue-200'
              }`}
            >
              <span
                className={`${
                  isCleanStyle
                    ? 'text-[0.7rem] text-[#7b6a55] tracking-[0.14em] uppercase font-semibold'
                    : 'text-sm text-gray-600'
                }`}
              >
                {isCleanStyle ? 'Categoria atual' : ''}
                <span
                  className="font-bold"
                  style={{
                    color: isCleanStyle
                      ? '#221d17'
                      : isReservaRooftop
                        ? '#0c190c'
                        : undefined,
                  }}
                >
                  {selectedCategory}
                </span>
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
                        
                        // Rastrear visualização de categoria
                        if (selectedBar) {
                          const pageLocation = typeof window !== 'undefined' ? window.location.href : `/cardapio/${slug}`;
                          trackCategoryView(
                            category.name,
                            null,
                            selectedBar.name,
                            slug,
                            pageLocation
                          );
                        }
                        
                        scrollToIdWithOffset(
                          getCategoryDomId(category.name),
                          stickyCategoryOffset + Math.max(categoryBarHeight, 0) + 12
                        );
                    }}
                    className={`category-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                      isCleanStyle
                        ? 'px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em]'
                        : 'px-4 py-2 text-sm'
                    } ${
                      isCleanStyle
                        ? 'shadow-sm hover:shadow-md'
                        : 'hover:bg-gray-50 shadow-md'
                    } ${isCleanStyle ? 'border border-[#e7dbc4]/70 backdrop-blur-sm' : ''}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Banner de Decoração de Aniversário - Responsivo */}
        <div className="mt-8 mb-8">
          <Link 
            href="/decoracao-aniversario" 
            className="block"
            onClick={() => {
              // Rastrear clique no banner desktop
              if (window.innerWidth >= 768) {
                trackClick('banner-regua-desktop', `/cardapio/${slug}`, 'banner_click');
              } else {
                // Rastrear clique no banner mobile
                trackClick('banner-mobile', `/cardapio/${slug}`, 'banner_click');
              }
            }}
          >
            <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              {/* Banner Desktop - Visível apenas em telas médias e maiores (md: 768px+) */}
              <Image
                src="/banner-regua.jpg"
                alt="Decoração de Aniversário - Banner Promocional Desktop"
                width={1200}
                height={300}
                className="hidden md:block w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                priority
                sizes="(max-width: 767px) 0vw, 100vw"
              />
              {/* Banner Mobile - Visível apenas em telas pequenas (até 767px) */}
              <Image
                src="/banne-agilizai-mobile.jpg"
                alt="Decoração de Aniversário - Banner Promocional Mobile"
                width={600}
                height={400}
                className="block md:hidden w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                priority
                sizes="(max-width: 767px) 100vw, 0vw"
              />
              {/* Overlay gradiente para ambos os banners */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300"></div>
            </div>
          </Link>
        </div>
        
        {/*
          Renderização Condicional:
          No mobile, renderiza todas as categorias de uma vez (rolagem infinita).
          No desktop, mantém a renderização de uma categoria por vez com AnimatePresence.
        */}
        {isMobile ? (
          <div className="mt-8">
            {menuCategories.map((category) => (
              <div
                key={category.id}
                id={getCategoryDomId(category.name)} // ID para rolagem
                data-category-name={category.name}
              >
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
                  {category.name}
                </h2>
                
                {/* Menu de subcategorias fixo (apenas no mobile, para cada categoria) */}
                <div
                  className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                  style={{ top: `${stickySubcategoryOffset}px` }}
                >
                  {/* Indicador de subcategoria ativa */}
                  {/* Indicador da subcategoria ativa removido conforme solicitação */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {category.subCategories.map((subcat) => (
                      <button
                        key={subcat.name}
                        ref={(el) => registerSubcategoryMenuRef(category.name, subcat.name, el)}
                        onClick={() => {
                          // Atualizar estados (aceitável no clique)
                          setSelectedCategory(category.name);
                          setActiveSubcategory(subcat.name);
                          
                          // Atualizar refs
                          currentActiveCategoryRef.current = category.name;
                          currentActiveSubcategoryRef.current = subcat.name;
                          
                          // Atualizar visualmente imediatamente (DOM direto)
                          updateActiveButton(category.name, subcat.name);
                          
                          // Fazer scroll suave até a seção
                          scrollToIdWithOffset(
                            getSubcategoryDomId(category.name, subcat.name),
                            stickySubcategoryOffset + 12
                          );
                        }}
                        className={`subcategory-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                          isCleanStyle
                        ? 'px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em]'
                        : 'px-3 py-1.5 text-xs'
                        } hover:bg-gray-50`}
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {subcat.name}
                    </h3>
                    <div
                      className={`grid gap-3 sm:gap-4 ${
                        isCleanStyle
                          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                          : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                      }`}
                    >
                      {subcat.items.map((item) => (
                        <MenuItemCard key={item.id} item={item} onClick={handleItemClick} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
) : (
        // # INÍCIO DA CORREÇÃO
        // Agora o desktop também renderiza TODAS as categorias de uma vez.
        <div className="mt-8">
          {menuCategories.map((category) => (
            <div
              key={category.id}
              id={getCategoryDomId(category.name)} // ID para rolagem
              data-category-name={category.name}
            >
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">
                {category.name}
              </h2>

              {/* Menu de subcategorias fixo (desktop) */}
              <div
                className="sticky z-30 bg-gradient-to-br from-gray-50 to-gray-100 pb-4 pt-2 -mt-4"
                style={{ top: `${stickySubcategoryOffset}px` }}
              >
                {/* Indicador de subcategoria ativa */}
                {/* Indicador da subcategoria ativa removido conforme solicitação */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {category.subCategories.map((subcat) => (
                    <button
                      key={subcat.name}
                      ref={(el) => registerSubcategoryMenuRef(category.name, subcat.name, el)}
                      onClick={() => {
                        // Atualizar estados (aceitável no clique)
                        setSelectedCategory(category.name);
                        setActiveSubcategory(subcat.name);
                        
                        // Atualizar refs
                        currentActiveCategoryRef.current = category.name;
                        currentActiveSubcategoryRef.current = subcat.name;
                        
                        // Atualizar visualmente imediatamente (DOM direto)
                        updateActiveButton(category.name, subcat.name);
                        
                        // Fazer scroll suave até a seção
                        scrollToIdWithOffset(
                          getSubcategoryDomId(category.name, subcat.name),
                          stickySubcategoryOffset + 12
                        );
                      }}
                      className={`subcategory-tab rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                        isCleanStyle
                          ? 'px-3 py-2 text-[0.7rem] uppercase tracking-[0.14em]'
                          : 'px-4 py-2 text-sm'
                      } bg-white text-gray-600 hover:bg-gray-50`}
                    >
                      {subcat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Itens da categoria (desktop) */}
              {category.subCategories.map((subcat) => (
                <div
                  key={subcat.name}
                  ref={(el) => registerSubcategoryRef(category.name, subcat.name, el)}
                  id={getSubcategoryDomId(category.name, subcat.name)}
                  data-subcategory-name={subcat.name}
                  data-category-name={category.name}
                  className="mt-8"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {subcat.name}
                  </h3>
                  <div
                    className={`grid gap-4 ${
                      isCleanStyle
                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
                        : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // Classes de grid do desktop mantidas
                    }`}
                  >
                    {subcat.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        // # FIM DA CORREÇÃO
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
              {/* Header do sidebar */}
              <div 
                className="sidebar-header p-6"
                style={{
                  backgroundColor: selectedBar.mobile_sidebar_bg_color || '#667eea',
                  color: selectedBar.mobile_sidebar_text_color || '#ffffff'
                }}
              >
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
                    className="transition-colors opacity-80 hover:opacity-100"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
                
                <p className="text-sm mb-4" style={{ opacity: 0.9 }}>
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
                              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                  {selectedItem.name}
                              </h2>
                              <p className="text-xl sm:text-2xl font-semibold text-green-600 mb-4">
                                  {formatPrice(selectedItem.price)}
                              </p>
                              <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
                                  {selectedItem.description}
                              </p>
                              
                              {/* Exibir selos no modal - Melhorado para mobile */}
                              {renderModalSeals(selectedItem.seals || [])}
                              
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
