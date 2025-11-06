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
    const horaDecimal = hora + minutos / 60;
    
    // SEMPRE mostrar todas as opções, mas com valores diferentes baseados no horário
    // Admin pode escolher qualquer opção a qualquer momento
    
    // Até 22:00 - VIP é grátis, mas admin pode escolher outras opções
    if (horaDecimal < 22) {
      return {
        mostraVIP: true,
        mostraSeco: true, // Admin pode escolher
        mostraConsuma: true, // Admin pode escolher
        valorSeco: 40, // Valor padrão antes das 22h
        valorConsuma: 120 // Valor padrão antes das 22h
      };
    }
    
    // Entre 22:00 e 00:30
    // Se for antes da meia-noite (22:00 até 23:59) ou depois da meia-noite até 00:30
    const horaMeiaNoite = (horaDecimal >= 22 && horaDecimal < 24) || (hora === 0 && minutos <= 30);
    if (horaMeiaNoite) {
      return {
        mostraVIP: true, // Admin pode forçar VIP
        mostraSeco: true,
        mostraConsuma: true,
        valorSeco: 40,
        valorConsuma: 120
      };
    }
    
    // Após 00:30 até 03:00
    if ((horaDecimal >= 0.5 && horaDecimal < 3) || (hora >= 0 && hora < 3 && minutos > 30)) {
      return {
        mostraVIP: true, // Admin pode forçar VIP até 03:00
        mostraSeco: true,
        mostraConsuma: true,
        valorSeco: 50,
        valorConsuma: 150
      };
    }
    
    // Após 03:00 - Ainda mostrar todas as opções, mas admin pode escolher
    return {
      mostraVIP: true,
      mostraSeco: true,
      mostraConsuma: true,
      valorSeco: 50,
      valorConsuma: 150
    };
  }, [horaAtual]);

  // Inicializar o tipo selecionado quando o modal abrir ou o horário mudar
  React.useEffect(() => {
    if (isOpen) {
      // Se for antes das 22h, selecionar VIP automaticamente
      if (!opcoes.mostraSeco && !opcoes.mostraConsuma) {
        setSelectedTipo('VIP');
      } else {
        // Se houver opções pagas, deixar sem seleção inicial para o admin escolher
        setSelectedTipo(null);
      }
    } else {
      // Resetar quando o modal fechar
      setSelectedTipo(null);
    }
  }, [isOpen, opcoes]);

  const handleConfirm = () => {
    if (!selectedTipo) return;
    
    let valor = 0;
    if (selectedTipo === 'SECO') {
      valor = opcoes.valorSeco;
    } else if (selectedTipo === 'CONSUMA') {
      valor = opcoes.valorConsuma;
    }
    
    onConfirm(selectedTipo, valor);
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

            <div className="space-y-3 mb-6">
              {/* Opção VIP */}
              {opcoes.mostraVIP && (
                <button
                  onClick={() => setSelectedTipo('VIP')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTipo === 'VIP'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MdCheckCircle 
                        size={24} 
                        className={selectedTipo === 'VIP' ? 'text-green-500' : 'text-gray-400'} 
                      />
                      <div>
                        <div className="font-semibold text-gray-900">VIP</div>
                        <div className="text-sm text-gray-600">Entrada gratuita</div>
                      </div>
                    </div>
                    {selectedTipo === 'VIP' && (
                      <span className="text-green-600 font-bold">R$ 0,00</span>
                    )}
                  </div>
                </button>
              )}

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

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedTipo}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                  selectedTipo
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirmar Check-in
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EntradaStatusModal;

