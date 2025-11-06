"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdPeople,
  MdLink,
  MdContentCopy,
  MdCheckCircle
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://vamos-comemorar-api.onrender.com';

interface AddGuestListToReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: number;
  clientName: string;
  onSuccess?: () => void;
}

export default function AddGuestListToReservationModal({
  isOpen,
  onClose,
  reservationId,
  clientName,
  onSuccess
}: AddGuestListToReservationModalProps) {
  const [eventType, setEventType] = useState<'aniversario' | 'despedida' | ''>('');
  const [loading, setLoading] = useState(false);
  const [guestListLink, setGuestListLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateGuestList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/restaurant-reservations/${reservationId}/add-guest-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGuestListLink(data.guest_list_link);
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        alert('Erro ao criar lista de convidados: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao criar lista de convidados:', error);
      alert('Erro ao criar lista de convidados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (guestListLink) {
      navigator.clipboard.writeText(guestListLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEventType('');
    setGuestListLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Adicionar Lista de Convidados
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Reserva de {clientName}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {!guestListLink ? (
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdPeople className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        O que é uma Lista de Convidados?
                      </h4>
                      <p className="text-sm text-blue-800">
                        Uma lista de convidados permite que o cliente compartilhe um link
                        para que seus amigos se cadastrem. Ideal para eventos e grupos grandes.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evento (Opcional)
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as 'aniversario' | 'despedida' | '')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione (opcional)</option>
                    <option value="aniversario">Aniversário</option>
                    <option value="despedida">Despedida</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateGuestList}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MdPeople size={20} />
                    {loading ? 'Criando...' : 'Criar Lista'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Lista de Convidados Criada!
                      </h4>
                      <p className="text-sm text-green-800">
                        Compartilhe o link abaixo com o cliente para que ele possa
                        divulgar para seus convidados.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link para Compartilhar
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestListLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <MdCheckCircle size={20} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <MdContentCopy size={20} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}











