"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdSave } from 'react-icons/md';
import ArtistOSDynamicForm, { DynamicField } from './ArtistOSDynamicForm';

interface ArtistOSCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  establishments: Array<{ id: number | string; name: string }>;
}

export default function ArtistOSCreateModal({
  isOpen,
  onClose,
  onSave,
  establishments
}: ArtistOSCreateModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    os_number: '',
    event_day: '',
    project_name: '',
    establishment_id: null,
  });
  const [customFields, setCustomFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleAddField = (field: DynamicField) => {
    setCustomFields(prev => [...prev, field]);
    setFormData(prev => ({ ...prev, [field.key]: field.value }));
  };

  const handleRemoveField = (key: string) => {
    setCustomFields(prev => prev.filter(f => f.key !== key));
    const newFormData = { ...formData };
    delete newFormData[key];
    setFormData(newFormData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.event_day) {
      newErrors.event_day = 'Data do evento é obrigatória';
    }

    if (!formData.project_name || !formData.project_name.trim()) {
      newErrors.project_name = 'Nome do projeto é obrigatório';
    }

    // artistic_attraction e ticket_prices são obrigatórios na API
    // Vamos usar project_name para artistic_attraction e garantir ticket_prices
    if (!formData.ticket_values || !formData.ticket_values.trim()) {
      newErrors.ticket_values = 'Valores de entrada são obrigatórios';
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
      // Separar campos padrão e campos dinâmicos
      // artistic_attraction e ticket_prices são obrigatórios na API
      const projectName = formData.project_name?.trim() || 'OS de Artista';
      const ticketPrices = formData.ticket_values?.trim() || 'Não informado';
      
      const standardFields: Record<string, any> = {
        os_type: 'artist' as const,
        os_number: formData.os_number || null,
        event_date: formData.event_day,
        establishment_id: formData.establishment_id || null,
        show_schedule: formData.working_hours || '',
        ticket_prices: ticketPrices,
        promotions: formData.promotions || '',
        artistic_attraction: projectName, // Obrigatório
        event_name: projectName,
        is_active: true,
      };

      // Coletar campos dinâmicos
      const dynamicFields: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (
          ['benefits', 'menu', 'briefing', 'partnership', 'tv_games'].includes(key) ||
          key.startsWith('custom_')
        ) {
          if (value !== null && value !== undefined && value !== '') {
            dynamicFields[key] = value;
          }
        }
      });

      // Salvar campos dinâmicos em admin_notes como JSON
      if (Object.keys(dynamicFields).length > 0) {
        standardFields.admin_notes = JSON.stringify({ dynamicFields });
      }

      // Adicionar outros campos (excluindo project_name que já foi usado)
      Object.entries(formData).forEach(([key, value]) => {
        if (
          !['event_day', 'os_number', 'establishment_id', 'project_name', 'working_hours', 'ticket_values', 'promotions',
            'benefits', 'menu', 'briefing', 'partnership', 'tv_games'].includes(key) &&
          !key.startsWith('custom_') &&
          value !== null &&
          value !== undefined &&
          value !== ''
        ) {
          standardFields[key] = value;
        }
      });

      await onSave(standardFields);
      
      // Limpar formulário
      setFormData({
        os_number: '',
        event_day: '',
        project_name: '',
        establishment_id: null,
      });
      setCustomFields([]);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Nova OS de Artista/Banda/DJ
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Campos Básicos no Topo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da OS
                </label>
                <input
                  type="text"
                  value={formData.os_number || ''}
                  onChange={(e) => handleFieldChange('os_number', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: OS-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.event_day}
                  onChange={(e) => handleFieldChange('event_day', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.event_day
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  required
                />
                {errors.event_day && (
                  <p className="mt-1 text-sm text-red-500">{errors.event_day}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estabelecimento
                </label>
                <select
                  value={formData.establishment_id || ''}
                  onChange={(e) => handleFieldChange('establishment_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione um estabelecimento</option>
                  {establishments.map((est) => (
                    <option key={est.id} value={typeof est.id === 'string' ? parseInt(est.id) : est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mensagem Informativa */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                🎤 OS para Contratação de Artista / Banda / DJ
              </h3>
              <p className="text-sm text-purple-700">
                Preencha todos os dados necessários para gerar a Ordem de Serviço.
              </p>
            </div>

            {/* Campos Dinâmicos */}
            <div className="space-y-4">
              {/* Nome do Projeto - Campo obrigatório */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.project_name || ''}
                  onChange={(e) => handleFieldChange('project_name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.project_name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Digite o nome do projeto..."
                  required
                />
                {errors.project_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.project_name}</p>
                )}
              </div>

              {/* Outros campos dinâmicos */}
              <ArtistOSDynamicForm
                formData={formData}
                onFieldChange={handleFieldChange}
                onAddField={handleAddField}
                onRemoveField={handleRemoveField}
                errors={errors}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <MdSave size={20} />
                    Salvar
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

