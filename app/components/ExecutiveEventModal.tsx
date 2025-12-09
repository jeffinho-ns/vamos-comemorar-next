"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdSave, MdUpload, MdDelete, MdArrowUp, MdArrowDown } from 'react-icons/md';
import Image from 'next/image';
import { ExecutiveEvent, ExecutiveEventForm } from '@/app/types/executiveEvents';
import { Establishment } from '@/app/hooks/useEstablishments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
const API_UPLOAD_URL = `${API_URL}/api/images/upload`;
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';

interface ExecutiveEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  event?: ExecutiveEvent | null;
  establishments: Establishment[];
}

interface MenuCategory {
  id: number;
  name: string;
  barId: number;
  order: number;
}

interface MenuSubcategory {
  name: string;
  categoryId: number;
  barId: number;
}

export default function ExecutiveEventModal({
  isOpen,
  onClose,
  onSave,
  event,
  establishments
}: ExecutiveEventModalProps) {
  const [formData, setFormData] = useState<ExecutiveEventForm>({
    establishment_id: '',
    name: '',
    event_date: '',
    logo_url: '',
    cover_image_url: '',
    category_ids: [],
    subcategory_ids: [],
    custom_colors: {},
    welcome_message: '',
    wifi_info: { network: '', password: '' },
    is_active: true
  });

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Estados para galeria
  const [showImageGalleryModal, setShowImageGalleryModal] = useState(false);
  const [imageGalleryField, setImageGalleryField] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<Array<{
    filename: string;
    url?: string | null;
    sourceType: string;
    imageType: string;
    usageCount: number;
  }>>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  
  // Estados para ordenação
  const [showOrderingModal, setShowOrderingModal] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState<number[]>([]);
  const [orderedSubcategories, setOrderedSubcategories] = useState<{ categoryId: number; subcategories: string[] }[]>([]);

  // Carregar dados completos do evento se estiver editando
  useEffect(() => {
    if (isOpen && event) {
      // Buscar dados completos do evento
      const fetchEventDetails = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${API_URL}/api/executive-events/${event.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const fullEvent = await response.json();
            setFormData({
              establishment_id: fullEvent.establishment_id.toString(),
              name: fullEvent.name,
              event_date: fullEvent.event_date.split('T')[0],
              logo_url: fullEvent.logo_url || '',
              cover_image_url: fullEvent.cover_image_url || '',
              category_ids: fullEvent.category_ids || [],
              subcategory_ids: fullEvent.subcategory_ids || [],
              custom_colors: fullEvent.settings?.custom_colors || {},
              welcome_message: fullEvent.settings?.welcome_message || '',
              wifi_info: fullEvent.settings?.wifi_info || { network: '', password: '' },
              is_active: fullEvent.is_active
            });
          } else {
            // Fallback para dados básicos se a busca falhar
            setFormData({
              establishment_id: event.establishment_id.toString(),
              name: event.name,
              event_date: event.event_date.split('T')[0],
              logo_url: event.logo_url || '',
              cover_image_url: event.cover_image_url || '',
              category_ids: event.category_ids || [],
              subcategory_ids: event.subcategory_ids || [],
              custom_colors: event.settings?.custom_colors || {},
              welcome_message: event.settings?.welcome_message || '',
              wifi_info: event.settings?.wifi_info || { network: '', password: '' },
              is_active: event.is_active
            });
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes do evento:', error);
          // Fallback para dados básicos
          setFormData({
            establishment_id: event.establishment_id.toString(),
            name: event.name,
            event_date: event.event_date.split('T')[0],
            logo_url: event.logo_url || '',
            cover_image_url: event.cover_image_url || '',
            category_ids: event.category_ids || [],
            subcategory_ids: event.subcategory_ids || [],
            custom_colors: event.settings?.custom_colors || {},
            welcome_message: event.settings?.welcome_message || '',
            wifi_info: event.settings?.wifi_info || { network: '', password: '' },
            is_active: event.is_active
          });
        }
      };
      
      fetchEventDetails();
    } else if (isOpen && !event) {
      // Reset form para novo evento
      setFormData({
        establishment_id: '',
        name: '',
        event_date: '',
        logo_url: '',
        cover_image_url: '',
        category_ids: [],
        subcategory_ids: [],
        custom_colors: {},
        welcome_message: '',
        wifi_info: { network: '', password: '' },
        is_active: true
      });
    }
  }, [isOpen, event]);

  // Buscar categorias quando establishment_id mudar
  useEffect(() => {
    if (formData.establishment_id) {
      fetchCategories(parseInt(formData.establishment_id));
      fetchSubcategories(parseInt(formData.establishment_id));
    } else {
      setCategories([]);
      setSubcategories([]);
    }
  }, [formData.establishment_id]);

  const fetchCategories = async (barId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cardapio/categories?barId=${barId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchSubcategories = async (barId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cardapio/subcategories/bar/${barId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubcategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error);
    }
  };

  const handleImageUpload = useCallback(
    async (file: File, type: 'logo' | 'cover') => {
      if (!file) return;

      const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
      setUploading(true);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const response = await fetch(API_UPLOAD_URL, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro no upload: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.filename) {
          if (type === 'logo') {
            setFormData(prev => ({ ...prev, logo_url: result.filename }));
          } else {
            setFormData(prev => ({ ...prev, cover_image_url: result.filename }));
          }
          alert('Imagem carregada com sucesso!');
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } catch (error) {
        console.error('❌ Erro no upload:', error);
        alert(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.establishment_id) {
      newErrors.establishment_id = 'Estabelecimento é obrigatório';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do evento é obrigatório';
    }
    if (!formData.event_date) {
      newErrors.event_date = 'Data do evento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const payload = {
        establishment_id: parseInt(formData.establishment_id),
        name: formData.name,
        event_date: formData.event_date,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        category_ids: formData.category_ids,
        subcategory_ids: formData.subcategory_ids,
        custom_colors: formData.custom_colors,
        welcome_message: formData.welcome_message || null,
        wifi_info: formData.wifi_info?.network || formData.wifi_info?.password
          ? formData.wifi_info
          : null,
        ...(event && { is_active: formData.is_active })
      };

      const url = event
        ? `${API_URL}/api/executive-events/${event.id}`
        : `${API_URL}/api/executive-events`;

      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao ${event ? 'atualizar' : 'criar'} evento`);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error(`❌ Erro ao ${event ? 'atualizar' : 'criar'} evento:`, error);
      alert(error instanceof Error ? error.message : `Erro ao ${event ? 'atualizar' : 'criar'} evento`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExecutiveEventForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_colors: {
        ...prev.custom_colors,
        [colorKey]: value
      }
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => {
      const isSelected = prev.category_ids.includes(categoryId);
      return {
        ...prev,
        category_ids: isSelected
          ? prev.category_ids.filter(id => id !== categoryId)
          : [...prev.category_ids, categoryId]
      };
    });
  };

  const handleSubcategoryToggle = (subcategoryName: string) => {
    setFormData(prev => {
      const isSelected = prev.subcategory_ids.includes(subcategoryName);
      return {
        ...prev,
        subcategory_ids: isSelected
          ? prev.subcategory_ids.filter(name => name !== subcategoryName)
          : [...prev.subcategory_ids, subcategoryName]
      };
    });
  };

  // Funções para galeria
  const getValidImageUrl = (filename?: string | null): string => {
    if (!filename || typeof filename !== 'string' || filename.trim() === '' || filename === 'null') {
      return '/placeholder-cardapio.svg';
    }
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    return `${BASE_IMAGE_URL}${filename}`;
  };

  const fetchGalleryImages = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cardapio/gallery/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
      } else {
        console.error('Erro ao buscar imagens da galeria');
        setGalleryImages([]);
      }
    } catch (error) {
      console.error('Erro ao buscar imagens da galeria:', error);
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const openImageGallery = useCallback((field: string) => {
    setImageGalleryField(field);
    setShowImageGalleryModal(true);
    fetchGalleryImages();
  }, [fetchGalleryImages]);

  const handleSelectGalleryImage = useCallback((filename: string, imageUrl?: string | null) => {
    const imageValue = imageUrl || filename;
    
    if (imageGalleryField === 'logo_url') {
      setFormData(prev => ({ ...prev, logo_url: imageValue }));
    } else if (imageGalleryField === 'cover_image_url') {
      setFormData(prev => ({ ...prev, cover_image_url: imageValue }));
    }
    
    setShowImageGalleryModal(false);
    setImageGalleryField('');
    setGallerySearchTerm('');
  }, [imageGalleryField]);

  const handleDeleteGalleryImage = useCallback(async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/cardapio/gallery/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        await fetchGalleryImages();
      } else {
        alert('Erro ao deletar imagem');
      }
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      alert('Erro ao deletar imagem');
    }
  }, [fetchGalleryImages]);

  // Funções para ordenação
  const openOrderingModal = useCallback(() => {
    if (formData.category_ids.length === 0) {
      alert('Selecione pelo menos uma categoria antes de ordenar');
      return;
    }
    
    // Inicializar ordenação com categorias selecionadas
    setOrderedCategories([...formData.category_ids]);
    
    // Inicializar ordenação de subcategorias
    const subcatsByCategory: { categoryId: number; subcategories: string[] }[] = [];
    formData.category_ids.forEach(catId => {
      const catSubcats = subcategories
        .filter(sub => sub.categoryId === catId && formData.subcategory_ids.includes(sub.name))
        .map(sub => sub.name);
      if (catSubcats.length > 0) {
        subcatsByCategory.push({ categoryId: catId, subcategories: catSubcats });
      }
    });
    setOrderedSubcategories(subcatsByCategory);
    
    setShowOrderingModal(true);
  }, [formData.category_ids, formData.subcategory_ids, subcategories]);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedCategories];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setOrderedCategories(newOrder);
  };

  const moveSubcategory = (categoryIndex: number, subcatIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedSubcategories];
    const subcats = newOrder[categoryIndex].subcategories;
    if (direction === 'up' && subcatIndex > 0) {
      [subcats[subcatIndex - 1], subcats[subcatIndex]] = [subcats[subcatIndex], subcats[subcatIndex - 1]];
    } else if (direction === 'down' && subcatIndex < subcats.length - 1) {
      [subcats[subcatIndex], subcats[subcatIndex + 1]] = [subcats[subcatIndex + 1], subcats[subcatIndex]];
    }
    setOrderedSubcategories(newOrder);
  };

  const applyOrdering = () => {
    setFormData(prev => ({
      ...prev,
      category_ids: orderedCategories,
      subcategory_ids: orderedSubcategories.flatMap(item => item.subcategories)
    }));
    setShowOrderingModal(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              {event ? 'Editar Evento Executivo' : 'Novo Evento Executivo'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Estabelecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estabelecimento *
              </label>
              <select
                value={formData.establishment_id}
                onChange={(e) => handleInputChange('establishment_id', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                required
              >
                <option value="">Selecione um estabelecimento</option>
                {establishments.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
              {errors.establishment_id && (
                <p className="text-red-400 text-sm mt-1">{errors.establishment_id}</p>
              )}
            </div>

            {/* Nome e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  required
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleInputChange('event_date', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  required
                />
                {errors.event_date && (
                  <p className="text-red-400 text-sm mt-1">{errors.event_date}</p>
                )}
              </div>
            </div>

            {/* Upload de Imagens - Galeria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo do Evento
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openImageGallery('logo_url')}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white cursor-pointer hover:bg-gray-600 transition-colors text-center"
                  >
                    <MdUpload className="inline mr-2" /> Selecionar da Galeria
                  </button>
                </div>
                {formData.logo_url && (
                  <div className="mt-2 relative">
                    <Image
                      src={getValidImageUrl(formData.logo_url)}
                      alt="Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Imagem de Capa
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openImageGallery('cover_image_url')}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white cursor-pointer hover:bg-gray-600 transition-colors text-center"
                  >
                    <MdUpload className="inline mr-2" /> Selecionar da Galeria
                  </button>
                </div>
                {formData.cover_image_url && (
                  <div className="mt-2 relative">
                    <Image
                      src={getValidImageUrl(formData.cover_image_url)}
                      alt="Capa"
                      width={80}
                      height={80}
                      className="object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Categorias e Subcategorias */}
            {formData.establishment_id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categorias (selecione para incluir todos os itens da categoria)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.category_ids.includes(cat.id)}
                          onChange={() => handleCategoryToggle(cat.id)}
                          className="rounded"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-gray-400 text-sm">Nenhuma categoria encontrada</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subcategorias (selecione para incluir todos os itens da subcategoria)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3 space-y-2">
                    {subcategories.map(sub => (
                      <label key={`${sub.categoryId}-${sub.name}`} className="flex items-center gap-2 text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.subcategory_ids.includes(sub.name)}
                          onChange={() => handleSubcategoryToggle(sub.name)}
                          className="rounded"
                        />
                        <span>{sub.name}</span>
                      </label>
                    ))}
                    {subcategories.length === 0 && (
                      <p className="text-gray-400 text-sm">Nenhuma subcategoria encontrada</p>
                    )}
                  </div>
                </div>
                
                {/* Botão de Ordenação */}
                {(formData.category_ids.length > 0 || formData.subcategory_ids.length > 0) && (
                  <div>
                    <button
                      type="button"
                      onClick={openOrderingModal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <MdArrowUp className="inline" />
                      Ordenar Categorias e Subcategorias
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Cores Customizadas */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Cores Customizadas
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'categoryBgColor', label: 'Fundo Categorias' },
                  { key: 'categoryTextColor', label: 'Texto Categorias' },
                  { key: 'subcategoryBgColor', label: 'Fundo Subcategorias' },
                  { key: 'subcategoryTextColor', label: 'Texto Subcategorias' },
                  { key: 'sidebarBgColor', label: 'Fundo Sidebar' },
                  { key: 'sidebarTextColor', label: 'Texto Sidebar' },
                  { key: 'backgroundColor', label: 'Fundo Geral' },
                  { key: 'textColor', label: 'Texto Geral' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 w-32">{label}</label>
                    <input
                      type="color"
                      value={formData.custom_colors?.[key as keyof typeof formData.custom_colors] || '#ffffff'}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="h-10 w-20 rounded border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.custom_colors?.[key as keyof typeof formData.custom_colors] || ''}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                      placeholder="#hex"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mensagem de Boas-Vindas */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mensagem de Boas-Vindas
              </label>
              <textarea
                value={formData.welcome_message}
                onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                placeholder="Mensagem personalizada para os convidados..."
              />
            </div>

            {/* WiFi Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WiFi - Nome da Rede
                </label>
                <input
                  type="text"
                  value={formData.wifi_info?.network || ''}
                  onChange={(e) => handleInputChange('wifi_info', { ...formData.wifi_info, network: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="Nome da rede WiFi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WiFi - Senha
                </label>
                <input
                  type="text"
                  value={formData.wifi_info?.password || ''}
                  onChange={(e) => handleInputChange('wifi_info', { ...formData.wifi_info, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="Senha do WiFi"
                />
              </div>
            </div>

            {/* Status (apenas na edição) */}
            {event && (
              <div>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="rounded"
                  />
                  <span>Evento Ativo</span>
                </label>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : (
                  <>
                    <MdSave size={20} />
                    {event ? 'Atualizar' : 'Criar'} Evento
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      
      {/* Modal de Galeria de Imagens */}
      <AnimatePresence>
        {showImageGalleryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowImageGalleryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Galeria de Imagens</h2>
                  <button
                    onClick={() => setShowImageGalleryModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={gallerySearchTerm}
                    onChange={(e) => setGallerySearchTerm(e.target.value)}
                    placeholder="Buscar imagem..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files[0]) {
                          setUploadingLogo(true);
                          await handleImageUpload(files[0], imageGalleryField === 'logo_url' ? 'logo' : 'cover');
                          setUploadingLogo(false);
                          await fetchGalleryImages();
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <MdUpload size={20} />
                    Upload
                  </button>
                </div>
                
                {galleryLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <span className="text-gray-400">Carregando imagens...</span>
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MdUpload className="h-12 w-12 mb-4" />
                    <p>Nenhuma imagem encontrada.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryImages
                      .filter(img => 
                        !gallerySearchTerm || 
                        img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase())
                      )
                      .map((image, index) => {
                        const imageUrl = image.url || getValidImageUrl(image.filename);
                        return (
                          <div
                            key={`${image.filename}-${index}`}
                            className="relative group cursor-pointer rounded-lg border-2 border-gray-600 hover:border-yellow-500 transition-all overflow-hidden"
                            onClick={() => handleSelectGalleryImage(image.filename, image.url || undefined)}
                          >
                            <div className="aspect-square relative bg-gray-700">
                              <Image
                                src={imageUrl}
                                alt={image.filename}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                                  Selecionar
                                </span>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2">
                              <p className="truncate font-medium">{image.filename}</p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteGalleryImage(image.filename, e)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de Ordenação */}
      <AnimatePresence>
        {showOrderingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowOrderingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Ordenar Categorias e Subcategorias</h2>
                  <button
                    onClick={() => setShowOrderingModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Ordenação de Categorias */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Categorias</h3>
                  <div className="space-y-2">
                    {orderedCategories.map((catId, index) => {
                      const cat = categories.find(c => c.id === catId);
                      if (!cat) return null;
                      return (
                        <div key={catId} className="flex items-center gap-2 bg-gray-700 rounded-lg p-3">
                          <button
                            type="button"
                            onClick={() => moveCategory(index, 'up')}
                            disabled={index === 0}
                            className="p-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdArrowUp size={20} className="text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCategory(index, 'down')}
                            disabled={index === orderedCategories.length - 1}
                            className="p-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MdArrowDown size={20} className="text-white" />
                          </button>
                          <span className="flex-1 text-white">{cat.name}</span>
                          <span className="text-gray-400 text-sm">#{index + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Ordenação de Subcategorias */}
                {orderedSubcategories.map((item, catIndex) => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  return (
                    <div key={item.categoryId}>
                      <h3 className="text-md font-semibold text-gray-300 mb-2">
                        Subcategorias de {cat?.name || 'Categoria'}
                      </h3>
                      <div className="space-y-2">
                        {item.subcategories.map((subcat, subIndex) => (
                          <div key={subcat} className="flex items-center gap-2 bg-gray-700 rounded-lg p-3 ml-4">
                            <button
                              type="button"
                              onClick={() => moveSubcategory(catIndex, subIndex, 'up')}
                              disabled={subIndex === 0}
                              className="p-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <MdArrowUp size={20} className="text-white" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSubcategory(catIndex, subIndex, 'down')}
                              disabled={subIndex === item.subcategories.length - 1}
                              className="p-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <MdArrowDown size={20} className="text-white" />
                            </button>
                            <span className="flex-1 text-white">{subcat}</span>
                            <span className="text-gray-400 text-sm">#{subIndex + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowOrderingModal(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyOrdering}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-colors font-semibold"
                  >
                    Aplicar Ordenação
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

