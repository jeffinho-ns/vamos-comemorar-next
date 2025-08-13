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
  MdUpload
} from 'react-icons/md';

// Interfaces atualizadas para corresponder à API
interface Topping {
  id: string | number;
  name: string;
  price: number;
}

interface MenuSubCategory {
  id: string | number;
  name: string;
  categoryId: string | number;
  barId: string | number;
  order: number;
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
}

interface MenuCategory {
  id: string | number;
  name: string;
  barId: string | number;
  order: number;
  subCategories?: MenuSubCategory[]; // Adicionado para incluir sub-categorias
}

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
}

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api/cardapio';
const API_UPLOAD_URL = 'https://vamos-comemorar-api.onrender.com/api/images/upload';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/400x300';
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

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
  const [activeTab, setActiveTab] = useState<'bars' | 'categories' | 'items'>('bars');
  const [showBarModal, setShowBarModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
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
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [barForm, setBarForm] = useState<BarForm>({
    name: '', slug: '', description: '', logoUrl: '', coverImageUrl: '',
    coverImages: [], // Inicializa com array vazio
    address: '', rating: '', reviewsCount: '', amenities: [], latitude: '', longitude: ''
  });

  const [categoryForm, setCategoryForm] = useState<MenuCategoryForm>({
    name: '', barId: '', order: 0, subCategories: []
  });

  const [itemForm, setItemForm] = useState<MenuItemForm>({
    name: '', description: '', price: '', imageUrl: '', categoryId: '', barId: '', subCategory: '', toppings: [], order: 0
  });

  const [newTopping, setNewTopping] = useState({ name: '', price: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
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

      // Extrai sub-categorias únicas dos itens existentes
      const subCategories = items.reduce((acc: any[], item: any) => {
        if (item.subCategoryName && item.subCategoryName.trim() !== '') {
          const existing = acc.find(sub => 
            sub.name === item.subCategoryName && 
            sub.categoryId === item.categoryId && 
            sub.barId === item.barId
          );
          if (!existing) {
            acc.push({
              id: `${item.categoryId}-${item.barId}-${item.subCategoryName}`,
              name: item.subCategoryName,
              categoryId: item.categoryId,
              barId: item.barId,
              order: 0
            });
          }
        }
        return acc;
      }, []);

      const barsData = Array.isArray(bars) ? bars.map(bar => {
        const cleanedBar = {
          ...bar,
          logoUrl: bar.logoUrl?.includes(BASE_IMAGE_URL) 
            ? bar.logoUrl.split('/').pop() 
            : bar.logoUrl,
          coverImageUrl: bar.coverImageUrl?.includes(BASE_IMAGE_URL) 
            ? bar.coverImageUrl.split('/').pop() 
            : bar.coverImageUrl,
          coverImages: Array.isArray(bar.coverImages) 
            ? bar.coverImages.map((url: string) => url.includes(BASE_IMAGE_URL) 
              ? url.split('/').pop() || '' : url)
            : []
        };
        return cleanedBar;
      }) : [];
      
      const categoriesData = Array.isArray(categories) ? categories : [];
      const subCategoriesData = Array.isArray(subCategories) ? subCategories : [];
      const itemsData = Array.isArray(items) ? items.map(item => {
        const cleanedItem = {
          ...item,
          imageUrl: item.imageUrl?.includes(BASE_IMAGE_URL) 
            ? item.imageUrl.split('/').pop() 
            : item.imageUrl
        };
        return cleanedItem;
      }) : [];

      setMenuData({
        bars: barsData,
        categories: categoriesData,
        subCategories: subCategoriesData,
        items: itemsData
      });

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        price: parseFloat(newTopping.price)
      };
      setItemForm((prev: MenuItemForm) => ({
        ...prev,
        toppings: [...prev.toppings, topping]
      }));
      setNewTopping({ name: '', price: '' });
    }
  }, [newTopping]);

  const handleRemoveTopping = useCallback((toppingId: string) => {
    setItemForm((prev: MenuItemForm) => ({
      ...prev,
      toppings: prev.toppings.filter(t => t.id !== toppingId)
    }));
  }, []);

  const handleCloseBarModal = useCallback(() => {
    setShowBarModal(false);
    setEditingBar(null);
    setBarForm({
      name: '', slug: '', description: '', logoUrl: '', coverImageUrl: '',
      coverImages: [], // Limpa a lista de imagens
      address: '', rating: '', reviewsCount: '', amenities: [], latitude: '', longitude: ''
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
      name: '', description: '', price: '', imageUrl: '', categoryId: '', barId: '', subCategory: '', toppings: [], order: 0
    });
    setNewTopping({ name: '', price: '' });
  }, []);

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
        longitude: barForm.longitude ? parseFloat(barForm.longitude) : null
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
        await fetchData();
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
        order: parseInt(categoryForm.order.toString()) || 0
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
        alert(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
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
        order: parseInt(itemForm.order.toString()) || 0
      };
      
      console.log('🔄 Salvando item:', method, url, itemData);
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json'
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
      coverImages: bar.coverImages || [], // Adiciona a lista de imagens
      address: bar.address,
      rating: bar.rating?.toString() || '',
      reviewsCount: bar.reviewsCount?.toString() || '',
      amenities: bar.amenities || [],
      latitude: bar.latitude?.toString() || '',
      longitude: bar.longitude?.toString() || ''
    });
    setShowBarModal(true);
  }, []);

  const handleEditCategory = useCallback((category: MenuCategory) => {
    setEditingCategory(category);
    
    const categorySubCategories = menuData.items
      .filter(item => item.categoryId === category.id && item.subCategoryName && item.subCategoryName.trim() !== '')
      .reduce((acc: any[], item) => {
        const existing = acc.find(sub => sub.name === item.subCategoryName);
        if (!existing) {
          acc.push({ name: item.subCategoryName, order: 0 });
        }
        return acc;
      }, []);
    
    setCategoryForm({
      name: category.name,
      barId: category.barId?.toString() || '',
      order: category.order,
      subCategories: categorySubCategories
    });
    setShowCategoryModal(true);
  }, [menuData.items]);

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
      order: item.order
    });
    setShowItemModal(true);
  }, []);

  const handleDeleteBar = useCallback(async (barId: string | number) => {
    if (confirm('Tem certeza que deseja excluir este estabelecimento?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/bars/${barId}`, { method: 'DELETE' });
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
  }, [fetchData]);

  const handleDeleteCategory = useCallback(async (categoryId: string | number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, { method: 'DELETE' });
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
  }, [fetchData]);

  const handleDeleteItem = useCallback(async (itemId: string | number) => {
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
  }, [fetchData]);

  const handleImageUpload = useCallback(async (file: File, field: string) => {
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
      setBarForm(prev => ({ ...prev, coverImages: [...prev.coverImages, tempUrl] }));
    } else if (field === 'logoUrl' || field === 'coverImageUrl') {
      setBarForm(prev => ({ ...prev, [field]: tempUrl }));
    } else {
      setItemForm(prev => ({ ...prev, imageUrl: tempUrl }));
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
        throw new Error(errorData.error || `Erro no upload: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado do upload:', result);

      if (result.success && result.filename) {
        const filename = result.filename;
        if (field === 'coverImages') {
          setBarForm(prev => {
            const updatedImages = prev.coverImages.map(url => url === tempUrl ? filename : url);
            return { ...prev, coverImages: updatedImages };
          });
        } else if (field === 'logoUrl' || field === 'coverImageUrl') {
          setBarForm(prev => ({ ...prev, [field]: filename }));
        } else {
          setItemForm(prev => ({ ...prev, imageUrl: filename }));
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
        setBarForm(prev => ({ ...prev, coverImages: prev.coverImages.filter(url => url !== tempUrl) }));
      } else if (field === 'logoUrl' || field === 'coverImageUrl') {
        setBarForm(prev => ({ ...prev, [field]: '' }));
      } else {
        setItemForm(prev => ({ ...prev, imageUrl: '' }));
      }
    }
  }, []);

  const handleRemoveCoverImage = (urlToRemove: string) => {
    setBarForm(prev => ({
      ...prev,
      coverImages: prev.coverImages.filter(url => url !== urlToRemove)
    }));
  };

  const selectImageFile = useCallback((field: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = field === 'coverImages'; // Habilita múltiplas seleções
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        if (field === 'coverImages') {
          Array.from(files).forEach(file => handleImageUpload(file, field));
        } else {
          handleImageUpload(files[0], field);
        }
      }
    };
    input.click();
  }, [handleImageUpload]);

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
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), []);

  if (loading) return <div className="text-center p-8">Carregando...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciamento do Cardápio
          </h1>
          <p className="text-gray-600">
            Gerencie estabelecimentos, categorias e itens do cardápio
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'bars', name: 'Estabelecimentos', count: menuData.bars.length },
                { id: 'categories', name: 'Categorias', count: menuData.categories.length },
                { id: 'items', name: 'Itens do Menu', count: menuData.items.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
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
          >
            {activeTab === 'bars' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Estabelecimentos</h2>
                  <button
                    onClick={() => setShowBarModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <MdAdd className="w-5 h-5" />
                    Adicionar Estabelecimento
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuData.bars.map((bar) => (
                    <div key={bar.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="relative h-48">
                        <Image
                          src={getValidImageUrl(bar.coverImageUrl)}
                          alt={bar.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => handleEditBar(bar)}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBar(bar.id)}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{bar.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bar.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MdStar className="w-4 h-4 text-yellow-400" />
                          <span>{bar.rating}</span>
                          <span>({bar.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MdLocationOn className="w-4 h-4" />
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <MdAdd className="w-5 h-5" />
                    Adicionar Categoria
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuData.categories.map((category) => {
                    const bar = menuData.bars.find(b => b.id === category.barId);
                    return (
                      <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-500">{bar?.name}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Ordem: {category.order}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Itens do Menu</h2>
                  <button
                    onClick={() => setShowItemModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <MdAdd className="w-5 h-5" />
                    Adicionar Item
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {menuData.items.map((item) => {
                    const bar = menuData.bars.find(b => b.id === item.barId);
                    const category = menuData.categories.find(c => c.id === item.categoryId);
                    return (
                      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative h-48">
                          <Image
                            src={getValidImageUrl(item.imageUrl)}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded-full shadow-md">
                            <span className="text-sm font-bold text-green-600">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="text-xs text-gray-500">
                            <p>{bar?.name} • {category?.name}</p>
                            {(item.subCategory || item.subCategoryName) && <p>Sub-categoria: {item.subCategory || item.subCategoryName}</p>}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={barForm.name}
                  onChange={(e) => setBarForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={barForm.slug}
                  onChange={(e) => setBarForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={barForm.description}
                onChange={(e) => setBarForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barForm.logoUrl}
                    onChange={(e) => setBarForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => selectImageFile('logoUrl')}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                  >
                    <MdUpload className="w-4 h-4" />
                  </button>
                </div>
                {barForm.logoUrl && barForm.logoUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(barForm.logoUrl)}
                      alt="Preview do logo"
                      width={100}
                      height={100}
                      className="rounded-lg object-cover border"
                      unoptimized={barForm.logoUrl.startsWith('blob:')}
                      priority={true}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagens de Capa (Carrossel)</label>
                <div className="flex gap-2 items-center mb-2">
                  <button
                    onClick={() => selectImageFile('coverImages')}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 w-full justify-center"
                  >
                    <MdAdd className="w-4 h-4" />
                    Adicionar Imagem(ns)
                  </button>
                </div>
                {barForm.coverImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {barForm.coverImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={getValidImageUrl(imageUrl)}
                          alt={`Preview da imagem de capa ${index + 1}`}
                          width={200}
                          height={100}
                          className="rounded-lg object-cover border"
                          unoptimized={imageUrl.startsWith('blob:')}
                          priority={true}
                        />
                        <button
                          onClick={() => handleRemoveCoverImage(imageUrl)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={barForm.address}
                onChange={(e) => setBarForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={barForm.rating}
                  onChange={(e) => setBarForm(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Avaliações</label>
                <input
                  type="number"
                  min="0"
                  value={barForm.reviewsCount}
                  onChange={(e) => setBarForm(prev => ({ ...prev, reviewsCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={barForm.latitude}
                  onChange={(e) => setBarForm(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={barForm.longitude}
                onChange={(e) => setBarForm(prev => ({ ...prev, longitude: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseBarModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveBar()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estabelecimento</label>
              <select
                value={categoryForm.barId}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, barId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um estabelecimento</option>
                {menuData.bars.map((bar) => (
                  <option key={bar.id} value={bar.id}>{bar.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input
                type="number"
                min="0"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sub-categorias */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Sub-categorias</label>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryForm(prev => ({
                      ...prev,
                      subCategories: [...prev.subCategories, { name: '', order: prev.subCategories.length }]
                    }));
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  + Adicionar Sub-categoria
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categoryForm.subCategories.map((subCategory, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={subCategory.name}
                      onChange={(e) => {
                        const newSubCategories = [...categoryForm.subCategories];
                        newSubCategories[index] = { ...newSubCategories[index], name: e.target.value };
                        setCategoryForm(prev => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      placeholder="Nome da sub-categoria"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={subCategory.order}
                      onChange={(e) => {
                        const newSubCategories = [...categoryForm.subCategories];
                        newSubCategories[index] = { ...newSubCategories[index], order: parseInt(e.target.value) || 0 };
                        setCategoryForm(prev => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      placeholder="Ordem"
                      className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSubCategories = categoryForm.subCategories.filter((_, i) => i !== index);
                        setCategoryForm(prev => ({ ...prev, subCategories: newSubCategories }));
                      }}
                      className="px-2 py-2 text-red-600 hover:text-red-800"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {categoryForm.subCategories.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Nenhuma sub-categoria adicionada.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseCategoryModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveCategory()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do arquivo da imagem do item</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="Nome do arquivo (ex: ABC123.jpg)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => selectImageFile('imageUrl')}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                  >
                    <MdUpload className="w-4 h-4" />
                  </button>
                </div>
                {itemForm.imageUrl && itemForm.imageUrl.trim() !== '' && (
                  <div className="mt-2">
                    <Image
                      src={getValidImageUrl(itemForm.imageUrl)}
                      alt="Preview da imagem do item"
                      width={150}
                      height={100}
                      className="rounded-lg object-cover border"
                      unoptimized={itemForm.imageUrl.startsWith('blob:')}
                      priority={true}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-categoria</label>
                <input
                  type="text"
                  value={itemForm.subCategory}
                  onChange={(e) => setItemForm(prev => ({ ...prev, subCategory: e.target.value }))}
                  placeholder="Ex: Hambúrgueres, Caipirinhas, Porções..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Digite uma sub-categoria para organizar melhor seus itens</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estabelecimento</label>
                <select
                  value={itemForm.barId}
                  onChange={(e) => setItemForm(prev => ({ ...prev, barId: e.target.value, categoryId: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um estabelecimento</option>
                  {menuData.bars.map((bar) => (
                    <option key={bar.id} value={bar.id}>{bar.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!itemForm.barId}
                >
                  <option value="">Selecione uma categoria</option>
                  {menuData.categories
                    .filter(cat => cat.barId?.toString() === itemForm.barId)
                    .map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input
                type="number"
                min="0"
                value={itemForm.order}
                onChange={(e) => setItemForm(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Toppings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adicionais</label>
              <div className="space-y-2">
                {itemForm.toppings.map((topping) => (
                  <div key={topping.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="flex-1 text-sm">{topping.name}</span>
                    <span className="text-sm font-medium text-green-600">
                      +{formatPrice(topping.price)}
                    </span>
                    <button
                      onClick={() => handleRemoveTopping(topping.id.toString())}
                      className="text-red-600 hover:text-red-800"
                    >
                      <MdClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do adicional"
                    value={newTopping.name}
                    onChange={(e) => setNewTopping(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    value={newTopping.price}
                    onChange={(e) => setNewTopping(prev => ({ ...prev, price: e.target.value }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTopping}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <MdAdd className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseItemModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveItem()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
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