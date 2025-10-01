'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdStar,
  MdLocationOn,
  MdUpload,
  MdSearch,
  MdSecurity,
} from 'react-icons/md';
import { useUserPermissions } from '../../hooks/useUserPermissions';

// Interfaces atualizadas para corresponder à API
interface Topping {
  id: string | number;
  name: string;
  price: number;
}

interface MenuCategory {
    id: string | number;
    name: string;
    barId: string | number;
    order: number;
    items?: MenuItem[]; // Adicionado para incluir itens
}

interface MenuSubCategory {
  id: string | number;
  name: string;
  categoryId: string | number;
  barId: string | number;
  order: number;
}

// Tipos para selos
type FoodSeal = 'especial-do-dia' | 'vegetariano' | 'saudavel-leve' | 'prato-da-casa' | 'artesanal';
type DrinkSeal = 'assinatura-bartender' | 'edicao-limitada' | 'processo-artesanal' | 'sem-alcool' | 'refrescante' | 'citrico' | 'doce' | 'picante';

interface Seal {
  id: string;
  name: string;
  color: string;
  type: 'food' | 'drink';
}

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  barId: string;
  subCategory: string; // Sub-categoria como string simples
  toppings: Topping[];
  order: number;
  seals: string[]; // IDs dos selos selecionados
}

interface MenuCategoryForm {
  name: string;
  barId: string;
  order: number;
  subCategories: { name: string; order: number }[]; // Adicionado para gerenciar sub-categorias
}

interface BarForm {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[]; // Adicionado para múltiplos uploads
  address: string;
  rating: string;
  reviewsCount: string;
  amenities: string[];
  latitude: string;
  longitude: string;
  popupImageUrl: string; // ✨ Adicionado
  facebook?: string; // <-- Adicionado
  instagram?: string; // <-- Adicionado
  whatsapp?: string; // <-- Adicionado
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
  subCategory?: string; // Sub-categoria como string simples
  subCategoryName?: string; // Nome da sub-categoria para exibição (mesmo que subCategory)
  toppings: Topping[];
  order: number;
  seals?: string[]; // IDs dos selos selecionados
}

// **CORREÇÃO**: Interface Bar atualizada para incluir os campos sociais
interface Bar {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  coverImages: string[]; // Adicionado para múltiplos uploads
  address: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  popupImageUrl?: string; // ✨ Adicionado
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    indeterminate?: boolean;
  }
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
const API_UPLOAD_URL = 'https://vamos-comemorar-api.onrender.com/api/images/upload';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/400x300';
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

// Constantes dos selos
const FOOD_SEALS: Seal[] = [
  { id: 'especial-do-dia', name: 'Especial do Dia', color: '#FF6B35', type: 'food' },
  { id: 'vegetariano', name: 'Vegetariano', color: '#4CAF50', type: 'food' },
  { id: 'saudavel-leve', name: 'Saudável/Leve', color: '#8BC34A', type: 'food' },
  { id: 'prato-da-casa', name: 'Prato da Casa', color: '#FF9800', type: 'food' },
  { id: 'artesanal', name: 'Artesanal', color: '#795548', type: 'food' },
];

const DRINK_SEALS: Seal[] = [
  { id: 'assinatura-bartender', name: 'Assinatura do Bartender', color: '#9C27B0', type: 'drink' },
  { id: 'edicao-limitada', name: 'Edição Limitada', color: '#E91E63', type: 'drink' },
  { id: 'processo-artesanal', name: 'Processo Artesanal', color: '#673AB7', type: 'drink' },
  { id: 'sem-alcool', name: 'Sem Álcool', color: '#00BCD4', type: 'drink' },
  { id: 'refrescante', name: 'Refrescante', color: '#00E5FF', type: 'drink' },
  { id: 'citrico', name: 'Cítrico', color: '#FFEB3B', type: 'drink' },
  { id: 'doce', name: 'Doce', color: '#FFC107', type: 'drink' },
  { id: 'picante', name: 'Picante', color: '#F44336', type: 'drink' },
];

const ALL_SEALS = [...FOOD_SEALS, ...DRINK_SEALS];

// Vinhos - opções especiais (serializadas em seals como vinho:*)
const WINE_COUNTRIES: { id: string; label: string; emoji: string }[] = [
  { id: 'vinho:pais:brasil', label: 'Brasil', emoji: '🇧🇷' },
  { id: 'vinho:pais:franca', label: 'França', emoji: '🇫🇷' },
  { id: 'vinho:pais:argentina', label: 'Argentina', emoji: '🇦🇷' },
  { id: 'vinho:pais:portugal', label: 'Portugal', emoji: '🇵🇹' },
  { id: 'vinho:pais:chile', label: 'Chile', emoji: '🇨🇱' },
  { id: 'vinho:pais:italia', label: 'Itália', emoji: '🇮🇹' },
  { id: 'vinho:pais:espanha', label: 'Espanha', emoji: '🇪🇸' },
];

const WINE_TYPES: { id: string; label: string; color: string }[] = [
  { id: 'vinho:tipo:champagne', label: 'Champagne', color: '#A7D3F2' },
  { id: 'vinho:tipo:espumante', label: 'Espumante', color: '#B8E1FF' },
  { id: 'vinho:tipo:branco', label: 'Branco', color: '#F3FAD7' },
  { id: 'vinho:tipo:rose', label: 'Rosé', color: '#FFD1DC' },
  { id: 'vinho:tipo:tinto', label: 'Tinto', color: '#B71C1C' },
];

const getValidImageUrl = (filename: string): string => {
  if (!filename || filename.trim() === '' || filename.startsWith('blob:')) {
    return PLACEHOLDER_IMAGE_URL;
  }
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${BASE_IMAGE_URL}${filename}`;
};

export default function CardapioAdminPage() {
  const { isAdmin, isPromoter, promoterBar, canManageBar } = useUserPermissions();
  const [activeTab, setActiveTab] = useState<'bars' | 'categories' | 'items'>('bars');
  const [showBarModal, setShowBarModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [menuData, setMenuData] = useState<{
    bars: Bar[];
    categories: MenuCategory[];
    subCategories: MenuSubCategory[];
    items: MenuItem[];
  }>({
    bars: [],
    categories: [],
    subCategories: [],
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<string | number>>([]);

  const [quickEditData, setQuickEditData] = useState<{
    barId: string | number;
    categoryId: string | number;
    subCategories: Array<{
      id: string | number;
      name: string;
      order: number;
      originalName: string;
      originalOrder: number;
      count?: number;
    }>;
  } | null>(null);

  const [barForm, setBarForm] = useState<BarForm>({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    coverImageUrl: '',
    coverImages: [],
    address: '',
    rating: '',
    reviewsCount: '',
    amenities: [],
    latitude: '',
    longitude: '',
    popupImageUrl: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
  });

  const [categoryForm, setCategoryForm] = useState<MenuCategoryForm>({
    name: '',
    barId: '',
    order: 0,
    subCategories: [],
  });

  const [itemForm, setItemForm] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    barId: '',
    subCategory: '',
    toppings: [],
    order: 0,
    seals: [],
  });

  const [newTopping, setNewTopping] = useState({ name: '', price: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [barsRes, categoriesRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bars`),
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/items`),
      ]);

      if (!barsRes.ok || !categoriesRes.ok || !itemsRes.ok) {
        throw new Error('Erro ao carregar dados da API');
      }

      const [bars, categories, items] = await Promise.all([
        barsRes.json(),
        categoriesRes.json(),
        itemsRes.json(),
      ]);

      const subCategories = items.reduce((acc: any[], item: any) => {
        if (item.subCategoryName && item.subCategoryName.trim() !== '') {
          const existing = acc.find(
            (sub) =>
              sub.name === item.subCategoryName &&
              sub.categoryId === item.categoryId &&
              sub.barId === item.barId,
          );
          if (!existing) {
            acc.push({
              id: `${item.categoryId}-${item.barId}-${item.subCategoryName}`,
              name: item.subCategoryName,
              categoryId: item.categoryId,
              barId: item.barId,
              order: 0,
            });
          }
        }
        return acc;
      }, []);

      let barsData = Array.isArray(bars)
        ? bars.map((bar) => {
            const cleanedBar = {
              ...bar,
              logoUrl: bar.logoUrl?.includes(BASE_IMAGE_URL)
                ? bar.logoUrl.split('/').pop()
                : bar.logoUrl,
              coverImageUrl: bar.coverImageUrl?.includes(BASE_IMAGE_URL)
                ? bar.coverImageUrl.split('/').pop()
                : bar.coverImageUrl,
              coverImages: Array.isArray(bar.coverImages)
                ? bar.coverImages.map((url: string) =>
                    url.includes(BASE_IMAGE_URL) ? url.split('/').pop() || '' : url,
                  )
                : [],
              popupImageUrl: bar.popupImageUrl?.includes(BASE_IMAGE_URL)
                ? bar.popupImageUrl.split('/').pop()
                : bar.popupImageUrl,
            };
            return cleanedBar;
          })
        : [];

      // Filtrar bares para promoters (só podem ver o seu bar)
      if (isPromoter && promoterBar) {
        barsData = barsData.filter((bar) => Number(bar.id) === Number(promoterBar.barId));
      }

      let categoriesData = Array.isArray(categories) ? categories : [];
      let subCategoriesData = Array.isArray(subCategories) ? subCategories : [];
      let itemsData = Array.isArray(items)
        ? items.map((item) => {
            const cleanedItem = {
              ...item,
              imageUrl: item.imageUrl?.includes(BASE_IMAGE_URL)
                ? item.imageUrl.split('/').pop()
                : item.imageUrl,
            };
            return cleanedItem;
          })
        : [];

      // Filtrar categorias e itens para promoters (só podem ver os do seu bar)
      if (isPromoter && promoterBar) {
        categoriesData = categoriesData.filter(
          (category) => Number(category.barId) === Number(promoterBar.barId),
        );
        itemsData = itemsData.filter((item) => Number(item.barId) === Number(promoterBar.barId));
      }

      setMenuData({
        bars: barsData,
        categories: categoriesData,
        subCategories: subCategoriesData,
        items: itemsData,
      });
      setSelectedItems([]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [isPromoter, promoterBar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }, []);

  const handleAddTopping = useCallback(() => {
    if (newTopping.name && newTopping.price) {
      const topping: Topping = {
        id: Date.now().toString(),
        name: newTopping.name,
        price: parseFloat(newTopping.price),
      };
      setItemForm((prev: MenuItemForm) => ({
        ...prev,
        toppings: [...prev.toppings, topping],
      }));
      setNewTopping({ name: '', price: '' });
    }
  }, [newTopping]);

  const handleRemoveTopping = useCallback((toppingId: string) => {
    setItemForm((prev: MenuItemForm) => ({
      ...prev,
      toppings: prev.toppings.filter((t) => t.id !== toppingId),
    }));
  }, []);

  // Funções para gerenciar selos
  const handleToggleSeal = useCallback((sealId: string) => {
    setItemForm((prev: MenuItemForm) => ({
      ...prev,
      seals: prev.seals.includes(sealId)
        ? prev.seals.filter((id) => id !== sealId)
        : [...prev.seals, sealId],
    }));
  }, []);

  const getSealById = useCallback((sealId: string) => {
    return ALL_SEALS.find((seal) => seal.id === sealId);
  }, []);

  // Componente para renderizar selos de um item
  const renderItemSeals = useCallback((seals: string[]) => {
    if (!seals || seals.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {seals.map((sealId) => {
          // Renderização especial para vinhos
          if (sealId.startsWith('vinho:pais:')) {
            const country = WINE_COUNTRIES.find(c => c.id === sealId);
            if (!country) return null;
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border" style={{ borderColor: '#8883' }}>
                <span>{country.emoji}</span>
                <span>País: {country.label}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:tipo:')) {
            const type = WINE_TYPES.find(t => t.id === sealId);
            if (!type) return null;
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border" style={{ backgroundColor: `${type.color}44`, borderColor: `${type.color}77`, color: '#333' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: type.color }} />
                <span>Tipo: {type.label}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:safra:')) {
            const safra = sealId.split(':')[2] || '';
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border border-gray-300 text-gray-700">
                <span>🍇</span>
                <span>Safra: {safra}</span>
              </span>
            );
          }
          if (sealId.startsWith('vinho:local:')) {
            const local = decodeURIComponent(sealId.split(':')[2] || '');
            return (
              <span key={sealId} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border border-gray-300 text-gray-700">
                <span>📍</span>
                <span>Local: {local}</span>
              </span>
            );
          }

          const seal = getSealById(sealId);
          if (!seal) return null;
          return (
            <span
              key={sealId}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: seal.color }}
            >
              {seal.name}
            </span>
          );
        })}
      </div>
    );
  }, [getSealById]);

  const handleCloseBarModal = useCallback(() => {
    setShowBarModal(false);
    setEditingBar(null);
    setBarForm({
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      coverImageUrl: '',
      coverImages: [],
      address: '',
      rating: '',
      reviewsCount: '',
      amenities: [],
      latitude: '',
      longitude: '',
      popupImageUrl: '',
      facebook: '',
      instagram: '',
      whatsapp: '',
    });
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', barId: '', order: 0, subCategories: [] });
  }, []);

  const handleCloseItemModal = useCallback(() => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: '',
      barId: '',
      subCategory: '',
      toppings: [],
      order: 0,
      seals: [],
    });
    setNewTopping({ name: '', price: '' });
  }, []);

  const handleOpenQuickEditModal = async (barId: string | number, categoryId: string | number) => {
    const category = menuData.categories.find((c) => c.id === categoryId);
    const bar = menuData.bars.find((b) => b.id === barId);

    if (!category || !bar) return;

    try {
      // Buscar subcategorias da nova API
      const response = await fetch(`${API_BASE_URL}/subcategories/category/${categoryId}`);

      if (!response.ok) {
        console.warn('API endpoint não disponível, usando dados locais');
        // Fallback: usar dados locais se a API não estiver disponível
        const itemsInCategory = menuData.items.filter(
          (item) => item.categoryId === categoryId && item.barId === barId,
        );

        const uniqueSubCategories = new Map();
        itemsInCategory.forEach((item) => {
          if (item.subCategoryName && item.subCategoryName.trim() !== '') {
            if (!uniqueSubCategories.has(item.subCategoryName)) {
              uniqueSubCategories.set(item.subCategoryName, {
                id: item.subCategoryName,
                name: item.subCategoryName,
                order: uniqueSubCategories.size,
                count: 1,
                barId: item.barId,
                categoryId: item.categoryId,
              });
            } else {
              const existing = uniqueSubCategories.get(item.subCategoryName);
              existing.count++;
            }
          }
        });

        const subCategories = Array.from(uniqueSubCategories.values())
          .sort((a, b) => a.order - b.order)
          .map((sub) => ({
            ...sub,
            originalName: sub.name,
            originalOrder: sub.order,
          }));

        setQuickEditData({
          barId,
          categoryId,
          subCategories,
        });
        setShowQuickEditModal(true);
        return;
      }

      const apiSubCategories = await response.json();

      // Filtrar apenas subcategorias do bar específico
      const subCategories = apiSubCategories
        .filter((sub: any) => sub.barId === barId)
        .sort((a: any, b: any) => a.order - b.order)
        .map((sub: any) => ({
          ...sub,
          originalName: sub.name,
          originalOrder: sub.order,
          count: sub.itemsCount || 0,
        }));

      setQuickEditData({
        barId,
        categoryId,
        subCategories,
      });
      setShowQuickEditModal(true);
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error);
      alert('Erro ao carregar subcategorias. Usando dados locais como fallback.');

      // Fallback: usar dados locais
      const itemsInCategory = menuData.items.filter(
        (item) => item.categoryId === categoryId && item.barId === barId,
      );

      const uniqueSubCategories = new Map();
      itemsInCategory.forEach((item) => {
        if (item.subCategoryName && item.subCategoryName.trim() !== '') {
          if (!uniqueSubCategories.has(item.subCategoryName)) {
            uniqueSubCategories.set(item.subCategoryName, {
              id: item.subCategoryName,
              name: item.subCategoryName,
              order: uniqueSubCategories.size,
              count: 1,
              barId: item.barId,
              categoryId: item.categoryId,
            });
          } else {
            const existing = uniqueSubCategories.get(item.subCategoryName);
            existing.count++;
          }
        }
      });

      const subCategories = Array.from(uniqueSubCategories.values())
        .sort((a, b) => a.order - b.order)
        .map((sub) => ({
          ...sub,
          originalName: sub.name,
          originalOrder: sub.order,
        }));

      setQuickEditData({
        barId,
        categoryId,
        subCategories,
      });
      setShowQuickEditModal(true);
    }
  };

  const handleCloseQuickEditModal = () => {
    setShowQuickEditModal(false);
    setQuickEditData(null);
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditData) return;

    // Validar se há subcategorias vazias
    const emptySubCategories = quickEditData.subCategories.filter(
      (sub) => sub.name.trim() === '',
    );
    if (emptySubCategories.length > 0) {
      if (
        !confirm(
          `Existem ${emptySubCategories.length} subcategoria(s) com nome vazio. Deseja continuar? As subcategorias vazias serão ignoradas.`,
        )
      ) {
        return;
      }
    }

    // Filtrar subcategorias vazias
    const validSubCategories = quickEditData.subCategories.filter((sub) => sub.name.trim() !== '');

    if (validSubCategories.length === 0) {
      alert('Nenhuma subcategoria válida para salvar. Adicione nomes às subcategorias.');
      return;
    }

    try {
      let updatedItemsCount = 0;
      let newSubCategoriesCount = 0;
      let renamedSubCategoriesCount = 0;
      let useApiEndpoints = false;

      // Verificar se os novos endpoints estão disponíveis
      try {
        const testResponse = await fetch(`${API_BASE_URL}/subcategories`, { method: 'GET' });
        if (testResponse.ok) {
          useApiEndpoints = true;
        }
      } catch (error) {
        console.warn('Novos endpoints não disponíveis, usando método tradicional');
      }

      if (useApiEndpoints) {
        // Usar novos endpoints se disponíveis
        for (const subCategory of validSubCategories) {
          if (!subCategory.id.toString().includes('temp-')) {
            if (subCategory.name !== subCategory.originalName) {
              try {
                const response = await fetch(`${API_BASE_URL}/subcategories/${subCategory.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: subCategory.name,
                  }),
                });

                if (response.ok) {
                  renamedSubCategoriesCount++;
                  const itemsWithThisSubCategory = menuData.items.filter(
                    (item) =>
                      item.categoryId === quickEditData.categoryId &&
                      item.barId === quickEditData.barId &&
                      item.subCategoryName === subCategory.originalName,
                  );
                  updatedItemsCount += itemsWithThisSubCategory.length;
                }
              } catch (error) {
                console.error(
                  `Erro ao atualizar subcategoria ${subCategory.originalName}:`,
                  error,
                );
              }
            }
          } else {
            try {
              const response = await fetch(`${API_BASE_URL}/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: subCategory.name,
                  categoryId: quickEditData.categoryId,
                  barId: quickEditData.barId,
                  order: subCategory.order,
                }),
              });

              if (response.ok) {
                newSubCategoriesCount++;
              }
            } catch (error) {
              console.error(`Erro ao criar subcategoria ${subCategory.name}:`, error);
            }
          }
        }
      } else {
        // Fallback: usar endpoints tradicionais de itens
        const itemsToUpdate = menuData.items.filter(
          (item) => item.categoryId === quickEditData.categoryId && item.barId === quickEditData.barId,
        );

        for (const subCategory of validSubCategories) {
          if (!subCategory.id.toString().includes('temp-')) {
            const itemsWithThisSubCategory = itemsToUpdate.filter(
              (item) => item.subCategoryName === subCategory.originalName,
            );

            for (const item of itemsWithThisSubCategory) {
              if (subCategory.name !== subCategory.originalName) {
                try {
                  const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...item,
                      subCategory: subCategory.name,
                    }),
                  });

                  if (response.ok) {
                    updatedItemsCount++;
                  }
                } catch (error) {
                  console.error(`Erro ao atualizar item ${item.id}:`, error);
                }
              }
            }
          } else {
            newSubCategoriesCount++;
          }
        }
      }

      // Reordenar subcategorias se necessário
      const hasOrderChanges = validSubCategories.some(
        (sub) => sub.order !== sub.originalOrder,
      );
      if (hasOrderChanges) {
        if (useApiEndpoints) {
          try {
            const subcategoryNames = validSubCategories
              .sort((a, b) => a.order - b.order)
              .map((sub) => sub.name);

            const response = await fetch(
              `${API_BASE_URL}/subcategories/reorder/${quickEditData.categoryId}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subcategoryNames,
                }),
              },
            );

            if (!response.ok) {
              console.warn('Erro ao reordenar subcategorias via API');
            }
          } catch (error) {
            console.error('Erro ao reordenar subcategorias via API:', error);
          }
        } else {
          // Fallback: reordenar itens individualmente
          try {
            const itemsToUpdate = menuData.items.filter(
              (item) => item.categoryId === quickEditData.categoryId && item.barId === quickEditData.barId,
            );

            // Agrupar itens por subcategoria
            const subcategoryGroups = new Map();
            validSubCategories.forEach((sub) => {
              if (sub.name.trim() !== '') {
                subcategoryGroups.set(sub.name, {
                  order: sub.order,
                  items: itemsToUpdate.filter((item) => item.subCategoryName === sub.name),
                });
              }
            });

            // Atualizar ordem dos itens
            for (const [subcategoryName, group] of subcategoryGroups) {
              for (const item of group.items) {
                try {
                  const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...item,
                      order: group.order,
                    }),
                  });

                  if (response.ok) {
                    updatedItemsCount++;
                  }
                } catch (error) {
                  console.error(`Erro ao atualizar ordem do item ${item.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error('Erro ao reordenar subcategorias via fallback:', error);
          }
        }
      }

      // Mostrar resumo das alterações
      let message = '';
      if (useApiEndpoints) {
        if (renamedSubCategoriesCount > 0) {
          message += `✅ ${renamedSubCategoriesCount} subcategoria(s) renomeada(s)!\n`;
          message += `📝 ${updatedItemsCount} item(s) atualizado(s) automaticamente!\n\n`;
        }

        if (newSubCategoriesCount > 0) {
          message += `🆕 ${newSubCategoriesCount} nova(s) subcategoria(s) criada(s)!\n\n`;
          message += `💡 Para usar as novas subcategorias, adicione itens com esses nomes na aba "Itens do Menu".`;
        }
      } else {
        if (updatedItemsCount > 0) {
          message += `✅ ${updatedItemsCount} item(s) atualizado(s) com sucesso!\n\n`;
        }

        if (newSubCategoriesCount > 0) {
          message += `📝 ${newSubCategoriesCount} nova(s) subcategoria(s) criada(s)!\n\n`;
          message += `💡 Para usar as novas subcategorias, adicione itens com esses nomes na aba "Itens do Menu".`;
        }
      }

      if (hasOrderChanges) {
        message += `🔄 Ordem das subcategorias atualizada!\n`;
      }

      if (updatedItemsCount === 0 && newSubCategoriesCount === 0 && renamedSubCategoriesCount === 0 && !hasOrderChanges) {
        message = 'ℹ️ Nenhuma alteração foi necessária.';
      }

      alert(message);

      await fetchData();
      handleCloseQuickEditModal();
    } catch (err) {
      console.error('Erro ao salvar edição rápida:', err);
      alert(`Erro ao salvar alterações: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const addSubCategoryToQuickEdit = () => {
    if (!quickEditData) return;

    // Mostrar aviso sobre como funciona
    if (
      !confirm(
        'Atenção: Para criar uma nova subcategoria, você deve:\n\n1. Adicionar um item com a nova subcategoria\n2. Ou renomear uma subcategoria existente\n\nDeseja continuar adicionando uma subcategoria temporária?',
      )
    ) {
      return;
    }

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const newOrder = Math.max(...prev.subCategories.map((sub) => sub.order), -1) + 1;

      return {
        ...prev,
        subCategories: [
          ...prev.subCategories,
          {
            id: `temp-${Date.now()}`,
            name: '',
            order: newOrder,
            originalName: '',
            originalOrder: newOrder,
            count: 0,
          },
        ],
      };
    });
  };

  const removeSubCategoryFromQuickEdit = async (index: number) => {
    if (!quickEditData) return;

    const subCategory = quickEditData.subCategories[index];

    // Se é uma subcategoria temporária, apenas remover da lista
    if (subCategory.id.toString().includes('temp-')) {
      setQuickEditData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subCategories: prev.subCategories.filter((_, i) => i !== index),
        };
      });
      return;
    }

    // Se é uma subcategoria existente, confirmar exclusão
    if (
      !confirm(
        `Tem certeza que deseja excluir a subcategoria '${subCategory.name}'?\n\n⚠️ Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    try {
      // Verificar se os novos endpoints estão disponíveis
      const testResponse = await fetch(`${API_BASE_URL}/subcategories`, { method: 'GET' });

      if (testResponse.ok) {
        // Usar novo endpoint de exclusão
        const response = await fetch(`${API_BASE_URL}/subcategories/${subCategory.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setQuickEditData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              subCategories: prev.subCategories.filter((_, i) => i !== index),
            };
          });

          alert('Subcategoria excluída com sucesso!');
        } else {
          const errorData = await response.json();
          alert(`Erro ao excluir subcategoria: ${errorData.error}`);
        }
      } else {
        // Fallback: não permitir exclusão sem os novos endpoints
        alert(
          '⚠️ Funcionalidade de exclusão não disponível no momento. Use a funcionalidade de renomear ou aguarde a atualização do sistema.',
        );
      }
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      alert(
        '⚠️ Erro ao conectar com o servidor. A funcionalidade de exclusão não está disponível no momento.',
      );
    }
  };

  const updateSubCategoryInQuickEdit = (
    index: number,
    field: 'name' | 'order',
    value: string | number,
  ) => {
    if (!quickEditData) return;

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const newSubCategories = [...prev.subCategories];
      newSubCategories[index] = {
        ...newSubCategories[index],
        [field]: field === 'order' ? Number(value) : value,
      };
      return {
        ...prev,
        subCategories: newSubCategories,
      };
    });
  };

  const reorderSubCategories = (fromIndex: number, toIndex: number) => {
    if (!quickEditData) return;

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const newSubCategories = [...prev.subCategories];
      const [movedItem] = newSubCategories.splice(fromIndex, 1);
      newSubCategories.splice(toIndex, 0, movedItem);

      // Atualizar ordens
      newSubCategories.forEach((sub, index) => {
        sub.order = index;
      });

      return {
        ...prev,
        subCategories: newSubCategories,
      };
    });
  };

  const duplicateSubCategory = (index: number) => {
    if (!quickEditData) return;

    // Mostrar aviso sobre como funciona
    if (
      !confirm(
        'Atenção: Duplicar uma subcategoria criará uma versão temporária.\n\nPara que ela seja efetiva, você deve:\n\n1. Adicionar itens com a nova subcategoria, ou\n2. Renomear uma subcategoria existente\n\nDeseja continuar?',
      )
    ) {
      return;
    }

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const originalSub = prev.subCategories[index];
      const newOrder = Math.max(...prev.subCategories.map((sub) => sub.order), -1) + 1;

      return {
        ...prev,
        subCategories: [
          ...prev.subCategories,
          {
            id: `temp-${Date.now()}`,
            name: `${originalSub.name} (cópia)`,
            order: newOrder,
            originalName: '',
            originalOrder: newOrder,
            count: 0,
          },
        ],
      };
    });
  };

  const sortSubCategoriesByName = () => {
    if (!quickEditData) return;

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const sortedSubCategories = [...prev.subCategories]
        .filter((sub) => sub.name.trim() !== '')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((sub, index) => ({ ...sub, order: index }));

      return {
        ...prev,
        subCategories: sortedSubCategories,
      };
    });
  };

  const sortSubCategoriesByOrder = () => {
    if (!quickEditData) return;

    setQuickEditData((prev) => {
      if (!prev) return prev;
      const sortedSubCategories = [...prev.subCategories]
        .filter((sub) => sub.name.trim() !== '')
        .sort((a, b) => a.order - b.order)
        .map((sub, index) => ({ ...sub, order: index }));

      return {
        ...prev,
        subCategories: sortedSubCategories,
      };
    });
  };

  const getChangesSummary = () => {
    if (!quickEditData) return { added: 0, modified: 0, removed: 0 };

    let added = 0;
    let modified = 0;
    let removed = 0;

    quickEditData.subCategories.forEach((sub) => {
      if (sub.id.toString().includes('temp-') && sub.name.trim() !== '') {
        // Nova subcategoria com nome
        added++;
      } else if (sub.name !== sub.originalName || sub.order !== sub.originalOrder) {
        // Subcategoria existente modificada
        modified++;
      }
    });

    return { added, modified, removed };
  };

  const handleSaveBar = useCallback(async () => {
    try {
      if (!barForm.name.trim()) {
        alert('Nome do estabelecimento é obrigatório');
        return;
      }

      if (!barForm.slug.trim()) {
        alert('Slug do estabelecimento é obrigatório');
        return;
      }

      const url = editingBar
        ? `${API_BASE_URL}/bars/${editingBar.id}`
        : `${API_BASE_URL}/bars`;

      const method = editingBar ? 'PUT' : 'POST';

      const barData = {
        ...barForm,
        rating: barForm.rating ? parseFloat(barForm.rating) : 0,
        reviewsCount: barForm.reviewsCount ? parseInt(barForm.reviewsCount) : 0,
        latitude: barForm.latitude ? parseFloat(barForm.latitude) : null,
        longitude: barForm.longitude ? parseFloat(barForm.longitude) : null,
        facebook: barForm.facebook || '',
        instagram: barForm.instagram || '',
        whatsapp: barForm.whatsapp || '',
      };

      console.log('🔄 Salvando estabelecimento:', method, url, barData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Estabelecimento salvo com sucesso');
        await fetchData(); // Atualiza os dados após o salvamento
        handleCloseBarModal();
        alert(editingBar ? 'Estabelecimento atualizado com sucesso!' : 'Estabelecimento criado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar estabelecimento:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar estabelecimento: ${errorMessage}`);
    }
  }, [editingBar, barForm, fetchData, handleCloseBarModal]);

  const handleSaveCategory = useCallback(async () => {
    try {
      if (!categoryForm.name.trim()) {
        alert('Nome da categoria é obrigatório');
        return;
      }

      if (!categoryForm.barId) {
        alert('Estabelecimento é obrigatório');
        return;
      }

      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const categoryData = {
        name: categoryForm.name,
        barId: categoryForm.barId,
        order: parseInt(categoryForm.order.toString()) || 0,
      };

      console.log('🔄 Salvando categoria:', method, url, categoryData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        const savedCategory = await response.json();
        const categoryId = editingCategory ? editingCategory.id : savedCategory.id;

        if (categoryForm.subCategories.length > 0) {
          console.log('ℹ️ Sub-categorias serão aplicadas automaticamente aos itens desta categoria');
        }

        console.log('✅ Categoria e sub-categorias salvas com sucesso');
        await fetchData();
        handleCloseCategoryModal();
        alert(
          editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
        );
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar categoria:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar categoria: ${errorMessage}`);
    }
  }, [editingCategory, categoryForm, fetchData, handleCloseCategoryModal]);

  const handleSaveItem = useCallback(async () => {
    try {
      if (!itemForm.name.trim()) {
        alert('Nome do item é obrigatório');
        return;
      }

      if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
        alert('Preço deve ser maior que zero');
        return;
      }

      if (!itemForm.categoryId) {
        alert('Categoria é obrigatória');
        return;
      }

      if (!itemForm.barId) {
        alert('Estabelecimento é obrigatório');
        return;
      }

      const url = editingItem
        ? `${API_BASE_URL}/items/${editingItem.id}`
        : `${API_BASE_URL}/items`;

      const method = editingItem ? 'PUT' : 'POST';

      const itemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        order: parseInt(itemForm.order.toString()) || 0,
      };

      console.log('🔄 Salvando item:', method, url, itemData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      console.log('📡 Resposta do servidor:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Item salvo com sucesso');
        await fetchData();
        handleCloseItemModal();
        alert(editingItem ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do servidor:', errorText);

        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar item:', err);

      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }

      alert(`Erro ao salvar item: ${errorMessage}`);
    }
  }, [editingItem, itemForm, fetchData, handleCloseItemModal]);

  const handleEditBar = useCallback((bar: Bar) => {
    setEditingBar(bar);
    setBarForm({
      name: bar.name,
      slug: bar.slug,
      description: bar.description,
      logoUrl: bar.logoUrl || '',
      coverImageUrl: bar.coverImageUrl || '',
      coverImages: bar.coverImages || [],
      address: bar.address,
      rating: bar.rating?.toString() || '',
      reviewsCount: bar.reviewsCount?.toString() || '',
      amenities: bar.amenities || [],
      latitude: bar.latitude?.toString() || '',
      longitude: bar.longitude?.toString() || '',
      popupImageUrl: bar.popupImageUrl || '',
      // **CORREÇÃO**: Garante que os campos não sejam undefined
      facebook: bar.facebook || '', 
      instagram: bar.instagram || '',
      whatsapp: bar.whatsapp || '',
    });
    setShowBarModal(true);
  }, []);

  const handleEditCategory = useCallback(
    (category: MenuCategory) => {
      setEditingCategory(category);

      const categorySubCategories = menuData.items
        .filter(
          (item) =>
            item.categoryId === category.id &&
            item.subCategoryName &&
            item.subCategoryName.trim() !== '',
        )
        .reduce((acc: any[], item) => {
          const existing = acc.find((sub) => sub.name === item.subCategoryName);
          if (!existing) {
            acc.push({ name: item.subCategoryName, order: 0 });
          }
          return acc;
        }, []);

      setCategoryForm({
        name: category.name,
        barId: category.barId?.toString() || '',
        order: category.order,
        subCategories: categorySubCategories,
      });
      setShowCategoryModal(true);
    },
    [menuData.items],
  );

  const handleEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      imageUrl: item.imageUrl,
      categoryId: item.categoryId?.toString() || '',
      barId: item.barId?.toString() || '',
      subCategory: item.subCategory || item.subCategoryName || '',
      toppings: item.toppings || [],
      order: item.order,
      seals: item.seals || [],
    });
    setShowItemModal(true);
  }, []);

  // Função para abrir modal de categoria para promoters
  const handleAddCategoryForPromoter = useCallback(() => {
    if (promoterBar) {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        barId: promoterBar.barId.toString(),
        order: 0,
        subCategories: [],
      });
      setShowCategoryModal(true);
    }
  }, [promoterBar]);

  // Função para abrir modal de item para promoters
  const handleAddItemForPromoter = useCallback(() => {
    if (promoterBar) {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        categoryId: '',
        barId: promoterBar.barId.toString(),
        subCategory: '',
        toppings: [],
        order: 0,
        seals: [],
      });
      setShowItemModal(true);
    }
  }, [promoterBar]);

  const handleDeleteBar = useCallback(
    async (barId: string | number) => {
      if (confirm('Tem certeza que deseja excluir este estabelecimento?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/bars/${barId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchData();
          } else {
            throw new Error('Falha ao deletar estabelecimento.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar estabelecimento.');
        }
      }
    },
    [fetchData],
  );

  const handleDeleteCategory = useCallback(
    async (categoryId: string | number) => {
      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            fetchData();
          } else {
            throw new Error('Falha ao deletar categoria.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar categoria.');
        }
      }
    },
    [fetchData],
  );

  const handleDeleteItem = useCallback(
    async (itemId: string | number) => {
      if (confirm('Tem certeza que deseja excluir este item?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' });
          if (response.ok) {
            fetchData();
          } else {
            throw new Error('Falha ao deletar item.');
          }
        } catch (err) {
          console.error(err);
          alert('Erro ao deletar item.');
        }
      }
    },
    [fetchData],
  );

  const handleImageUpload = useCallback(
    async (file: File, field: string) => {
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Apenas imagens são permitidas');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      const tempUrl = URL.createObjectURL(file);

      if (field === 'coverImages') {
        setBarForm((prev) => ({ ...prev, coverImages: [...prev.coverImages, tempUrl] }));
      } else if (field === 'logoUrl' || field === 'coverImageUrl' || field === 'popupImageUrl') {
        setBarForm((prev) => ({ ...prev, [field]: tempUrl }));
      } else {
        setItemForm((prev) => ({ ...prev, imageUrl: tempUrl }));
      }

      try {
        console.log('🔄 Iniciando upload da imagem:', file.name);

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(API_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });

        console.log('📡 Resposta do upload:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Erro do servidor:', errorData);
          throw new Error(
            errorData.error || `Erro no upload: ${response.status} - ${response.statusText}`,
          );
        }

        const result = await response.json();
        console.log('✅ Resultado do upload:', result);

        if (result.success && result.filename) {
          const filename = result.filename;
          if (field === 'coverImages') {
            setBarForm((prev) => {
              const updatedImages = prev.coverImages.map((url) => (url === tempUrl ? filename : url));
              return { ...prev, coverImages: updatedImages };
            });
          } else if (field === 'logoUrl' || field === 'coverImageUrl' || field === 'popupImageUrl') {
            setBarForm((prev) => ({ ...prev, [field]: filename }));
          } else {
            setItemForm((prev) => ({ ...prev, imageUrl: filename }));
          }

          setTimeout(() => {
            URL.revokeObjectURL(tempUrl);
          }, 1000);

          console.log('✅ Upload concluído com sucesso');
          alert('Imagem carregada com sucesso!');
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } catch (error) {
        console.error('❌ Erro no upload:', error);

        let errorMessage = 'Erro desconhecido';
        if (error instanceof Error) {
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = error.message;
          }
        }

        alert(`Erro no upload: ${errorMessage}`);

        URL.revokeObjectURL(tempUrl);
        if (field === 'coverImages') {
          setBarForm((prev) => ({
            ...prev,
            coverImages: prev.coverImages.filter((url) => url !== tempUrl),
          }));
        } else if (field === 'logoUrl' || field === 'coverImageUrl' || field === 'popupImageUrl') {
          setBarForm((prev) => ({ ...prev, [field]: '' }));
        } else {
          setItemForm((prev) => ({ ...prev, imageUrl: '' }));
        }
      }
    },
    [],
  );

  const handleRemoveCoverImage = (urlToRemove: string) => {
    setBarForm((prev) => ({
      ...prev,
      coverImages: prev.coverImages.filter((url) => url !== urlToRemove),
    }));
  };

  const selectImageFile = useCallback(
    (field: string) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = field === 'coverImages'; // Habilita múltiplas seleções
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          if (field === 'coverImages') {
            Array.from(files).forEach((file) => handleImageUpload(file, field));
          } else {
            handleImageUpload(files[0], field);
          }
        }
      };
      input.click();
    },
    [handleImageUpload],
  );

  const Modal = useCallback(({ isOpen, onClose, children, title }: any) => (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), []);

  const handleSelectItem = useCallback((itemId: string | number, isSelected: boolean) => {
    setSelectedItems((prev) =>
      isSelected ? [...prev, itemId] : prev.filter((id) => id !== itemId),
    );
  }, []);

  const handleSelectAll = useCallback(
    (items: MenuItem[]) => {
      const allItemIds = items.map((item) => item.id);
      const allSelected = selectedItems.length === allItemIds.length;
      setSelectedItems(allSelected ? [] : allItemIds);
    },
    [selectedItems],
  );

  const handleBulkDelete = useCallback(async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir os ${selectedItems.length} itens selecionados?`,
      )
    ) {
      return;
    }

    try {
      const deletePromises = selectedItems.map((itemId) =>
        fetch(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' }),
      );
      const results = await Promise.all(deletePromises);

      const failedDeletions = results.filter((res) => !res.ok);
      if (failedDeletions.length > 0) {
        throw new Error(`Falha ao excluir ${failedDeletions.length} item(s).`);
      }

      alert('Itens excluídos com sucesso!');
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(`Erro ao excluir itens: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [selectedItems, fetchData]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 admin-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-gray-900 admin-title">Gerenciamento do Cardápio</h1>
          <p className="text-sm sm:text-base text-gray-600 admin-subtitle">Gerencie estabelecimentos, categorias e itens do cardápio</p>
          {isPromoter && promoterBar && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <MdSecurity className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Você está gerenciando: <span className="font-bold">{promoterBar.barName}</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Acesso restrito apenas aos dados deste estabelecimento
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              {[
                { id: 'bars', name: 'Estabelecimentos', count: menuData.bars.length },
                { id: 'categories', name: 'Categorias', count: menuData.categories.length },
                { id: 'items', name: 'Itens do Menu', count: menuData.items.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 py-2 px-1 text-sm font-medium w-full sm:w-auto text-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-900">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Banner para Promoters */}
            {isPromoter && promoterBar && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <MdSecurity className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Gerenciando: {promoterBar.barName}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Você tem acesso restrito apenas aos dados deste estabelecimento
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bars' && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estabelecimentos</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowBarModal(true)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full sm:w-auto justify-center"
                    >
                      <MdAdd className="h-5 w-5" />
                      Adicionar Estabelecimento
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                  {menuData.bars.map((bar) => (
                    <div key={bar.id} className="overflow-hidden rounded-lg bg-white shadow-md">
                      <div className="relative h-48">
                        <Image
                          src={getValidImageUrl(bar.coverImageUrl)}
                          alt={bar.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEditBar(bar)}
                                className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
                              >
                                <MdEdit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBar(bar.id)}
                                className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
                              >
                                <MdDelete className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">{bar.name}</h3>
                        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                          {bar.description}
                        </p>
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                          <MdStar className="h-4 w-4 text-yellow-400" />
                          <span>{bar.rating}</span>
                          <span>({bar.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MdLocationOn className="h-4 w-4" />
                          <span className="line-clamp-1">{bar.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categorias</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 w-full sm:w-auto justify-center"
                    >
                      <MdAdd className="h-5 w-5" />
                      Adicionar Categoria
                    </button>
                  )}
                  {isPromoter && promoterBar && (
                    <button
                      onClick={handleAddCategoryForPromoter}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      <MdAdd className="h-5 w-5" />
                      Adicionar Categoria para {promoterBar.barName}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                  {menuData.categories.map((category) => {
                    const bar = menuData.bars.find((b) => b.id === category.barId);
                    if (!bar) return null;

                    return (
                      <div key={category.id} className="rounded-lg bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500">{bar.name}</p>
                          </div>
                          <div className="flex gap-1">
                            {(isAdmin || (isPromoter && canManageBar(Number(category.barId)))) && (
                              <>
                                <button
                                  onClick={() => handleOpenQuickEditModal(bar.id, category.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Edição Rápida das Subcategorias"
                                >
                                  <MdEdit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <MdEdit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <MdDelete className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Ordem: {category.order}</p>
                          <p className="text-blue-600">
                            {(() => {
                              const subCategoriesCount = menuData.subCategories.filter(
                                (sub) =>
                                  sub.categoryId === category.id && sub.barId === category.barId,
                              ).length;
                              const itemsWithSubCategories = menuData.items.filter(
                                (item) =>
                                  item.categoryId === category.id &&
                                  item.barId === category.barId &&
                                  item.subCategoryName,
                              ).length;
                              const uniqueSubCategories =
                                itemsWithSubCategories > 0
                                  ? new Set(
                                      menuData.items
                                        .filter(
                                          (item) =>
                                            item.categoryId === category.id &&
                                            item.barId === category.barId &&
                                            item.subCategoryName,
                                        )
                                        .map((item) => item.subCategoryName),
                                    ).size
                                  : subCategoriesCount;
                              return `${uniqueSubCategories} subcategoria(s)`;
                            })()}
                          </p>

                          {/* Preview das subcategorias */}
                          {(() => {
                            const subCategories = menuData.subCategories
                              .filter(
                                (sub) =>
                                  sub.categoryId === category.id && sub.barId === category.barId,
                              )
                              .sort((a, b) => a.order - b.order);

                            if (subCategories.length === 0) {
                              // Tentar extrair das subcategorias dos itens
                              const itemSubCategories = Array.from(
                                new Set(
                                  menuData.items
                                    .filter(
                                      (item) =>
                                        item.categoryId === category.id &&
                                        item.barId === category.barId &&
                                        item.subCategoryName,
                                    )
                                    .map((item) => item.subCategoryName),
                                ),
                              ).slice(0, 3); // Mostrar apenas as 3 primeiras

                              if (itemSubCategories.length > 0) {
                                return (
                                  <div className="mt-2">
                                    <p className="mb-1 text-xs text-gray-500">
                                      Subcategorias detectadas:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {itemSubCategories.map((subName, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                        >
                                          {subName}
                                        </span>
                                      ))}
                                      {itemSubCategories.length >= 3 && (
                                        <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-400">
                                          +{
                                            Array.from(
                                              new Set(
                                                menuData.items
                                                  .filter(
                                                    (item) =>
                                                      item.categoryId === category.id &&
                                                      item.barId === category.barId &&
                                                      item.subCategoryName,
                                                  )
                                                  .map((item) => item.subCategoryName),
                                              ),
                                            ).length - 3
                                          }{' '}
                                          mais
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }

                            return (
                              <div className="mt-2">
                                <p className="mb-1 text-xs text-gray-500">Subcategorias:</p>
                                <div className="flex flex-wrap gap-1">
                                  {subCategories.slice(0, 3).map((sub) => (
                                    <span
                                      key={sub.id}
                                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600"
                                    >
                                      {sub.name}
                                    </span>
                                  ))}
                                  {subCategories.length > 3 && (
                                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-400">
                                      +{subCategories.length - 3} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Itens do Menu</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow">
                      <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                      >
                        <MdDelete className="h-5 w-5" />
                        Excluir Selecionados ({selectedItems.length})
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowItemModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        <MdAdd className="h-5 w-5" />
                        Adicionar Item
                      </button>
                    )}
                    {isPromoter && promoterBar && (
                      <button
                        onClick={handleAddItemForPromoter}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        <MdAdd className="h-5 w-5" />
                        Adicionar Item para {promoterBar.barName}
                      </button>
                    )}
                  </div>
                </div>

                {/* Agrupamento de itens por bar */}
                {menuData.bars.map((bar) => {
                  const itemsForBar = menuData.items.filter(
                    (item) =>
                      item.barId === bar.id &&
                      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchTerm.toLowerCase())),
                  );
                  if (itemsForBar.length === 0) return null;

                  const isAllSelectedInBar = itemsForBar.every((item) =>
                    selectedItems.includes(item.id),
                  );
                  const isAnySelectedInBar = itemsForBar.some((item) =>
                    selectedItems.includes(item.id),
                  );

                  return (
                    <div key={bar.id} className="mb-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-800">{bar.name}</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isAllSelectedInBar}
                            onChange={() => {
                              if (isAllSelectedInBar) {
                                setSelectedItems((prev) =>
                                  prev.filter((id) => !itemsForBar.map((i) => i.id).includes(id)),
                                );
                              } else {
                                setSelectedItems((prev) => [
                                  ...new Set([...prev, ...itemsForBar.map((i) => i.id)]),
                                ]);
                              }
                            }}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = !isAllSelectedInBar && isAnySelectedInBar;
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {isAllSelectedInBar ? 'Desmarcar Todos' : 'Selecionar Todos'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 admin-grid-4">
                        {itemsForBar.map((item) => {
                          const category = menuData.categories.find(
                            (c) => c.id === item.categoryId,
                          );
                          return (
                            <div
                              key={item.id}
                              className="relative overflow-hidden rounded-lg bg-white shadow-md"
                            >
                              <div className="absolute left-2 top-2 z-10">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                />
                              </div>
                              <div className="relative h-48">
                                <Image
                                  src={getValidImageUrl(item.imageUrl)}
                                  alt={item.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover"
                                />
                                <div className="absolute right-2 top-2 flex gap-1">
                                  {(isAdmin ||
                                    (isPromoter && canManageBar(Number(item.barId)))) && (
                                    <>
                                      <button
                                        onClick={() => handleEditItem(item)}
                                        className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700"
                                      >
                                        <MdEdit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
                                      >
                                        <MdDelete className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 shadow-md">
                                  <span className="text-sm font-bold text-green-600">
                                    {formatPrice(item.price)}
                                  </span>
                                </div>
                              </div>
                              <div className="p-4">
                                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                  {item.description}
                                </p>
                                {renderItemSeals(item.seals || [])}
                                <div className="text-xs text-gray-500">
                                  <p>Categoria: {category?.name}</p>
                                  {(item.subCategory || item.subCategoryName) && (
                                    <p>Sub-categoria: {item.subCategory || item.subCategoryName}</p>
                                  )}
                                  {item.toppings?.length > 0 && (
                                    <p>{item.toppings.length} adicionais</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bar Modal */}
        <Modal
          isOpen={showBarModal}
          onClose={handleCloseBarModal}
          title={editingBar ? 'Editar Estabelecimento' : 'Adicionar Estabelecimento'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={barForm.name}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={barForm.slug}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={barForm.description}
                onChange={(e) => setBarForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barForm.logoUrl}
                    onChange={(e) => setBarForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => selectImageFile('logoUrl')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdUpload className="h-4 w-4" />
                  </button>
                </div>
                {barForm.logoUrl && barForm.logoUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(barForm.logoUrl)}
                      alt="Preview do logo"
                      width={100}
                      height={100}
                      className="rounded-lg border object-cover"
                      unoptimized={barForm.logoUrl.startsWith('blob:')}
                      priority={true}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Imagens de Capa (Carrossel)
                </label>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    onClick={() => selectImageFile('coverImages')}
                    className="flex w-full items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                    Adicionar Imagem(ns)
                  </button>
                </div>
                {barForm.coverImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {barForm.coverImages.map((imageUrl, index) => (
                      <div key={index} className="group relative">
                        <Image
                          src={getValidImageUrl(imageUrl)}
                          alt={`Preview da imagem de capa ${index + 1}`}
                          width={200}
                          height={100}
                          className="rounded-lg border object-cover"
                          unoptimized={imageUrl.startsWith('blob:')}
                          priority={true}
                        />
                        <button
                          onClick={() => handleRemoveCoverImage(imageUrl)}
                          className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MdClose className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✨ Campo de Upload para a Imagem do Popup */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Imagem do Popup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barForm.popupImageUrl}
                  onChange={(e) =>
                    setBarForm((prev) => ({ ...prev, popupImageUrl: e.target.value }))
                  }
                  placeholder="Nome do arquivo (ex: popup.jpg)"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => selectImageFile('popupImageUrl')}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                >
                  <MdUpload className="h-4 w-4" />
                </button>
              </div>
              {barForm.popupImageUrl && barForm.popupImageUrl.trim() !== '' && (
                <div className="mt-2">
                  <Image
                    src={getValidImageUrl(barForm.popupImageUrl)}
                    alt="Preview do popup"
                    width={200}
                    height={150}
                    className="rounded-lg border object-contain"
                    unoptimized={barForm.popupImageUrl.startsWith('blob:')}
                    priority={true}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Endereço</label>
              <input
                type="text"
                value={barForm.address}
                onChange={(e) => setBarForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* **NOVO**: Campos de links sociais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Facebook</label>
                <input
                  type="text"
                  value={barForm.facebook}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, facebook: e.target.value }))}
                  placeholder="Link do Facebook"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Instagram</label>
                <input
                  type="text"
                  value={barForm.instagram}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="Link do Instagram"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp</label>
                <input
                  type="text"
                  value={barForm.whatsapp}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="Link do WhatsApp"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Avaliação</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={barForm.rating}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Número de Avaliações
                </label>
                <input
                  type="number"
                  min="0"
                  value={barForm.reviewsCount}
                  onChange={(e) =>
                    setBarForm((prev) => ({ ...prev, reviewsCount: e.target.value }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={barForm.latitude}
                  onChange={(e) => setBarForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={barForm.longitude}
                onChange={(e) => setBarForm((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseBarModal}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveBar()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={handleCloseCategoryModal}
          title={editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estabelecimento
              </label>
              <select
                value={categoryForm.barId}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, barId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um estabelecimento</option>
                {menuData.bars.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
              <input
                type="number"
                min="0"
                value={categoryForm.order}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, order: parseInt(e.target.value) }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sub-categorias */}
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Sub-categorias</label>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryForm((prev) => ({
                      ...prev,
                      subCategories: [
                        ...prev.subCategories,
                        { name: '', order: prev.subCategories.length },
                      ],
                    }));
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  + Adicionar Sub-categoria
                </button>
              </div>

              <div className="max-h-40 space-y-2 overflow-y-auto">
                {categoryForm.subCategories.map((subCategory, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={subCategory.name || ''}
                      onChange={(e) => {
                        const newSubCategories = [...categoryForm.subCategories];
                        newSubCategories[index] = {
                          ...newSubCategories[index],
                          name: e.target.value,
                        };
                        setCategoryForm((prev) => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      placeholder="Nome da sub-categoria"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={subCategory.order || 0}
                      onChange={(e) => {
                        const newSubCategories = [...categoryForm.subCategories];
                        newSubCategories[index] = {
                          ...newSubCategories[index],
                          order: parseInt(e.target.value) || 0,
                        };
                        setCategoryForm((prev) => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      placeholder="Ordem"
                      className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSubCategories = categoryForm.subCategories.filter(
                          (_, i) => i !== index,
                        );
                        setCategoryForm((prev) => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                    >
                      <MdDelete className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {categoryForm.subCategories.length === 0 && (
                  <p className="text-sm italic text-gray-500">Nenhuma sub-categoria adicionada.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseCategoryModal}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveCategory()}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>

        {/* Item Modal */}
        <Modal
          isOpen={showItemModal}
          onClose={handleCloseItemModal}
          title={editingItem ? 'Editar Item' : 'Adicionar Item'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome do Item
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome do arquivo da imagem do item
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => selectImageFile('imageUrl')}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdUpload className="h-4 w-4" />
                  </button>
                </div>
                {itemForm.imageUrl && itemForm.imageUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(itemForm.imageUrl)}
                      alt="Preview da imagem do item"
                      width={150}
                      height={100}
                      className="rounded-lg border object-cover"
                      unoptimized={itemForm.imageUrl.startsWith('blob:')}
                      priority={true}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sub-categoria
                </label>
                <input
                  type="text"
                  value={itemForm.subCategory}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, subCategory: e.target.value }))
                  }
                  placeholder="Ex: Hambúrgueres, Caipirinhas, Porções..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Digite uma sub-categoria para organizar melhor seus itens
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 admin-form-grid">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Estabelecimento
                </label>
                <select
                  value={itemForm.barId}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, barId: e.target.value, categoryId: '' }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um estabelecimento</option>
                  {menuData.bars.map((bar) => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!itemForm.barId}
                >
                  <option value="">Selecione uma categoria</option>
                  {menuData.categories
                    .filter((cat) => cat.barId?.toString() === itemForm.barId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
              <input
                type="number"
                min="0"
                value={itemForm.order}
                onChange={(e) => setItemForm((prev) => ({ ...prev, order: parseInt(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Toppings */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Adicionais</label>
              <div className="space-y-2">
                {itemForm.toppings.map((topping) => (
                  <div key={topping.id} className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                    <span className="flex-1 text-sm">{topping.name}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{formatPrice(topping.price)}
                    </span>
                    <button
                      onClick={() => handleRemoveTopping(topping.id.toString())}
                      className="text-red-600 hover:text-red-800"
                    >
                      <MdClose className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do adicional"
                    value={newTopping.name}
                    onChange={(e) => setNewTopping((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    value={newTopping.price}
                    onChange={(e) => setNewTopping((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTopping}
                    className="flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  >
                    <MdAdd className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Selos */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Selos</label>
              <div className="space-y-4">
                {/* Selos de Comida */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Comida</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {FOOD_SEALS.map((seal) => (
                      <label
                        key={seal.id}
                        className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(seal.id)}
                          onChange={() => handleToggleSeal(seal.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: seal.color }}
                        />
                        <span className="text-sm text-gray-700">{seal.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Selos de Bebida */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Bebida</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DRINK_SEALS.map((seal) => (
                      <label
                        key={seal.id}
                        className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(seal.id)}
                          onChange={() => handleToggleSeal(seal.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: seal.color }}
                        />
                        <span className="text-sm text-gray-700">{seal.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vinhos - País */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - País</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WINE_COUNTRIES.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 rounded border p-2">
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(c.id)}
                          onChange={() => handleToggleSeal(c.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{c.emoji}</span>
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vinhos - Tipo */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Tipo</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WINE_TYPES.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 rounded border p-2">
                        <input
                          type="checkbox"
                          checked={itemForm.seals.includes(t.id)}
                          onChange={() => handleToggleSeal(t.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: t.color }} />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vinhos - Safra */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Safra</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 2018"
                      onChange={(e) => {
                        const id = `vinho:safra:${e.target.value.trim()}`;
                        // Atualiza selos substituindo qualquer safra anterior
                        setItemForm((prev) => ({
                          ...prev,
                          seals: [
                            ...prev.seals.filter((s) => !s.startsWith('vinho:safra:')),
                            ...(e.target.value.trim() ? [id] : []),
                          ],
                        }));
                      }}
                      className="w-40 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 text-sm">Use apenas números do ano</span>
                  </div>
                </div>

                {/* Vinhos - Local */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600">Vinho - Local</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Vale dos Vinhedos - RS"
                      onChange={(e) => {
                        const val = encodeURIComponent(e.target.value.trim());
                        const id = `vinho:local:${val}`;
                        setItemForm((prev) => ({
                          ...prev,
                          seals: [
                            ...prev.seals.filter((s) => !s.startsWith('vinho:local:')),
                            ...(e.target.value.trim() ? [id] : []),
                          ],
                        }));
                      }}
                      className="w-80 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 text-sm">Cidade/Região/Denominação</span>
                  </div>
                </div>

                {/* Preview dos selos selecionados */}
                {itemForm.seals.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-600">Preview dos Selos Selecionados</h4>
                    <div className="flex flex-wrap gap-2">
                      {itemForm.seals.map((sealId) => {
                        const seal = getSealById(sealId);
                        if (!seal) return null;
                        return (
                          <span
                            key={sealId}
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: seal.color }}
                          >
                            {seal.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseItemModal}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSaveItem()}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </Modal>

        {/* Quick Edit Modal para Subcategorias */}
        <Modal
          isOpen={showQuickEditModal}
          onClose={handleCloseQuickEditModal}
          title="Edição Rápida das Subcategorias"
        >
          {quickEditData && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900">
                  Editando subcategorias da categoria:
                  {menuData.categories.find((c) => c.id === quickEditData.categoryId)?.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Bar: {menuData.bars.find((b) => b.id === quickEditData.barId)?.name}
                </p>

                {/* Estatísticas rápidas */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded bg-white p-2 text-center">
                    <div className="font-bold text-blue-600">
                      {quickEditData.subCategories.length}
                    </div>
                    <div className="text-blue-700">Subcategorias</div>
                  </div>
                  <div className="rounded bg-white p-2 text-center">
                    <div className="font-bold text-green-600">
                      {
                        menuData.items.filter(
                          (item) =>
                            item.categoryId === quickEditData.categoryId &&
                            item.barId === quickEditData.barId,
                        ).length
                      }
                    </div>
                    <div className="text-green-700">Itens na categoria</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Subcategorias</label>
                  <div className="flex gap-2">
                    <button
                      onClick={sortSubCategoriesByName}
                      className="rounded-md bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
                      title="Ordenar por nome"
                    >
                      A-Z
                    </button>
                    <button
                      onClick={sortSubCategoriesByOrder}
                      className="rounded-md bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
                      title="Ordenar por ordem atual"
                    >
                      1-9
                    </button>
                    <button
                      onClick={addSubCategoryToQuickEdit}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                      <MdAdd className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {quickEditData.subCategories.map((subCategory, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 rounded-lg border p-3 ${
                        subCategory.id.toString().includes('temp-')
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-xs font-medium">#{index + 1}</span>
                        {subCategory.id.toString().includes('temp-') && (
                          <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                            NOVA
                          </span>
                        )}
                        <button
                          onClick={() => index > 0 && reorderSubCategories(index, index - 1)}
                          disabled={index === 0}
                          className="text-gray-400 disabled:opacity-50 hover:text-gray-600"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() =>
                            index < quickEditData.subCategories.length - 1 &&
                            reorderSubCategories(index, index + 1)
                          }
                          disabled={index === quickEditData.subCategories.length - 1}
                          className="text-gray-400 disabled:opacity-50 hover:text-gray-600"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                      </div>

                      <input
                        type="text"
                        value={subCategory.name || ''}
                        onChange={(e) => updateSubCategoryInQuickEdit(index, 'name', e.target.value)}
                        placeholder={
                          subCategory.id.toString().includes('temp-')
                            ? 'Nome da nova subcategoria'
                            : 'Nome da subcategoria'
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <input
                        type="number"
                        min="0"
                        value={subCategory.order || 0}
                        onChange={(e) =>
                          updateSubCategoryInQuickEdit(index, 'order', parseInt(e.target.value) || 0)
                        }
                        className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Contador de itens */}
                      <div
                        className={`rounded px-2 py-1 text-xs ${
                          subCategory.count && subCategory.count > 0
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {subCategory.count || 0} item(s)
                      </div>

                      <button
                        onClick={() => removeSubCategoryFromQuickEdit(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                        title="Remover subcategoria"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => duplicateSubCategory(index)}
                        className="px-2 py-2 text-blue-600 hover:text-blue-800"
                        title="Duplicar subcategoria"
                      >
                        <MdAdd className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {quickEditData.subCategories.length === 0 && (
                  <p className="py-4 text-center text-sm italic text-gray-500">
                    Nenhuma subcategoria encontrada. Adicione uma nova subcategoria.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h4 className="mb-2 font-medium text-yellow-900">⚠️ Como Funciona</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>
                    • <strong>Renomear subcategorias existentes</strong>: Atualiza automaticamente
                    todos os itens que as utilizam
                  </li>
                  <li>
                    • <strong>Criar novas subcategorias</strong>: Adicione o nome e depois crie
                    itens com essas subcategorias
                  </li>
                  <li>
                    • <strong>Ordem</strong>: Determina a sequência de exibição no cardápio
                  </li>
                  <li>
                    • <strong>Subcategorias vazias</strong>: São ignoradas automaticamente
                  </li>
                  <li>
                    • <strong>Contador</strong>: Mostra quantos itens usam cada subcategoria
                  </li>
                </ul>
              </div>

              {/* Resumo das alterações */}
              {(() => {
                const changes = getChangesSummary();
                if (changes.added === 0 && changes.modified === 0) return null;

                return (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-900">📝 Resumo das Alterações</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {changes.added > 0 && (
                        <div className="text-center">
                          <div className="font-bold text-green-600">+{changes.added}</div>
                          <div className="text-green-700">Nova(s) subcategoria(s)</div>
                        </div>
                      )}
                      {changes.modified > 0 && (
                        <div className="text-center">
                          <div className="font-bold text-blue-600">~{changes.modified}</div>
                          <div className="text-blue-700">Modificada(s)</div>
                        </div>
                      )}
                    </div>
                    {changes.added > 0 && (
                      <div className="mt-3 rounded bg-green-100 p-2 text-xs text-green-700">
                        💡 <strong>Importante:</strong> Para usar as novas subcategorias, você
                        precisará criar itens com esses nomes na aba &quot;Itens do Menu&quot;.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCloseQuickEditModal}
                  className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                {(() => {
                  const changes = getChangesSummary();
                  const hasChanges = changes.added > 0 || changes.modified > 0;

                  return (
                    <button
                      onClick={handleSaveQuickEdit}
                      className={`rounded-md px-4 py-2 text-white hover:opacity-90 ${
                        hasChanges
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'cursor-not-allowed bg-gray-400'
                      }`}
                      disabled={!hasChanges}
                    >
                      {hasChanges
                        ? changes.added > 0 && changes.modified > 0
                          ? 'Salvar Alterações e Novas Subcategorias'
                          : changes.added > 0
                          ? 'Salvar Novas Subcategorias'
                          : 'Salvar Alterações'
                        : 'Nenhuma Alteração'}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </Modal>
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
      `}</style>
    </div>
  );
}