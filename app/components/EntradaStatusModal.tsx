"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdCheckCircle, MdAttachMoney, MdLocalBar } from 'react-icons/md';

export type EntradaTipo = 'VIP' | 'SECO' | 'CONSUMA';

interface EntradaStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tipo: EntradaTipo, valor: number) => void;
  nomeConvidado: string;
  horaAtual: Date;
}

const EntradaStatusModal: React.FC<EntradaStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nomeConvidado,
  horaAtual
}) => {
  const [selectedTipo, setSelectedTipo] = React.useState<EntradaTipo | null>(null);

  // Calcular opções baseadas no horário
  const opcoes = React.useMemo(() => {
    const hora = horaAtual.getHours();
    const minutos = horaAtual.getMinutes();
    
    // Até 22:00h (inclusive) - VIP automático (sem opção de escolha)
    // IMPORTANTE: Apenas durante o dia (não inclui madrugada 00:00-06:00)
    // VIP válido: 06:00 até 22:00 (inclusive)
    if ((hora >= 6 && hora < 22) || (hora === 22 && minutos === 0)) {
      return {
        modoAutomatico: true,
        tipoAutomatico: 'VIP' as EntradaTipo,
        mostraVIP: false, // Não mostrar opção, será automático
        mostraSeco: false,
        mostraConsuma: false,
        valorSeco: 0,
        valorConsuma: 0
      };
    }
    
    // Após 22:00h até 00:30h - Apenas SECO ou CONSOME (valores menores)
    // Entre 22:00h (exclusivo) e 00:30h (inclusive)
    if ((hora === 22 && minutos > 0) || (hora > 22 && hora < 24) || (hora === 0 && minutos <= 30)) {
      return {
        modoAutomatico: false,
        tipoAutomatico: null,
        mostraVIP: false, // VIP inativo após 22:00h
        mostraSeco: true,
        mostraConsuma: true,
        valorSeco: 40,
        valorConsuma: 120
      };
    }
    
    // Após 00:30h até 06:00h - Apenas SECO ou CONSOME com valores maiores
    // Isso cobre: (hora === 0 && minutos > 30) || (hora > 0 && hora < 6)
    return {
      modoAutomatico: false,
      tipoAutomatico: null,
      mostraVIP: false, // VIP inativo após 00:30h
      mostraSeco: true,
      mostraConsuma: true,
      valorSeco: 50,
      valorConsuma: 150
    };
  }, [horaAtual]);

  // Inicializar o tipo selecionado quando o modal abrir
  React.useEffect(() => {
    if (isOpen) {
      if (opcoes.modoAutomatico && opcoes.tipoAutomatico) {
        // Modo automático: já definir como VIP
        setSelectedTipo(opcoes.tipoAutomatico);
      } else {
        // Modo manual: deixar sem seleção para o usuário escolher
        setSelectedTipo(null);
      }
    } else {
      // Resetar quando o modal fechar
      setSelectedTipo(null);
    }
  }, [isOpen, opcoes]);

  const handleConfirm = () => {
    if (opcoes.modoAutomatico && opcoes.tipoAutomatico) {
      // Modo automático: confirmar VIP diretamente
      onConfirm(opcoes.tipoAutomatico, 0);
    } else if (selectedTipo) {
      // Modo manual: usar o tipo selecionado
      let valor = 0;
      if (selectedTipo === 'SECO') {
        valor = opcoes.valorSeco;
      } else if (selectedTipo === 'CONSUMA') {
        valor = opcoes.valorConsuma;
      }
      onConfirm(selectedTipo, valor);
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
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Status de Entrada</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-semibold">Convidado:</span> {nomeConvidado}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Horário: {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Modo Automático VIP (até 22:00h) */}
            {opcoes.modoAutomatico && opcoes.tipoAutomatico === 'VIP' && (
              <div className="mb-6">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <MdCheckCircle size={32} className="text-green-500" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">VIP</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Entrada automática VIP (até 22:00h)
                      </div>
                      <div className="text-green-600 font-bold text-lg mt-2">R$ 0,00</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modo Manual (após 22:00h) */}
            {!opcoes.modoAutomatico && (
              <div className="space-y-3 mb-6">
                {/* Opção SECO */}
                {opcoes.mostraSeco && (
                  <button
                    onClick={() => setSelectedTipo('SECO')}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedTipo === 'SECO'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MdAttachMoney 
                          size={24} 
                          className={selectedTipo === 'SECO' ? 'text-blue-500' : 'text-gray-400'} 
                        />
                        <div>
                          <div className="font-semibold text-gray-900">SECO</div>
                          <div className="text-sm text-gray-600">Sem consumação mínima</div>
                        </div>
                      </div>
                      {selectedTipo === 'SECO' && (
                        <span className="text-blue-600 font-bold">R$ {opcoes.valorSeco.toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                )}

                {/* Opção CONSUMA */}
                {opcoes.mostraConsuma && (
                  <button
                    onClick={() => setSelectedTipo('CONSUMA')}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedTipo === 'CONSUMA'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MdLocalBar 
                          size={24} 
                          className={selectedTipo === 'CONSUMA' ? 'text-purple-500' : 'text-gray-400'} 
                        />
                        <div>
                          <div className="font-semibold text-gray-900">CONSUMA</div>
                          <div className="text-sm text-gray-600">Com consumação mínima</div>
                        </div>
                      </div>
                      {selectedTipo === 'CONSUMA' && (
                        <span className="text-purple-600 font-bold">R$ {opcoes.valorConsuma.toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!opcoes.modoAutomatico && !selectedTipo}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                  (opcoes.modoAutomatico || selectedTipo)
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {opcoes.modoAutomatico ? 'Confirmar Check-in VIP' : 'Confirmar Check-in'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EntradaStatusModal;

