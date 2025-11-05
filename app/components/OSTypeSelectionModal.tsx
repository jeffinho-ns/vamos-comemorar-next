"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdMusicNote, MdLocalBar } from 'react-icons/md';

interface OSTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'artist' | 'bar_service') => void;
}

export default function OSTypeSelectionModal({
  isOpen,
  onClose,
  onSelectType
}: OSTypeSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Selecionar Tipo de Ordem de Serviço
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Options */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opção 1: Artista/Banda/DJ */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectType('artist')}
              className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-8 rounded-xl shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-4 min-h-[250px]"
            >
              <MdMusicNote size={64} className="text-white/90" />
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  🎤 Contratação de Artista / Banda / DJ
                </h3>
                <p className="text-white/90 text-sm">
                  Ordem de Serviço para contratação de artistas, bandas ou DJs
                </p>
              </div>
            </motion.button>

            {/* Opção 2: Bar/Fornecedor */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectType('bar_service')}
              className="bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white p-8 rounded-xl shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-4 min-h-[250px]"
            >
              <MdLocalBar size={64} className="text-white/90" />
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  🍸 Serviço de Bar / Fornecedor
                </h3>
                <p className="text-white/90 text-sm">
                  Ordem de Serviço para prestação de serviços de bar e fornecedores
                </p>
              </div>
            </motion.button>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

