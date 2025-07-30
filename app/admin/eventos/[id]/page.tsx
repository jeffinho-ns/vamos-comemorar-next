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
    <div className="min-h-screen bg-[#f7f9fc] text-sm">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-[13px] font-medium text-[#9faab6] uppercase tracking-wide">
            Eventos / <span className="text-[#3f3f3f]">{eventoNome}</span>
          </h2>
          <h1 className="text-[20px] font-bold text-[#3f3f3f] mt-1">Gerenciar Convidados</h1>
        </div>
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <Tabs
            tabsStyle="border-b border-gray-200 px-4 pt-4"
            contentClassName="px-6 pb-6 pt-4"
            tabs={[
              {
                title: 'Adicionar',
                content: (
                  <>
                    <AdicionarConvidado eventId={id} />
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-[#3f7fcf] hover:bg-[#306ac0] text-white px-4 py-2 rounded shadow text-sm"
                      >
                        <MdAdd size={18} /> Adicionar convidados
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
                  <div className="space-y-4">
                    {Object.keys(gruposConvidados).length === 0 ? (
                      <p className="text-gray-600">Nenhum convidado encontrado ou agrupado.</p>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {Object.entries(gruposConvidados).map(([criador, convidadosDoCriador]) => {
                          const totalConvidados = convidadosDoCriador.length;
                          const convidadosCheckin = convidadosDoCriador.filter(c => c.status === "CHECK-IN").length;
                          const convidadosPendentes = totalConvidados - convidadosCheckin;
                          const isOpen = openCreatorGroup === criador;

                          return (
                            <div key={criador} className="py-4">
                              <div
                                className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-md shadow-sm"
                                onClick={() => toggleCreatorGroup(criador)}
                              >
                                <h3 className="font-semibold text-gray-800 text-base flex-grow">
                                  Criador da Reserva: {criador}
                                </h3>
                                <div className="text-xs text-gray-600 flex items-center gap-4 mr-4">
                                    <span>Total: <strong className="font-bold">{totalConvidados}</strong></span>
                                    <span>Check-in: <strong className="font-bold text-green-700">{convidadosCheckin}</strong></span>
                                    <span>Pendentes: <strong className="font-bold text-yellow-700">{convidadosPendentes}</strong></span>
                                </div>
                                {isOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                              </div>

                              {isOpen && (
                                <ul className="mt-4 border border-gray-100 rounded-md divide-y divide-gray-100 bg-white">
                                  {convidadosDoCriador.map((convidado) => {
                                    const chegou = convidado.status === "CHECK-IN";
                                    const statusLabel = chegou ? "✔️ Está no evento" : "Não chegou ainda";
                                    const statusClass = chegou
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800";
                                    const dataCheckin = chegou && convidado.data_checkin
                                      ? new Date(convidado.data_checkin).toLocaleString("pt-BR")
                                      : "";
                                    return (
                                      <li key={convidado.id} className="py-3 px-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                                        <div className="space-y-1">
                                          <p className="font-medium text-gray-800">{convidado.nome}</p>
                                          {convidado.documento && (
                                            <p className="text-gray-500 text-xs">Documento: {convidado.documento}</p>
                                          )}
                                          {convidado.email && (
                                            <p className="text-gray-500 text-xs">Email: {convidado.email}</p>
                                          )}
                                          {dataCheckin && (
                                            <p className="text-gray-500 text-xs">Check-in: {dataCheckin}</p>
                                          )}
                                        </div>
                                        <span className={`mt-2 md:mt-0 text-xs font-semibold px-3 py-1 rounded-full ${statusClass}`}>
                                          {statusLabel}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
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
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white border border-gray-200 p-4 rounded shadow-sm">
            <h3 className="text-[#008fc2] font-semibold text-sm mb-2">Adicionar convidados</h3>
            <p className="text-gray-700 text-[13px] mb-2">Adicione os nomes dos seus convidados (digite um nome por linha).</p>
            <p className="text-gray-700 text-[13px] mb-2">Você também pode adicionar o número do documento de cada convidado, se quiser.</p>
            <p className="text-gray-700 text-[13px]">
              <strong className="font-semibold">Adicione sua equipe de promoters:</strong> Você pode adicionar promoters para ajudá-lo na divulgação do seu evento. Eles poderão adicionar convidados nas listas que tiverem acesso.
            </p>
            <Button
              onClick={handleGoToRules}
              className="text-[#00b0f0] text-sm font-medium mt-2 inline-block cursor-pointer bg-transparent border-none p-0 hover:underline"
            >
              Gerenciar Regras do Evento
            </Button>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded shadow-sm">
            <h3 className="text-[#008fc2] font-semibold text-sm mb-2">Importar convidados</h3>
            <p className="text-gray-700 text-[13px] mb-2">Selecione o arquivo Excel com os dados dos seus convidados e importe no sistema.</p>
            <p className="text-gray-700 text-[13px] mb-2">Utilize a nossa planilha modelo, preencha com seus dados e envie para nós.</p>
            <a className="text-[#00b0f0] text-sm font-medium mt-2 inline-flex items-center gap-1 cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 14a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-4h-2V7H5v3H3v4z" />
              </svg>
              Baixar planilha modelo
            </a>
          </div>
        </div>
        <div className="mt-6">
          <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded shadow-sm">
            &lt; Voltar
          </Button>
        </div>
      </div>
    </div>
    </WithPermission>
  )
}