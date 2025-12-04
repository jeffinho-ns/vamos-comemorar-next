"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import { OperationalDetail } from '@/app/types/operationalDetail';

interface ArtistOSViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: OperationalDetail | null;
}

export default function ArtistOSViewModal({
  isOpen,
  onClose,
  detail
}: ArtistOSViewModalProps) {
  if (!isOpen || !detail) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T12:00:00');
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Extrair campos dinâmicos de admin_notes (JSON)
  let dynamicFields: Array<[string, any]> = [];
  
  if (detail.admin_notes) {
    try {
      const notesData = JSON.parse(detail.admin_notes);
      if (notesData.dynamicFields) {
        dynamicFields = Object.entries(notesData.dynamicFields).filter(
          ([, value]) => value !== null && value !== undefined && value !== ''
        );
      }
    } catch {
      // Se não for JSON, ignorar
    }
  }

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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Visualizar OS de Artista/Banda/DJ
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(detail.event_date)} - {detail.event_name || 'Sem nome'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dia do Evento</p>
                  <p className="text-base text-gray-900">{formatDate(detail.event_date)}</p>
                </div>
                {detail.event_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome do Projeto</p>
                    <p className="text-base text-gray-900">{detail.event_name}</p>
                  </div>
                )}
                {detail.establishment_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estabelecimento</p>
                    <p className="text-base text-gray-900">{detail.establishment_name}</p>
                  </div>
                )}
                {detail.artist_artistic_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Artístico</p>
                    <p className="text-base text-gray-900">{detail.artist_artistic_name}</p>
                  </div>
                )}
                {detail.show_schedule && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Horários de Funcionamento</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{detail.show_schedule}</p>
                  </div>
                )}
                {detail.ticket_prices && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valores de entrada (ou venda antecipada)</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{detail.ticket_prices}</p>
                  </div>
                )}
                {detail.promotions && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Promoções</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{detail.promotions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Campos Dinâmicos */}
            {dynamicFields.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Evento</h3>
                <div className="space-y-4">
                  {dynamicFields.map(([key, value]) => {
                    // Converter chave para label legível
                    const label = key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());
                    
                    return (
                      <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                        <p className="text-base text-gray-900 whitespace-pre-wrap">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dynamicFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum campo adicional preenchido
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

