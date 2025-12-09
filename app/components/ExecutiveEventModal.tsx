"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdSave, MdUpload } from 'react-icons/md';
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

  // Carregar dados do evento se estiver editando
  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        establishment_id: event.establishment_id.toString(),
        name: event.name,
        event_date: event.event_date.split('T')[0], // Formato YYYY-MM-DD
        logo_url: event.logo_url || '',
        cover_image_url: event.cover_image_url || '',
        category_ids: [],
        subcategory_ids: [],
        custom_colors: {},
        welcome_message: '',
        wifi_info: { network: '', password: '' },
        is_active: event.is_active
      });
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

            {/* Upload de Imagens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo do Evento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo');
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white cursor-pointer hover:bg-gray-600 transition-colors text-center"
                  >
                    {uploadingLogo ? 'Enviando...' : (
                      <>
                        <MdUpload className="inline mr-2" /> Upload Logo
                      </>
                    )}
                  </label>
                </div>
                {formData.logo_url && (
                  <img
                    src={formData.logo_url.startsWith('http') ? formData.logo_url : `${BASE_IMAGE_URL}${formData.logo_url}`}
                    alt="Logo"
                    className="mt-2 h-20 object-contain"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Imagem de Capa
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'cover');
                    }}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white cursor-pointer hover:bg-gray-600 transition-colors text-center"
                  >
                    {uploadingCover ? 'Enviando...' : (
                      <>
                        <MdUpload className="inline mr-2" /> Upload Capa
                      </>
                    )}
                  </label>
                </div>
                {formData.cover_image_url && (
                  <img
                    src={formData.cover_image_url.startsWith('http') ? formData.cover_image_url : `${BASE_IMAGE_URL}${formData.cover_image_url}`}
                    alt="Capa"
                    className="mt-2 h-20 object-contain"
                  />
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
    </AnimatePresence>
  );
}

