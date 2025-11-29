"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MdClose, MdSave, MdUpload } from 'react-icons/md';
import { OperationalDetail, OperationalDetailFormData, OSType } from '@/app/types/operationalDetail';
import { Establishment } from '@/app/hooks/useEstablishments';
import OSTypeSelectionModal from './OSTypeSelectionModal';
import ArtistOSForm from './ArtistOSForm';
import BarServiceOSForm from './BarServiceOSForm';

const API_UPLOAD_URL = 'https://vamos-comemorar-api.onrender.com/api/images/upload';
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
const PLACEHOLDER_IMAGE_URL = '/placeholder-cardapio.svg';

const getValidImageUrl = (filename: string): string => {
  if (!filename || filename.trim() === '' || filename.startsWith('blob:')) {
    return PLACEHOLDER_IMAGE_URL;
  }
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${BASE_IMAGE_URL}${filename}`;
};

interface OperationalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  detail?: OperationalDetail | null;
  establishments: Establishment[];
}

export default function OperationalDetailsModal({
  isOpen,
  onClose,
  onSave,
  detail,
  establishments
}: OperationalDetailsModalProps) {
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [osType, setOsType] = useState<OSType>(null);
  const [formData, setFormData] = useState<OperationalDetailFormData>({
    os_type: null,
    os_number: '',
    event_id: null,
    establishment_id: null,
    event_date: '',
    artistic_attraction: '',
    show_schedule: '',
    ticket_prices: '',
    promotions: '',
    visual_reference_url: '',
    admin_notes: '',
    operational_instructions: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (detail) {
        // Preencher formulário com dados existentes
        setOsType(detail.os_type || null);
        setFormData({
          os_type: detail.os_type || null,
          os_number: detail.os_number || '',
          event_id: detail.event_id || null,
          establishment_id: detail.establishment_id || null,
          event_date: detail.event_date,
          artistic_attraction: detail.artistic_attraction,
          show_schedule: detail.show_schedule || '',
          ticket_prices: detail.ticket_prices,
          promotions: detail.promotions || '',
          visual_reference_url: detail.visual_reference_url || '',
          admin_notes: detail.admin_notes || '',
          operational_instructions: detail.operational_instructions || '',
          is_active: detail.is_active,
          // Campos de Artista
          contractor_name: detail.contractor_name || '',
          contractor_cnpj: detail.contractor_cnpj || '',
          contractor_address: detail.contractor_address || '',
          contractor_legal_responsible: detail.contractor_legal_responsible || '',
          contractor_legal_cpf: detail.contractor_legal_cpf || '',
          contractor_phone: detail.contractor_phone || '',
          contractor_email: detail.contractor_email || '',
          artist_artistic_name: detail.artist_artistic_name || '',
          artist_full_name: detail.artist_full_name || '',
          artist_cpf_cnpj: detail.artist_cpf_cnpj || '',
          artist_address: detail.artist_address || '',
          artist_phone: detail.artist_phone || '',
          artist_email: detail.artist_email || '',
          artist_responsible_name: detail.artist_responsible_name || '',
          artist_bank_name: detail.artist_bank_name || '',
          artist_bank_agency: detail.artist_bank_agency || '',
          artist_bank_account: detail.artist_bank_account || '',
          artist_bank_account_type: detail.artist_bank_account_type || '',
          event_name: detail.event_name || '',
          event_location_address: detail.event_location_address || '',
          event_presentation_date: detail.event_presentation_date || '',
          event_presentation_time: detail.event_presentation_time || '',
          event_duration: detail.event_duration || '',
          event_soundcheck_time: detail.event_soundcheck_time || '',
          event_structure_offered: detail.event_structure_offered || '',
          event_equipment_provided_by_contractor: detail.event_equipment_provided_by_contractor || '',
          event_equipment_brought_by_artist: detail.event_equipment_brought_by_artist || '',
          financial_total_value: detail.financial_total_value || 0,
          financial_payment_method: detail.financial_payment_method || '',
          financial_payment_conditions: detail.financial_payment_conditions || '',
          financial_discounts_or_fees: detail.financial_discounts_or_fees || '',
          general_penalties: detail.general_penalties || '',
          general_transport_responsibility: detail.general_transport_responsibility || '',
          general_image_rights: detail.general_image_rights || '',
          contractor_signature: detail.contractor_signature || '',
          artist_signature: detail.artist_signature || '',
          // Campos de Bar/Fornecedor
          provider_name: detail.provider_name || '',
          provider_cpf_cnpj: detail.provider_cpf_cnpj || '',
          provider_address: detail.provider_address || '',
          provider_responsible_name: detail.provider_responsible_name || '',
          provider_responsible_contact: detail.provider_responsible_contact || '',
          provider_bank_name: detail.provider_bank_name || '',
          provider_bank_agency: detail.provider_bank_agency || '',
          provider_bank_account: detail.provider_bank_account || '',
          provider_bank_account_type: detail.provider_bank_account_type || '',
          service_type: detail.service_type || '',
          service_professionals_count: detail.service_professionals_count || 0,
          service_materials_included: detail.service_materials_included || '',
          service_start_date: detail.service_start_date || '',
          service_start_time: detail.service_start_time || '',
          service_end_date: detail.service_end_date || '',
          service_end_time: detail.service_end_time || '',
          service_setup_location: detail.service_setup_location || '',
          service_technical_responsible: detail.service_technical_responsible || '',
          commercial_total_value: detail.commercial_total_value || 0,
          commercial_payment_method: detail.commercial_payment_method || '',
          commercial_payment_deadline: detail.commercial_payment_deadline || '',
          commercial_cancellation_policy: detail.commercial_cancellation_policy || '',
          commercial_additional_costs: detail.commercial_additional_costs || '',
          general_damage_responsibility: detail.general_damage_responsibility || '',
          general_conduct_rules: detail.general_conduct_rules || '',
          general_insurance: detail.general_insurance || '',
          provider_signature: detail.provider_signature || ''
        });
        setShowTypeSelection(false);
      } else {
        // Novo registro - mostrar seleção de tipo
        setOsType(null);
        setFormData({
          os_type: null,
          os_number: '',
          event_id: null,
          establishment_id: null,
          event_date: '',
          artistic_attraction: '',
          show_schedule: '',
          ticket_prices: '',
          promotions: '',
          visual_reference_url: '',
          admin_notes: '',
          operational_instructions: '',
          is_active: true
        });
        setShowTypeSelection(true);
      }
      setErrors({});
    }
  }, [isOpen, detail]);

  const handleSelectOSType = (type: 'artist' | 'bar_service') => {
    setOsType(type);
    setFormData(prev => ({ ...prev, os_type: type }));
    setShowTypeSelection(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.os_type) {
      newErrors.os_type = 'Tipo de OS é obrigatório';
    }

    if (!formData.event_date.trim()) {
      newErrors.event_date = 'Data do evento é obrigatória';
    }

    // Validações específicas para OS de Artista
    if (formData.os_type === 'artist') {
      if (!formData.contractor_name?.trim()) {
        newErrors.contractor_name = 'Nome do contratante é obrigatório';
      }
      if (!formData.artist_artistic_name?.trim()) {
        newErrors.artist_artistic_name = 'Nome artístico é obrigatório';
      }
      if (!formData.event_name?.trim()) {
        newErrors.event_name = 'Nome do evento é obrigatório';
      }
      if (!formData.event_location_address?.trim()) {
        newErrors.event_location_address = 'Local do evento é obrigatório';
      }
      if (!formData.event_presentation_date?.trim()) {
        newErrors.event_presentation_date = 'Data da apresentação é obrigatória';
      }
      if (!formData.event_presentation_time?.trim()) {
        newErrors.event_presentation_time = 'Horário da apresentação é obrigatório';
      }
      if (!formData.financial_total_value || formData.financial_total_value <= 0) {
        newErrors.financial_total_value = 'Valor do cachê é obrigatório';
      }
      if (!formData.financial_payment_method?.trim()) {
        newErrors.financial_payment_method = 'Forma de pagamento é obrigatória';
      }
    }

    // Validações específicas para OS de Bar/Fornecedor
    if (formData.os_type === 'bar_service') {
      if (!formData.contractor_name?.trim()) {
        newErrors.contractor_name = 'Nome do contratante é obrigatório';
      }
      if (!formData.provider_name?.trim()) {
        newErrors.provider_name = 'Nome do prestador de serviço é obrigatório';
      }
      if (!formData.service_type?.trim()) {
        newErrors.service_type = 'Tipo de serviço é obrigatório';
      }
      if (!formData.service_start_date?.trim()) {
        newErrors.service_start_date = 'Data de início é obrigatória';
      }
      if (!formData.service_start_time?.trim()) {
        newErrors.service_start_time = 'Hora de início é obrigatória';
      }
      if (!formData.service_end_date?.trim()) {
        newErrors.service_end_date = 'Data de término é obrigatória';
      }
      if (!formData.service_end_time?.trim()) {
        newErrors.service_end_time = 'Hora de término é obrigatória';
      }
      if (!formData.commercial_total_value || formData.commercial_total_value <= 0) {
        newErrors.commercial_total_value = 'Valor total do serviço é obrigatório';
      }
      if (!formData.commercial_payment_method?.trim()) {
        newErrors.commercial_payment_method = 'Forma de pagamento é obrigatória';
      }
    }

    // Validações gerais (apenas se não for OS específica)
    if (!formData.os_type) {
      if (!formData.artistic_attraction.trim()) {
        newErrors.artistic_attraction = 'Atrativo artístico é obrigatório';
      }
      if (!formData.ticket_prices.trim()) {
        newErrors.ticket_prices = 'Informações de preços são obrigatórias';
      }
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

      const url = detail
        ? `/api/operational-details/${detail.id}`
        : '/api/operational-details';

      const method = detail ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao ${detail ? 'atualizar' : 'criar'} detalhe operacional`);
      }

      onSave();
    } catch (error) {
      console.error(`❌ Erro ao ${detail ? 'atualizar' : 'criar'} detalhe operacional:`, error);
      alert(error instanceof Error ? error.message : `Erro ao ${detail ? 'atualizar' : 'criar'} detalhe operacional`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof OperationalDetailFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      const tempUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, visual_reference_url: tempUrl }));

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
          setFormData((prev) => ({ ...prev, visual_reference_url: result.filename }));
          setTimeout(() => {
            URL.revokeObjectURL(tempUrl);
          }, 1000);
          alert('Imagem carregada com sucesso!');
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } catch (error) {
        console.error('❌ Erro no upload:', error);
        alert(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        URL.revokeObjectURL(tempUrl);
        setFormData((prev) => ({ ...prev, visual_reference_url: '' }));
      }
    },
    [],
  );

  const selectImageFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        handleImageUpload(files[0]);
      }
    };
    input.click();
  }, [handleImageUpload]);

  if (!isOpen) return null;

  return (
    <>
      <OSTypeSelectionModal
        isOpen={showTypeSelection}
        onClose={() => {
          setShowTypeSelection(false);
          onClose();
        }}
        onSelectType={handleSelectOSType}
      />
      
      <AnimatePresence>
        {!showTypeSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {detail ? 'Editar Detalhe Operacional' : 'Novo Detalhe Operacional'}
                  {osType && (
                    <span className="ml-3 text-sm font-normal text-gray-500">
                      {osType === 'artist' ? '🎤 OS de Artista/Banda/DJ' : '🍸 OS de Bar/Fornecedor'}
                    </span>
                  )}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Número da OS e Data do Evento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número da OS
                    </label>
                    <input
                      type="text"
                      value={formData.os_number || ''}
                      onChange={(e) => handleInputChange('os_number', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Ex: OS-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do Evento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => handleInputChange('event_date', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.event_date
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-yellow-500'
                      }`}
                      required
                    />
                    {errors.event_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.event_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estabelecimento
                    </label>
                    <select
                      value={formData.establishment_id || ''}
                      onChange={(e) => handleInputChange('establishment_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Selecione um estabelecimento</option>
                      {establishments.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formulários específicos baseados no tipo de OS */}
                {osType === 'artist' && (
                  <ArtistOSForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {osType === 'bar_service' && (
                  <BarServiceOSForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    errors={errors}
                  />
                )}

                {/* Campos gerais (apenas se não for OS específica) */}
                {!osType && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Atrativos Artísticos <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.artistic_attraction}
                        onChange={(e) => handleInputChange('artistic_attraction', e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.artistic_attraction
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                        placeholder="Ex: Banda X, DJ Y, Show de comédia..."
                        required
                      />
                      {errors.artistic_attraction && (
                        <p className="mt-1 text-sm text-red-500">{errors.artistic_attraction}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horário dos Shows
                      </label>
                      <textarea
                        value={formData.show_schedule}
                        onChange={(e) => handleInputChange('show_schedule', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Ex: Banda 1: 20h-22h, DJ: 22h-01h"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valores e Preços <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.ticket_prices}
                        onChange={(e) => handleInputChange('ticket_prices', e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.ticket_prices
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                        placeholder="Ex: Mulher VIP até 21h, Homem R$ 80 de entrada"
                        required
                      />
                      {errors.ticket_prices && (
                        <p className="mt-1 text-sm text-red-500">{errors.ticket_prices}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promoções e Brindes
                      </label>
                      <textarea
                        value={formData.promotions}
                        onChange={(e) => handleInputChange('promotions', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Ex: Brinde especial para aniversariantes, Happy hour até 22h..."
                      />
                    </div>
                  </>
                )}

                {/* Imagem de Divulgação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem de Divulgação
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.visual_reference_url}
                      onChange={(e) => handleInputChange('visual_reference_url', e.target.value)}
                      placeholder="Nome do arquivo (ex: imagem.jpg) ou URL"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={selectImageFile}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700 transition-colors"
                    >
                      <MdUpload className="h-4 w-4" />
                      Upload
                    </button>
                  </div>
                  {formData.visual_reference_url && formData.visual_reference_url.trim() !== '' && (
                    <div className="mt-2">
                      <Image
                        src={getValidImageUrl(formData.visual_reference_url)}
                        alt="Preview da imagem de divulgação"
                        width={300}
                        height={200}
                        className="rounded-lg border object-cover"
                        unoptimized={formData.visual_reference_url.startsWith('blob:')}
                        priority={true}
                      />
                    </div>
                  )}
                </div>

                {/* Notas Administrativas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Administrativas (Marketing)
                  </label>
                  <textarea
                    value={formData.admin_notes}
                    onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Notas internas para a equipe de marketing..."
                  />
                </div>

                {/* Instruções Operacionais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-600 font-semibold">Instruções Operacionais (Ordem de Serviço)</span>
                  </label>
                  <textarea
                    value={formData.operational_instructions}
                    onChange={(e) => handleInputChange('operational_instructions', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                    placeholder="Ex: Montar 5 mesas extras na área VIP, Configurar iluminação especial, Preparar brindes para aniversariantes..."
                  />
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ Informações críticas para a equipe de operação na criação da OS
                  </p>
                </div>

                {/* Status Ativo */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Ativo (visível no front-end de reservas)
                  </label>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                    className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <MdSave size={20} />
                        {detail ? 'Atualizar' : 'Salvar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
