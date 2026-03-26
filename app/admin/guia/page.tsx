'use client'

import { ReactNode, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  MdAutoStories,
  MdBusiness,
  MdChecklist,
  MdEvent,
  MdGroups,
  MdOutlineWorkHistory,
} from 'react-icons/md'
import { Tabs } from '@/app/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useUserPermissions } from '@/app/hooks/useUserPermissions'
import {
  CARGO_BY_EMAIL,
  CARGO_BY_ROLE,
  DocCargo,
  docsConfig,
} from '@/app/data/docsConfig'

function normalizeRole(role: string): string {
  return (role || '').toLowerCase().trim()
}

function resolveCargo(role: string, email: string): DocCargo | null {
  const byEmail = CARGO_BY_EMAIL[(email || '').toLowerCase().trim()]
  if (byEmail) return byEmail
  return CARGO_BY_ROLE[normalizeRole(role)] || null
}

export default function GuiaIntranetPage() {
  const router = useRouter()
  const { isLoading, canAccessAdmin, role, userEmail, myEstablishmentPermissions } =
    useUserPermissions()

  const activePermissions = useMemo(
    () => myEstablishmentPermissions.filter((p) => p.is_active),
    [myEstablishmentPermissions],
  )

  const establishmentContext = useMemo(() => {
    const first = activePermissions[0]
    if (!first) {
      return { establishmentId: null as number | null, establishmentName: 'Não identificado' }
    }
    return {
      establishmentId: Number(first.establishment_id),
      establishmentName: first.establishment_name || `Estabelecimento ${first.establishment_id}`,
    }
  }, [activePermissions])

  const cargo = resolveCargo(role, userEmail || '')
  const fallbackCargoBlock = (
    <Card>
      <CardHeader>
        <CardTitle>Documentação indisponível para este perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Seu cargo não possui trilha de documentação cadastrada. Solicite ao administrador a
          vinculação do seu perfil.
        </p>
      </CardContent>
    </Card>
  )

  if (!isLoading && !canAccessAdmin) {
    router.replace('/acesso-negado')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Carregando guia interno...
      </div>
    )
  }

  if (!cargo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Guia Interno (Intranet)</h1>
        {fallbackCargoBlock}
      </div>
    )
  }

  const baseDocs = docsConfig.byCargo[cargo]
  const establishmentOverride =
    establishmentContext.establishmentId !== null
      ? docsConfig.byEstablishmentId?.[establishmentContext.establishmentId]?.[cargo]
      : undefined

  const docs = {
    ...baseDocs,
    ...establishmentOverride,
    niveis: {
      ...baseDocs.niveis,
      ...(establishmentOverride?.niveis || {}),
    },
    rotinas: {
      ...baseDocs.rotinas,
      ...(establishmentOverride?.rotinas || {}),
    },
  }

  const nivelTabs = [
    {
      title: 'Básico',
      content: (
        <DocCard
          title={docs.niveis.basico.titulo}
          description={docs.niveis.basico.descricao}
          checklist={docs.niveis.basico.checklist}
        />
      ),
    },
    {
      title: 'Intermediário',
      content: (
        <DocCard
          title={docs.niveis.intermediario.titulo}
          description={docs.niveis.intermediario.descricao}
          checklist={docs.niveis.intermediario.checklist}
        />
      ),
    },
    {
      title: 'Avançado',
      content: (
        <DocCard
          title={docs.niveis.avancado.titulo}
          description={docs.niveis.avancado.descricao}
          checklist={docs.niveis.avancado.checklist}
        />
      ),
    },
  ]

  const rotinaTabs = [
    {
      title: 'Diária',
      content: (
        <DocCard
          title={docs.rotinas.diaria.titulo}
          description={docs.rotinas.diaria.descricao}
          checklist={docs.rotinas.diaria.checklist}
        />
      ),
    },
    {
      title: 'Semanal',
      content: (
        <DocCard
          title={docs.rotinas.semanal.titulo}
          description={docs.rotinas.semanal.descricao}
          checklist={docs.rotinas.semanal.checklist}
        />
      ),
    },
    {
      title: 'Mensal',
      content: (
        <DocCard
          title={docs.rotinas.mensal.titulo}
          description={docs.rotinas.mensal.descricao}
          checklist={docs.rotinas.mensal.checklist}
        />
      ),
    },
  ]

  const marketingBannerGuide =
    cargo === 'marketing' ? (
      <Card className="mt-6 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MdEvent className="text-blue-600" />
            Passo a passo: subir banners em /admin/eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Entre em `/admin/eventos` e localize o evento da casa.</li>
            <li>✅ Clique em editar e envie a imagem principal do banner.</li>
            <li>✅ Revise título/subtítulo e confirme o período do evento.</li>
            <li>✅ Salve e valide a exibição no site público.</li>
            <li>✅ Se necessário, ajuste recorte para mobile e publique novamente.</li>
          </ul>
        </CardContent>
      </Card>
    ) : null

  const atendimentoGuide =
    cargo === 'atendimento' ? (
      <Card className="mt-6 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MdOutlineWorkHistory className="text-emerald-600" />
            Passo a passo: operar /admin/reservas (check-ins e filtros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Acesse `/admin/reservas` e selecione o estabelecimento.</li>
            <li>✅ Use filtros por data, status e horário para organizar a fila.</li>
            <li>✅ Localize a reserva por nome/telefone e confirme dados.</li>
            <li>✅ Faça check-in no momento da chegada do cliente.</li>
            <li>✅ Finalize com check-out para atualizar disponibilidade de mesas.</li>
          </ul>
        </CardContent>
      </Card>
    ) : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdAutoStories className="text-blue-600" />
            Guia Interno (Intranet)
          </h1>
          <p className="text-sm text-gray-600 mt-1">{docs.descricao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoPill icon={<MdGroups />} label="Cargo" value={docs.titulo} />
        <InfoPill icon={<MdBusiness />} label="Estabelecimento" value={establishmentContext.establishmentName} />
        <InfoPill icon={<MdChecklist />} label="Escopo" value="Conteúdo restrito ao seu perfil" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Níveis de Capacitação</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs tabs={nivelTabs} contentClassName="mt-4" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rotinas Operacionais</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs tabs={rotinaTabs} contentClassName="mt-4" />
        </CardContent>
      </Card>

      {marketingBannerGuide}
      {atendimentoGuide}
    </div>
  )
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="text-blue-600">{icon}</span>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-sm font-medium text-gray-800">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DocCard({
  title,
  description,
  checklist,
}: {
  title: string
  description: string
  checklist: string[]
}) {
  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <ul className="space-y-2 text-sm text-gray-700">
          {checklist.map((item) => (
            <li key={item}>✅ {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
