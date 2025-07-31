'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react' // Importe useCallback
import { Tabs } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { MdAdd, MdExpandMore, MdExpandLess } from 'react-icons/md'
import AddGuestModal from '../../../components/AddGuestModal/AddGuestModal'
import ImportarConvidados from '../../../components/convidados/ImportarConvidados'
import AdicionarConvidado from '../../../components/convidados/AdicionarConvidado'
import { WithPermission } from "../../../components/WithPermission/WithPermission";

type Convidado = {
  id: number
  nome: string
  documento?: string
  email?: string
  status?: string;
  data_checkin?: string
  reserva_id?: number
  evento_id?: number
  criador_da_reserva?: string
}

type GrupoDeConvidados = {
  [criador: string]: Convidado[];
};

export default function EventoConvidadosPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id?.toString() ?? ''
  const [eventoNome, setEventoNome] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [convidados, setConvidados] = useState<Convidado[]>([])
  const [gruposConvidados, setGruposConvidados] = useState<GrupoDeConvidados>({});
  const [openCreatorGroup, setOpenCreatorGroup] = useState<string | null>(null);

  // Mova a função fetchData para fora do useEffect
  // Use useCallback para memorizar a função e evitar recriações desnecessárias
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      // Buscar nome do evento
      const resEvento = await fetch(`https://vamos-comemorar-api.onrender.com/api/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })
      const eventoData = await resEvento.json()
      setEventoNome(eventoData.nome_do_evento || 'Evento')

      // Buscar convidados
      const resConvidados = await fetch(`https://vamos-comemorar-api.onrender.com/api/events/${id}/convidados-com-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const convidadosData = await resConvidados.json();
      setConvidados(Array.isArray(convidadosData) ? convidadosData : [])

      // Agrupar convidados por criador da reserva
      const grouped: GrupoDeConvidados = {};
      (Array.isArray(convidadosData) ? convidadosData : []).forEach((convidado: Convidado) => {
        const criador = convidado.criador_da_reserva || 'Não Atribuído';
        if (!grouped[criador]) {
          grouped[criador] = [];
        }
        grouped[criador].push(convidado);
      });
      setGruposConvidados(grouped);

    } catch (error) {
      console.error('Erro ao buscar dados do evento ou convidados:', error)
    }
  }, [id]); // id é uma dependência do fetchData

  // Chame fetchData dentro do useEffect
  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]); // Adicione fetchData como dependência para useEffect

  const handleGoToRules = () => {
    router.push(`/admin/eventos/${id}/roles`)
  }

  const toggleCreatorGroup = (criador: string) => {
    setOpenCreatorGroup(openCreatorGroup === criador ? null : criador);
  };

  return (
    <WithPermission allowedRoles={["admin", "gerente", "promoter"]}>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Eventos / <span className="text-gray-200">{eventoNome}</span>
          </h2>
          <h1 className="text-3xl font-bold text-white mt-2">Gerenciar Convidados</h1>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/20">
          <Tabs
            tabsStyle="border-b border-gray-200/30 px-6 pt-6"
            contentClassName="px-8 pb-8 pt-6"
            tabs={[
              {
                title: 'Adicionar',
                content: (
                  <>
                    <AdicionarConvidado eventId={id} />
                    <div className="flex justify-end mb-6">
                      <Button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-3 rounded-xl shadow-lg text-base font-semibold transition-all duration-200 transform hover:scale-105"
                      >
                        <MdAdd size={20} /> Adicionar convidados
                      </Button>
                    </div>
                    <AddGuestModal
                      isOpen={modalOpen}
                      onClose={() => setModalOpen(false)}
                      // Agora fetchData está acessível e pode ser chamado
                      onGuestAdded={() => { fetchData(); setModalOpen(false); }} // Feche o modal após adicionar
                      eventId={Number(id)}
                      userId={1}
                    />
                  </>
                )
              },
              {
                title: 'Importar',
                content: (
                  <ImportarConvidados eventId={id} />
                )
              },
              {
                title: 'Lista de Convidados',
                content: (
                  <div className="space-y-6">
                    {Object.keys(gruposConvidados).length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-2">📋</div>
                        <p className="text-gray-500 text-lg">Nenhum convidado encontrado ou agrupado.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(gruposConvidados).map(([criador, convidadosDoCriador]) => {
                          const totalConvidados = convidadosDoCriador.length;
                          const convidadosCheckin = convidadosDoCriador.filter(c => c.status === "CHECK-IN").length;
                          const convidadosPendentes = totalConvidados - convidadosCheckin;
                          const isOpen = openCreatorGroup === criador;

                          return (
                            <div key={criador} className="bg-gray-50/80 rounded-xl border border-gray-200/50 overflow-hidden">
                              <div
                                className="flex justify-between items-center cursor-pointer p-6 hover:bg-gray-100/80 transition-colors duration-200"
                                onClick={() => toggleCreatorGroup(criador)}
                              >
                                <h3 className="font-bold text-gray-800 text-lg flex-grow">
                                  Criador da Reserva: {criador}
                                </h3>
                                <div className="text-sm text-gray-600 flex items-center gap-6 mr-4">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                      Total: <strong className="font-bold text-gray-800">{totalConvidados}</strong>
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      Check-in: <strong className="font-bold text-green-700">{convidadosCheckin}</strong>
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                      Pendentes: <strong className="font-bold text-yellow-700">{convidadosPendentes}</strong>
                                    </span>
                                </div>
                                <div className="text-gray-500 hover:text-gray-700 transition-colors">
                                  {isOpen ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                                </div>
                              </div>

                              {isOpen && (
                                <div className="border-t border-gray-200/50 bg-white/90">
                                  <ul className="divide-y divide-gray-100">
                                    {convidadosDoCriador.map((convidado) => {
                                      const chegou = convidado.status === "CHECK-IN";
                                      const statusLabel = chegou ? "✔️ Está no evento" : "⏳ Não chegou ainda";
                                      const statusClass = chegou
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200";
                                      const dataCheckin = chegou && convidado.data_checkin
                                        ? new Date(convidado.data_checkin).toLocaleString("pt-BR")
                                        : "";
                                      return (
                                        <li key={convidado.id} className="py-4 px-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50/50 transition-colors">
                                          <div className="space-y-2">
                                            <p className="font-semibold text-gray-800 text-base">{convidado.nome}</p>
                                            <div className="space-y-1">
                                              {convidado.documento && (
                                                <p className="text-gray-500 text-sm">📄 Documento: {convidado.documento}</p>
                                              )}
                                              {convidado.email && (
                                                <p className="text-gray-500 text-sm">📧 Email: {convidado.email}</p>
                                              )}
                                              {dataCheckin && (
                                                <p className="text-gray-500 text-sm">🕒 Check-in: {dataCheckin}</p>
                                              )}
                                            </div>
                                          </div>
                                          <span className={`mt-3 md:mt-0 text-sm font-semibold px-4 py-2 rounded-full border ${statusClass}`}>
                                            {statusLabel}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/30 p-6 rounded-2xl shadow-lg">
            <h3 className="text-yellow-600 font-bold text-lg mb-3">Adicionar convidados</h3>
            <p className="text-gray-700 text-sm mb-3">Adicione os nomes dos seus convidados (digite um nome por linha).</p>
            <p className="text-gray-700 text-sm mb-3">Você também pode adicionar o número do documento de cada convidado, se quiser.</p>
            <p className="text-gray-700 text-sm mb-4">
              <strong className="font-semibold">Adicione sua equipe de promoters:</strong> Você pode adicionar promoters para ajudá-lo na divulgação do seu evento. Eles poderão adicionar convidados nas listas que tiverem acesso.
            </p>
            <Button
              onClick={handleGoToRules}
              className="text-yellow-600 text-sm font-semibold mt-2 inline-block cursor-pointer bg-transparent border-none p-0 hover:text-yellow-700 transition-colors"
            >
              Gerenciar Regras do Evento
            </Button>
          </div>
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/30 p-6 rounded-2xl shadow-lg">
            <h3 className="text-yellow-600 font-bold text-lg mb-3">Importar convidados</h3>
            <p className="text-gray-700 text-sm mb-3">Selecione o arquivo Excel com os dados dos seus convidados e importe no sistema.</p>
            <p className="text-gray-700 text-sm mb-4">Utilize a nossa planilha modelo, preencha com seus dados e envie para nós.</p>
            <a className="text-yellow-600 text-sm font-semibold mt-2 inline-flex items-center gap-2 cursor-pointer hover:text-yellow-700 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 14a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-4h-2V7H5v3H3v4z" />
              </svg>
              Baixar planilha modelo
            </a>
          </div>
        </div>
        <div className="mt-8">
          <Button 
            onClick={() => router.back()}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold"
          >
            &lt; Voltar
          </Button>
        </div>
      </div>
    </div>
    </WithPermission>
  )
}