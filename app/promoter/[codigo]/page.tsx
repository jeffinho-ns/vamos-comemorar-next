"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdPerson,
  MdWhatsapp,
  MdLocationOn,
  MdCheckCircle,
  MdError,
  MdShare,
  MdContentCopy,
  MdNightlife,
  MdPeople,
  MdStar,
  MdCamera,
  MdEvent,
  MdClose
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';

interface Promoter {
  id: number;
  nome: string;
  apelido?: string;
  foto_url?: string;
  instagram?: string;
  observacoes?: string;
  establishment_name?: string;
  stats: {
    total_convidados: number;
    total_confirmados: number;
  };
}

interface Evento {
  relacionamento_id: number;
  evento_id: number;
  data_evento: string;
  status: string;
  funcao: string;
  nome_do_evento: string;
  tipo_evento: string;
  dia_da_semana?: number;
  hora_do_evento: string;
  local_do_evento?: string;
  categoria?: string;
  descricao?: string;
  establishment_name?: string;
  establishment_id?: number;
}

interface Convidado {
  id: number;
  nome: string;
  status: string;
  evento_nome?: string;
  evento_data?: string;
}

export default function PromoterPublicPage() {
  const params = useParams<{ codigo: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    evento_id: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.codigo) {
      loadPromoterData();
      loadEventos();
      loadConvidados();
    }
  }, [params?.codigo]);

  const loadPromoterData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/promoter/${params.codigo}`);
      
      if (!response.ok) {
        throw new Error('Promoter não encontrado');
      }
      
      const data = await response.json();
      setPromoter(data.promoter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadEventos = async () => {
    try {
      // Buscar promoter_id primeiro
      const promoterResponse = await fetch(`${API_URL}/api/promoter/${params.codigo}`);
      if (!promoterResponse.ok) return;
      
      const promoterData = await promoterResponse.json();
      const promoterId = promoterData.promoter.id;
      
      // Buscar eventos do promoter usando a nova API
      const eventosResponse = await fetch(`${API_URL}/api/promoter-eventos/promoter/${promoterId}?status=ativo`);
      
      if (eventosResponse.ok) {
        const data = await eventosResponse.json();
        setEventos(data.eventos || []);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    }
  };

  const loadConvidados = async () => {
    try {
      const response = await fetch(`${API_URL}/api/promoter/${params.codigo}/convidados`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar convidados: ocultar os de eventos que já passaram
        const convidadosFiltrados = (data.convidados || []).filter((convidado: Convidado) => {
          // Se não tem evento_data, mostrar normalmente
          if (!convidado.evento_data) {
            return true;
          }
          
          try {
            // Verificar se o evento já passou
            const eventDate = convidado.evento_data.includes('T') || convidado.evento_data.includes(' ')
              ? convidado.evento_data
              : convidado.evento_data + 'T23:59:59';
            
            const eventDateObj = new Date(eventDate);
            const now = new Date();
            
            // Se o evento já passou (antes de hoje), ocultar o convidado
            // Comparar apenas a data, ignorando horas
            const eventDateOnly = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
            const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Se evento passou, não mostrar (false = filtrar)
            return eventDateOnly >= nowDateOnly;
          } catch (error) {
            console.error('Erro ao verificar data do evento:', error);
            // Em caso de erro, mostrar o convidado
            return true;
          }
        });
        
        setConvidados(convidadosFiltrados);
      }
    } catch (err) {
      console.error('Erro ao carregar convidados:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.whatsapp.trim()) {
      setSubmitError('Nome e WhatsApp são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${API_URL}/api/promoter/${params.codigo}/convidado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          whatsapp: formData.whatsapp,
          evento_id: formData.evento_id || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setFormData({ nome: '', whatsapp: '', evento_id: '' });
        loadConvidados();
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        setSubmitError(data.error || 'Erro ao adicionar à lista');
      }
    } catch (err) {
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copiado!');
  };

  const shareWhatsApp = () => {
    const message = `Ei! Entre na minha lista VIP de convidados! 🎉\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 text-white text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !promoter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <MdError className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Promoter não encontrado'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      {/* Header com foto do promoter */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Foto do Promoter */}
            {promoter.foto_url ? (
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                src={promoter.foto_url}
                alt={promoter.nome}
                className="w-32 h-32 rounded-full border-4 border-white shadow-2xl mx-auto mb-6 object-cover"
              />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-32 h-32 rounded-full border-4 border-white shadow-2xl mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center"
              >
                <MdPerson className="text-white text-6xl" />
              </motion.div>
            )}

            {/* Nome do Promoter */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {promoter.apelido || promoter.nome}
            </h1>
            
            {promoter.apelido && (
              <p className="text-xl text-purple-200 mb-4">{promoter.nome}</p>
            )}

            {/* Instagram */}
            {promoter.instagram && (
              <a
                href={`https://instagram.com/${promoter.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-6"
              >
                <MdCamera size={20} />
                @{promoter.instagram}
              </a>
            )}

            {/* Estabelecimento */}
            {promoter.establishment_name && (
              <div className="flex items-center justify-center gap-2 text-purple-100 mt-4">
                <MdNightlife size={24} />
                <span className="text-lg font-semibold">{promoter.establishment_name}</span>
              </div>
            )}

            {/* Estatísticas */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{promoter.stats.total_convidados}</div>
                <div className="text-sm text-purple-200">Convidados</div>
              </div>
              <div className="h-12 w-px bg-purple-400"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{promoter.stats.total_confirmados}</div>
                <div className="text-sm text-purple-200">Confirmados</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl">
                  <MdStar className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Entre na Lista VIP
                  </h2>
                  <p className="text-gray-600">Garanta sua entrada nos melhores eventos</p>
                </div>
              </div>

              {/* Mensagem de Observações */}
              {promoter.observacoes && (
                <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                  <p className="text-gray-700">{promoter.observacoes}</p>
                </div>
              )}

              {/* Mensagem de Sucesso */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
                  >
                    <MdCheckCircle className="text-green-600 text-2xl flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-semibold">Sucesso! 🎉</p>
                      <p className="text-green-700 text-sm">Você foi adicionado à lista VIP!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mensagem de Erro */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                >
                  <MdError className="text-red-600 text-2xl flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-semibold">Erro</p>
                    <p className="text-red-700 text-sm">{submitError}</p>
                  </div>
                </motion.div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MdPerson className="text-gray-400 text-xl" />
                    </div>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MdWhatsapp className="text-green-500 text-xl" />
                    </div>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Usaremos apenas para confirmações importantes
                  </p>
                </div>

                {/* Evento (se houver) */}
                {eventos.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Evento (Opcional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MdEvent className="text-gray-400 text-xl" />
                      </div>
                      <select
                        value={formData.evento_id}
                        onChange={(e) => setFormData({ ...formData, evento_id: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none text-gray-900"
                      >
                        <option value="">Selecione um evento</option>
                        {eventos.map((evento) => (
                          <option key={evento.evento_id} value={evento.evento_id}>
                            {evento.nome_do_evento} - {new Date(evento.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')} às {evento.hora_do_evento}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Escolha o evento específico para o qual deseja se inscrever
                    </p>
                  </div>
                )}

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <MdCheckCircle size={24} />
                      Entrar na Lista VIP
                    </>
                  )}
                </button>
              </form>

              {/* Botões de Compartilhamento */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center text-gray-600 font-semibold mb-4">
                  Compartilhe esta lista
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MdContentCopy size={20} />
                    Copiar Link
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MdWhatsapp size={20} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Eventos e Convidados */}
          <div className="lg:col-span-1 space-y-6">
            {/* Eventos Disponíveis */}
            {eventos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <MdEvent className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Eventos Disponíveis
                  </h3>
                </div>

                <div className="space-y-3">
                  {eventos.slice(0, 5).map((evento, index) => (
                    <motion.div
                      key={evento.evento_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                    >
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        {evento.nome_do_evento}
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>📅 {(() => {
                          try {
                            // Adiciona T12:00:00 para evitar problemas de timezone
                            const dateWithTime = evento.data_evento.includes('T') || evento.data_evento.includes(' ')
                              ? evento.data_evento
                              : evento.data_evento + 'T12:00:00';
                            return new Date(dateWithTime).toLocaleDateString('pt-BR');
                          } catch (error) {
                            console.error('Erro ao formatar data:', evento.data_evento, error);
                            return 'Data inválida';
                          }
                        })()}</p>
                        <p>🕐 {evento.hora_do_evento}</p>
                        {evento.establishment_name && (
                          <p>📍 {evento.establishment_name}</p>
                        )}
                        {evento.tipo_evento === 'semanal' && (
                          <p className="text-blue-600 font-medium">🔄 Evento Semanal</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {eventos.length > 5 && (
                    <p className="text-center text-xs text-gray-500 pt-2">
                      +{eventos.length - 5} eventos
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Lista de Convidados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                  <MdPeople className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Convidados
                </h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {convidados.length > 0 ? (
                  convidados.slice(0, 20).map((convidado, index) => (
                    <motion.div
                      key={convidado.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-2 rounded-full flex-shrink-0">
                        <MdPerson className="text-white text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {convidado.nome}
                        </p>
                        {convidado.evento_nome && (
                          <p className="text-xs text-gray-500 truncate">
                            {convidado.evento_nome}
                          </p>
                        )}
                      </div>
                      <MdCheckCircle className="text-green-500 flex-shrink-0" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MdPeople className="text-gray-300 text-5xl mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Seja o primeiro a entrar na lista!
                    </p>
                  </div>
                )}

                {convidados.length > 20 && (
                  <p className="text-center text-xs text-gray-500 pt-3">
                    +{convidados.length - 20} convidados
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-purple-200 text-sm">
          <p>Powered by Agilizaiapp</p>
        </div>
      </div>
    </div>
  );
}

