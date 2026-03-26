'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MdAutoStories,
  MdBusiness,
  MdChecklist,
  MdClose,
  MdArrowBack,
  MdEvent,
  MdGroups,
  MdHome,
  MdInfo,
  MdRestaurant,
  MdSecurity,
  MdEditCalendar,
  MdMenu,
  MdOutlineWorkHistory,
  MdSchool,
  MdSearch,
  MdShield,
  MdTaskAlt,
} from 'react-icons/md';
import { Tabs } from '@/app/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useUserPermissions } from '@/app/hooks/useUserPermissions';
import { CARGO_BY_EMAIL, CARGO_BY_ROLE, DocCargo, docsConfig } from '@/app/data/docsConfig';
import IntroducaoSection from './components/IntroducaoSection';
import AcessoSection from './components/AcessoSection';
import CardapioSection from './components/CardapioSection';
import ReservasSection from './components/ReservasSection';
import ApresentacaoSection from './components/ApresentacaoSection';

function normalizeRole(role: string): string {
  return (role || '').toLowerCase().trim();
}

function resolveCargo(role: string, email: string): DocCargo | null {
  const byEmail = CARGO_BY_EMAIL[(email || '').toLowerCase().trim()];
  if (byEmail) return byEmail;
  return CARGO_BY_ROLE[normalizeRole(role)] || null;
}

export default function DocumentacaoPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isLoading, role, userEmail, canAccessAdmin, myEstablishmentPermissions } =
    useUserPermissions();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasToken = !!localStorage.getItem('authToken');
    if (!isLoading && !hasToken) {
      router.replace('/login');
    }
  }, [isLoading, router]);

  const activePermissions = useMemo(
    () => myEstablishmentPermissions.filter((p) => p.is_active),
    [myEstablishmentPermissions],
  );

  const establishmentContext = useMemo(() => {
    const first = activePermissions[0];
    if (!first) {
      return { establishmentId: null as number | null, establishmentName: 'Não identificado' };
    }
    return {
      establishmentId: Number(first.establishment_id),
      establishmentName: first.establishment_name || `Estabelecimento ${first.establishment_id}`,
    };
  }, [activePermissions]);

  const cargo = resolveCargo(role, userEmail || '');
  const baseDocs = cargo ? docsConfig.byCargo[cargo] : null;
  const establishmentOverride =
    cargo && establishmentContext.establishmentId !== null
      ? docsConfig.byEstablishmentId?.[establishmentContext.establishmentId]?.[cargo]
      : undefined;

  const docs = baseDocs
    ? {
        ...baseDocs,
        ...establishmentOverride,
        niveis: { ...baseDocs.niveis, ...(establishmentOverride?.niveis || {}) },
        rotinas: { ...baseDocs.rotinas, ...(establishmentOverride?.rotinas || {}) },
      }
    : null;

  const navBase = [
    {
      id: 'visao-geral',
      title: 'Visão Geral',
      icon: MdAutoStories,
      description: 'Resumo do perfil, cargo e estabelecimento.',
    },
    {
      id: 'trilha',
      title: 'Trilha por Nível',
      icon: MdSchool,
      description: 'Básico, intermediário e avançado.',
    },
    {
      id: 'rotinas',
      title: 'Rotinas',
      icon: MdOutlineWorkHistory,
      description: 'Rotina diária, semanal e mensal.',
    },
    {
      id: 'checklist',
      title: 'Checklist',
      icon: MdChecklist,
      description: 'Ações práticas do seu dia a dia.',
    },
  ]

  const navByCargo: Record<DocCargo, typeof navBase> = {
    marketing: [
      {
        id: 'introducao',
        title: 'Introdução',
        icon: MdHome,
        description: 'Visão geral do sistema e como você opera.',
      },
      {
        id: 'acesso',
        title: 'Acesso e Segurança',
        icon: MdSecurity,
        description: 'Permissões e como evitar acessos indevidos.',
      },
      {
        id: 'apresentacao',
        title: 'Apresentação',
        icon: MdInfo,
        description: 'Visão completa do painel administrativo.',
      },
      {
        id: 'em-construcao',
        title: 'Em Construção',
        icon: MdEvent,
        description: 'Próximas seções: Eventos, QR Code e Lista de Convidados.',
      },
    ],
    design: [
      {
        id: 'introducao',
        title: 'Introdução',
        icon: MdHome,
        description: 'Visão geral do sistema e recursos do cardápio.',
      },
      {
        id: 'acesso',
        title: 'Acesso e Segurança',
        icon: MdSecurity,
        description: 'Permissões e validação por estabelecimento.',
      },
      {
        id: 'cardapio',
        title: 'Cardápio',
        icon: MdRestaurant,
        description: 'Como gerenciar categorias, itens e imagens.',
      },
      {
        id: 'apresentacao',
        title: 'Apresentação',
        icon: MdInfo,
        description: 'Visão completa do painel administrativo.',
      },
      {
        id: 'em-construcao',
        title: 'Em Construção',
        icon: MdEvent,
        description: 'Próximas seções: Eventos e QR Code.',
      },
    ],
    atendimento: [
      {
        id: 'introducao',
        title: 'Introdução',
        icon: MdHome,
        description: 'Visão geral do sistema e operação de reservas.',
      },
      {
        id: 'acesso',
        title: 'Acesso e Segurança',
        icon: MdSecurity,
        description: 'Permissões e boas práticas de acesso.',
      },
      {
        id: 'reservas',
        title: 'Reservas',
        icon: MdEditCalendar,
        description: 'Check-ins e fluxo operacional da reserva.',
      },
      {
        id: 'apresentacao',
        title: 'Apresentação',
        icon: MdInfo,
        description: 'Visão completa do painel administrativo.',
      },
      {
        id: 'em-construcao',
        title: 'Em Construção',
        icon: MdEvent,
        description: 'Próximas seções: Lista de Convidados e QR Code.',
      },
    ],
  }

  const sections = [
    ...navBase,
    ...(cargo ? navByCargo[cargo] : []),
  ].filter((s) =>
    `${s.title} ${s.description}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600">Carregando documentação...</p>
      </div>
    );
  }

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  if (!hasToken) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <MdMenu size={24} />
              </button>
              <Link
                href="/admin"
                aria-label="Voltar ao painel"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-600 transition-colors text-sm font-semibold"
              >
                <MdArrowBack size={18} />
                <span>Voltar ao painel</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📚 Central de Documentação</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Navegação</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <MdClose size={20} />
            </button>
          </div>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <section.icon size={20} className="text-gray-500" />
                <div>
                  <div className="font-medium">{section.title}</div>
                  <div className="text-xs text-gray-500">{section.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 md:ml-64">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <motion.section
              id="visao-geral"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Guia visual da sua operação</h2>
              <p className="text-gray-600 mb-4">
                Esta é sua página principal após login, com trilha personalizada por perfil e estabelecimento.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BadgeCard icon={<MdGroups />} label="Cargo" value={docs?.titulo || 'Sem cargo mapeado'} />
                <BadgeCard icon={<MdBusiness />} label="Estabelecimento" value={establishmentContext.establishmentName} />
                <BadgeCard icon={<MdShield />} label="Acesso" value={canAccessAdmin ? 'Autorizado' : 'Restrito'} />
              </div>
            </motion.section>

            {!docs ? (
              <Card className="border-yellow-200">
                <CardHeader>
                  <CardTitle>Perfil sem trilha definida</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Seu cargo ainda não possui documentação personalizada. Solicite o cadastro da trilha para o seu perfil.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <section id="trilha">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trilha por Nível</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs
                        tabs={[
                          {
                            title: 'Básico',
                            content: (
                              <DocList
                                title={docs.niveis.basico.titulo}
                                description={docs.niveis.basico.descricao}
                                items={docs.niveis.basico.checklist}
                              />
                            ),
                          },
                          {
                            title: 'Intermediário',
                            content: (
                              <DocList
                                title={docs.niveis.intermediario.titulo}
                                description={docs.niveis.intermediario.descricao}
                                items={docs.niveis.intermediario.checklist}
                              />
                            ),
                          },
                          {
                            title: 'Avançado',
                            content: (
                              <DocList
                                title={docs.niveis.avancado.titulo}
                                description={docs.niveis.avancado.descricao}
                                items={docs.niveis.avancado.checklist}
                              />
                            ),
                          },
                        ]}
                        contentClassName="mt-4"
                      />
                    </CardContent>
                  </Card>
                </section>

                <section id="rotinas">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rotinas Operacionais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs
                        tabs={[
                          {
                            title: 'Diária',
                            content: (
                              <DocList
                                title={docs.rotinas.diaria.titulo}
                                description={docs.rotinas.diaria.descricao}
                                items={docs.rotinas.diaria.checklist}
                              />
                            ),
                          },
                          {
                            title: 'Semanal',
                            content: (
                              <DocList
                                title={docs.rotinas.semanal.titulo}
                                description={docs.rotinas.semanal.descricao}
                                items={docs.rotinas.semanal.checklist}
                              />
                            ),
                          },
                          {
                            title: 'Mensal',
                            content: (
                              <DocList
                                title={docs.rotinas.mensal.titulo}
                                description={docs.rotinas.mensal.descricao}
                                items={docs.rotinas.mensal.checklist}
                              />
                            ),
                          },
                        ]}
                        contentClassName="mt-4"
                      />
                    </CardContent>
                  </Card>
                </section>

                <section id="checklist" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cargo === 'marketing' && (
                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle>🎯 Marketing: banners em /admin/eventos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Checklist
                          items={[
                            'Entrar em /admin/eventos e selecionar o evento certo.',
                            'Editar o evento e enviar a imagem do banner.',
                            'Validar título, período e visual no mobile.',
                            'Salvar e conferir no ambiente público.',
                          ]}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {cargo === 'atendimento' && (
                    <Card className="border-emerald-200">
                      <CardHeader>
                        <CardTitle>🧾 Atendimento: /admin/reservas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Checklist
                          items={[
                            'Filtrar por data/horário e status para organizar fila.',
                            'Encontrar reserva por nome ou telefone.',
                            'Realizar check-in no momento da chegada.',
                            'Finalizar com check-out para liberar mesa.',
                          ]}
                        />
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>✅ Boas práticas rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Checklist
                        items={[
                          'Conferir o estabelecimento antes de operar.',
                          'Usar filtros para reduzir erro operacional.',
                          'Registrar ajustes importantes para o próximo turno.',
                          'Revisar rotinas semanalmente com a equipe.',
                        ]}
                      />
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

            {docs && cargo && (
              <>
                <IntroducaoSection />
                <AcessoSection />

                {cargo === 'design' && <CardapioSection />}
                {cargo === 'atendimento' && <ReservasSection />}

                <ApresentacaoSection />

                <section
                  id="em-construcao"
                  className="bg-white rounded-xl shadow-lg p-8 mb-2 border border-gray-200"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      🚧 Em Construção
                    </h3>
                    <p className="text-gray-600 mb-4">
                      As próximas seções estão sendo desenvolvidas e estarão disponíveis em breve!
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Próximas seções:</h4>
                        <ul className="space-y-1 text-gray-600 text-sm">
                          <li>• 🎉 Eventos</li>
                          <li>• 📱 Scanner QR Code</li>
                          <li>• 👥 Lista de Convidados</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Funcionalidades:</h4>
                        <ul className="space-y-1 text-gray-600 text-sm">
                          <li>• 💡 Dicas e Boas Práticas</li>
                          <li>• 📞 Suporte e Contato</li>
                          <li>• 🔍 Guias passo a passo</li>
                          <li>• 📱 Screenshots e vídeos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function BadgeCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
      <span className="text-blue-600 mt-1">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-gray-700">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <MdTaskAlt className="text-green-600 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DocList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
      <Checklist items={items} />
    </div>
  );
}
