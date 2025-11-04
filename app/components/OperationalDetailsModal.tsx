"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdSave } from 'react-icons/md';
import { OperationalDetail, OperationalDetailFormData } from '@/app/types/operationalDetail';
import { Establishment } from '@/app/hooks/useEstablishments';

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
  const [formData, setFormData] = useState<OperationalDetailFormData>({
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
        setFormData({
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
          is_active: detail.is_active
        });
      } else {
        // Resetar formulário para novo registro
        setFormData({
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
      }
      setErrors({});
    }
  }, [isOpen, detail]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.event_date.trim()) {
      newErrors.event_date = 'Data do evento é obrigatória';
    }

    if (!formData.artistic_attraction.trim()) {
      newErrors.artistic_attraction = 'Atrativo artístico é obrigatório';
    }

    if (!formData.ticket_prices.trim()) {
      newErrors.ticket_prices = 'Informações de preços são obrigatórias';
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
              {detail ? 'Editar Detalhe Operacional' : 'Novo Detalhe Operacional'}
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
            {/* Data do Evento e Estabelecimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Atrativos Artísticos */}
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

            {/* Horário dos Shows */}
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

            {/* Valores e Preços */}
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

            {/* Promoções */}
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

            {/* URL da Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem de Divulgação
              </label>
              <input
                type="url"
                value={formData.visual_reference_url}
                onChange={(e) => handleInputChange('visual_reference_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="https://exemplo.com/imagem.jpg"
              />
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
    </AnimatePresence>
  );
}

