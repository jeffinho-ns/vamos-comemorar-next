'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { MdAdd } from 'react-icons/md'
import AddGuestModal from '../../../components/AddGuestModal/AddGuestModal'
import ImportarConvidados from '../../../components/convidados/ImportarConvidados'
import AdicionarConvidado from '../../../components/convidados/AdicionarConvidado'

export default function EventoConvidadosPage() {
  const { id } = useParams()
  const [eventoNome, setEventoNome] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const res = await fetch(`https://vamos-comemorar-api.onrender.com/api/events/${id}`)
        const data = await res.json()
        setEventoNome(data.nome_do_evento || 'Evento')
      } catch (error) {
        console.error('Erro ao buscar evento:', error)
      }
    }

    if (id) fetchEvento()
  }, [id])

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-sm">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-[13px] font-medium text-[#9faab6] uppercase tracking-wide">
            Eventos / <span className="text-[#3f3f3f]">{eventoNome}</span>
          </h2>
          
          <h1 className="text-[20px] font-bold text-[#3f3f3f] mt-1">Adicionar Convidados</h1>
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
         < AdicionarConvidado />
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
            onGuestAdded={() => {}}
            eventId={Number(id)}
            userId={1}
          />
        </>
      )
    },
    {
      title: 'Importar',
      content: (
        <ImportarConvidados eventId={String(id)} />
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
            <p className="text-gray-700 text-[13px]"> <strong className="font-semibold">Adicione sua equipe de promoters:</strong> Você pode adicionar promoters para ajudá-lo na divulgação do seu evento. Eles poderão adicionar convidados nas listas que tiverem acesso.</p>
            <a className="text-[#00b0f0] text-sm font-medium mt-2 inline-block cursor-pointer">Adicionar promoters</a>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded shadow-sm">
            <h3 className="text-[#008fc2] font-semibold text-sm mb-2">Importar convidados</h3>
            <p className="text-gray-700 text-[13px] mb-2">Selecione o arquivo Excel com os dados dos seus convidados e importe no sistema.</p>
            <p className="text-gray-700 text-[13px] mb-2">Utilize a nossa planilha modelo, preencha com seus dados e envie para nós.</p>
            <a className="text-[#00b0f0] text-sm font-medium mt-2 inline-flex items-center gap-1 cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 14a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-4h-2V7H5v3H3v4z" /></svg>
              Baixar planilha modelo
            </a>
          </div>
        </div>

        <div className="mt-6">
          <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2 rounded shadow-sm">&lt; Voltar</Button>
        </div>
      </div>
    </div>
  )
}
