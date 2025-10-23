"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdPerson,
  MdPhone,
  MdEmail,
  MdStar,
  MdStarBorder,
  MdNote,
  MdSave,
  MdCancel,
  MdCardGiftcard
} from 'react-icons/md';

interface Beneficio {
  beneficio_id: number;
  nome: string;
  descricao: string;
  tipo: string;
}

interface AddGuestToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: any) => Promise<void>;
  listaId: number;
}

export default function AddGuestToListModal({
  isOpen,
  onClose,
  onSave,
  listaId
}: AddGuestToListModalProps) {
  const [formData, setFormData] = useState({
    nome_convidado: '',
    telefone_convidado: '',
    email_convidado: '',
    is_vip: false,
    observacoes: '',
    beneficios: [] as number[]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<Beneficio[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

  useEffect(() => {
    if (isOpen) {
      fetchBeneficios();
      // Reset form
      setFormData({
        nome_convidado: '',
        telefone_convidado: '',
        email_convidado: '',
        is_vip: false,
        observacoes: '',
        beneficios: []
      });
      setErrors({});
    }
  }, [isOpen]);

  const fetchBeneficios = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/v1/eventos/beneficios?ativo=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBeneficiosDisponiveis(data.beneficios);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar benefícios:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_convidado.trim()) {
      newErrors.nome_convidado = 'Nome do convidado é obrigatório';
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
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar convidado:', error);
      alert('Erro ao adicionar convidado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleBeneficio = (beneficioId: number) => {
    setFormData(prev => {
      const beneficios = prev.beneficios.includes(beneficioId)
        ? prev.beneficios.filter(id => id !== beneficioId)
        : [...prev.beneficios, beneficioId];
      return { ...prev, beneficios };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
              <h2 className="text-2xl font-bold text-green-700">Adicionar Convidado</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Informações do Convidado
                </h3>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MdPerson className="inline mr-2" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_convidado}
                    onChange={(e) => handleInputChange('nome_convidado', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.nome_convidado ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nome completo do convidado"
                  />
                  {errors.nome_convidado && (
                    <p className="text-red-500 text-sm mt-1">{errors.nome_convidado}</p>
                  )}
                </div>

                {/* Telefone e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MdPhone className="inline mr-2" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone_convidado}
                      onChange={(e) => handleInputChange('telefone_convidado', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MdEmail className="inline mr-2" />
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.email_convidado}
                      onChange={(e) => handleInputChange('email_convidado', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* VIP Toggle */}
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_vip', !formData.is_vip)}
                    className="focus:outline-none"
                  >
                    {formData.is_vip ? (
                      <MdStar size={32} className="text-yellow-500" />
                    ) : (
                      <MdStarBorder size={32} className="text-gray-400" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium text-gray-700">Convidado VIP</p>
                    <p className="text-sm text-gray-600">
                      Marque se este é um convidado VIP
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              {beneficiosDisponiveis.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    <MdCardGiftcard className="inline mr-2" />
                    Benefícios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {beneficiosDisponiveis.map((beneficio) => (
                      <div
                        key={beneficio.beneficio_id}
                        onClick={() => toggleBeneficio(beneficio.beneficio_id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.beneficios.includes(beneficio.beneficio_id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={formData.beneficios.includes(beneficio.beneficio_id)}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{beneficio.nome}</p>
                            <p className="text-xs text-gray-600">{beneficio.descricao}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MdNote className="inline mr-2" />
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MdCancel size={20} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MdSave size={20} />
                  {loading ? 'Salvando...' : 'Adicionar Convidado'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}





