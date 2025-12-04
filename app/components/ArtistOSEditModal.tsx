"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdSave } from 'react-icons/md';
import { OperationalDetail } from '@/app/types/operationalDetail';
import ArtistOSDynamicForm, { DynamicField } from './ArtistOSDynamicForm';
import { useEstablishments } from '@/app/hooks/useEstablishments';

interface ArtistOSEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  detail: OperationalDetail | null;
}

export default function ArtistOSEditModal({
  isOpen,
  onClose,
  onSave,
  detail
}: ArtistOSEditModalProps) {
  const { establishments } = useEstablishments();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && detail) {
      // Inicializar formData com os dados do detail
      const initialData: Record<string, any> = {};
      
      // Campos padrão do topo
      if (detail.os_number) initialData.os_number = detail.os_number;
      if (detail.event_date) initialData.event_day = detail.event_date;
      if (detail.establishment_id) initialData.establishment_id = detail.establishment_id;
      if (detail.event_name) initialData.project_name = detail.event_name;
      if (detail.show_schedule) initialData.working_hours = detail.show_schedule;
      if (detail.ticket_prices) initialData.ticket_values = detail.ticket_prices;
      if (detail.promotions) initialData.promotions = detail.promotions;
      
      // Extrair campos dinâmicos de admin_notes (JSON)
      if (detail.admin_notes) {
        try {
          const notesData = JSON.parse(detail.admin_notes);
          if (notesData.dynamicFields) {
            Object.entries(notesData.dynamicFields).forEach(([key, value]) => {
              initialData[key] = value;
              // Se for um campo customizado, adicionar à lista
              if (key.startsWith('custom_')) {
                const label = key.split('_').slice(2).join(' ').replace(/_/g, ' ');
                setCustomFields(prev => [...prev, {
                  key,
                  label: label.charAt(0).toUpperCase() + label.slice(1),
                  value: String(value),
                  type: String(value).includes('\n') ? 'textarea' : 'text'
                }]);
              }
            });
          }
        } catch {
          // Se não for JSON, ignorar
        }
      }
      
      // Extrair outros campos do detail que podem ser úteis
      Object.entries(detail).forEach(([key, value]) => {
        if (
          value !== null && 
          value !== undefined && 
          value !== '' &&
          !['id', 'os_type', 'os_number', 'event_id', 'establishment_id',
            'event_date', 'artistic_attraction', 'show_schedule', 'ticket_prices',
            'promotions', 'visual_reference_url', 'admin_notes', 'operational_instructions',
            'is_active', 'created_at', 'updated_at', 'establishment_name', 'event_name',
            'contractor_name', 'contractor_cnpj', 'contractor_address', 'contractor_legal_responsible',
            'contractor_legal_cpf', 'contractor_phone', 'contractor_email',
            'artist_artistic_name', 'artist_full_name', 'artist_cpf_cnpj', 'artist_address',
            'artist_phone', 'artist_email', 'artist_responsible_name',
            'artist_bank_name', 'artist_bank_agency', 'artist_bank_account', 'artist_bank_account_type',
            'event_location_address', 'event_presentation_date', 'event_presentation_time',
            'event_duration', 'event_soundcheck_time', 'event_structure_offered',
            'event_equipment_provided_by_contractor', 'event_equipment_brought_by_artist',
            'financial_total_value', 'financial_payment_method', 'financial_payment_conditions',
            'financial_discounts_or_fees', 'general_penalties', 'general_transport_responsibility',
            'general_image_rights', 'contractor_signature', 'artist_signature'
          ].includes(key) &&
          !['event_day', 'project_name', 'working_hours', 'ticket_values', 'promotions',
            'benefits', 'menu', 'briefing', 'partnership', 'tv_games'].includes(key) &&
          !key.startsWith('custom_')
        ) {
          initialData[key] = value;
        }
      });

      setFormData(initialData);
    }
  }, [isOpen, detail]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Separar campos padrão e campos dinâmicos
      // artistic_attraction e ticket_prices são obrigatórios na API
      const projectName = formData.project_name?.trim() || detail?.event_name || detail?.artistic_attraction || 'OS de Artista';
      const ticketPrices = formData.ticket_values?.trim() || detail?.ticket_prices || 'Não informado';
      
      const standardFields: Record<string, any> = {
        id: detail?.id,
        os_type: 'artist' as const,
        os_number: formData.os_number || detail?.os_number || null,
        event_date: formData.event_day || detail?.event_date,
        establishment_id: formData.establishment_id !== undefined ? formData.establishment_id : detail?.establishment_id,
        event_name: projectName,
        show_schedule: formData.working_hours || detail?.show_schedule,
        ticket_prices: ticketPrices, // Obrigatório
        promotions: formData.promotions || detail?.promotions,
        artistic_attraction: projectName, // Obrigatório
      };

      // Coletar campos dinâmicos (benefits, menu, briefing, partnership, tv_games e customizados)
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

      // Salvar campos dinâmicos em admin_notes como JSON (preservando dados existentes se houver)
      if (Object.keys(dynamicFields).length > 0) {
        try {
          const existingNotes = detail?.admin_notes ? JSON.parse(detail.admin_notes) : {};
          standardFields.admin_notes = JSON.stringify({ ...existingNotes, dynamicFields });
        } catch {
          // Se não for JSON válido, criar novo objeto
          standardFields.admin_notes = JSON.stringify({ dynamicFields });
        }
      }

      // Adicionar todos os outros campos do formData que não são dinâmicos
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
              Editar OS de Artista/Banda/DJ
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
                  value={formData.event_day || ''}
                  onChange={(e) => handleFieldChange('event_day', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
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
              {/* Nome do Projeto */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.project_name || ''}
                  onChange={(e) => handleFieldChange('project_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Digite o nome do projeto..."
                  required
                />
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

