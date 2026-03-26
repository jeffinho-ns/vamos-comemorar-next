export type DocCargo = 'marketing' | 'design' | 'atendimento'
export type DocNivel = 'basico' | 'intermediario' | 'avancado'
export type DocRotina = 'diaria' | 'semanal' | 'mensal'

export interface DocSection {
  titulo: string
  descricao: string
  checklist: string[]
}

export interface CargoDocs {
  titulo: string
  descricao: string
  niveis: Record<DocNivel, DocSection>
  rotinas: Record<DocRotina, DocSection>
}

export interface DocsConfig {
  byCargo: Record<DocCargo, CargoDocs>
  byEstablishmentId?: Record<number, Partial<Record<DocCargo, Partial<CargoDocs>>>>
}

export const CARGO_BY_ROLE: Record<string, DocCargo> = {
  atendente: 'atendimento',
  recepcao: 'atendimento',
  'recepção': 'atendimento',
}

export const CARGO_BY_EMAIL: Record<string, DocCargo> = {
  'vinicius.gomes@ideiaum.com.br': 'design',
}

export const docsConfig: DocsConfig = {
  byCargo: {
    marketing: {
      titulo: 'Marketing',
      descricao: 'Operação de campanhas, banners e comunicação de eventos.',
      niveis: {
        basico: {
          titulo: 'Nível Básico',
          descricao: 'Fluxo essencial para publicar banner e validar visibilidade.',
          checklist: [
            'Acessar /admin/eventos e selecionar o evento correto',
            'Abrir edição do evento e enviar banner principal',
            'Confirmar proporção e qualidade da imagem',
            'Salvar e validar na página pública do estabelecimento',
          ],
        },
        intermediario: {
          titulo: 'Nível Intermediário',
          descricao: 'Padronização visual e calendário de divulgação.',
          checklist: [
            'Padronizar título, descrição curta e CTA do evento',
            'Trocar banner com antecedência mínima de 24h',
            'Revisar sequência de eventos para evitar conflito de comunicação',
            'Validar que a arte não possui texto cortado em mobile',
          ],
        },
        avancado: {
          titulo: 'Nível Avançado',
          descricao: 'Otimização de conversão com testes visuais e priorização.',
          checklist: [
            'Testar variações de capa por tipo de público',
            'Priorizar eventos estratégicos na vitrine',
            'Documentar aprendizado de cada campanha no fechamento mensal',
            'Alinhar com operação sobre capacidade e lotação antes de impulsionar',
          ],
        },
      },
      rotinas: {
        diaria: {
          titulo: 'Rotina Diária',
          descricao: 'Garantir que os eventos do dia estejam corretos e atrativos.',
          checklist: [
            'Conferir banners ativos e datas dos eventos',
            'Validar ortografia de título e descrição',
            'Checar se o evento aparece corretamente no ambiente público',
          ],
        },
        semanal: {
          titulo: 'Rotina Semanal',
          descricao: 'Planejamento de comunicação da semana.',
          checklist: [
            'Revisar agenda semanal de eventos por estabelecimento',
            'Atualizar banners sazonais e campanhas temáticas',
            'Alinhar com atendimento mudanças críticas de programação',
          ],
        },
        mensal: {
          titulo: 'Rotina Mensal',
          descricao: 'Análise de performance e evolução do playbook.',
          checklist: [
            'Consolidar aprendizados de campanhas',
            'Atualizar padrões de design e tom de comunicação',
            'Planejar próximos testes para melhoria de conversão',
          ],
        },
      },
    },
    design: {
      titulo: 'Design',
      descricao: 'Organização visual, consistência de marca e qualidade de materiais.',
      niveis: {
        basico: {
          titulo: 'Nível Básico',
          descricao: 'Garantir legibilidade e consistência visual dos materiais.',
          checklist: [
            'Usar paleta aprovada do estabelecimento',
            'Manter contraste adequado entre texto e fundo',
            'Exportar imagens em tamanho otimizado',
          ],
        },
        intermediario: {
          titulo: 'Nível Intermediário',
          descricao: 'Criar variações de arte por canal e contexto.',
          checklist: [
            'Preparar versões para desktop e mobile',
            'Ajustar composição para destaque do nome do evento',
            'Aplicar grid e espaçamento consistentes',
          ],
        },
        avancado: {
          titulo: 'Nível Avançado',
          descricao: 'Design orientado a resultado e experiência do usuário.',
          checklist: [
            'Testar hierarquia visual de conteúdo',
            'Reduzir ruído visual em peças com baixa conversão',
            'Definir padrões reutilizáveis para acelerar produção',
          ],
        },
      },
      rotinas: {
        diaria: {
          titulo: 'Rotina Diária',
          descricao: 'Revisão rápida da qualidade visual em produção.',
          checklist: [
            'Verificar nitidez das artes ativas',
            'Confirmar alinhamento de marca por estabelecimento',
            'Corrigir rapidamente qualquer arte com baixa legibilidade',
          ],
        },
        semanal: {
          titulo: 'Rotina Semanal',
          descricao: 'Organização de entregas e padrão visual.',
          checklist: [
            'Atualizar kit visual da semana',
            'Revisar templates com marketing',
            'Aprovar peças para próximos eventos',
          ],
        },
        mensal: {
          titulo: 'Rotina Mensal',
          descricao: 'Evolução do sistema visual e biblioteca de assets.',
          checklist: [
            'Revisar biblioteca de templates',
            'Arquivar artes por estabelecimento',
            'Refinar diretrizes de identidade visual',
          ],
        },
      },
    },
    atendimento: {
      titulo: 'Atendimento',
      descricao: 'Operação de reservas, check-ins e gestão de fila.',
      niveis: {
        basico: {
          titulo: 'Nível Básico',
          descricao: 'Uso essencial da tela /admin/reservas.',
          checklist: [
            'Acessar /admin/reservas e selecionar o estabelecimento',
            'Usar busca por nome/telefone para localizar reserva',
            'Executar check-in com confirmação de dados do cliente',
            'Aplicar filtro de status para priorizar atendimento',
          ],
        },
        intermediario: {
          titulo: 'Nível Intermediário',
          descricao: 'Fluxo completo de operação com organização por horário.',
          checklist: [
            'Filtrar por horário e data para reduzir fila',
            'Atualizar status de mesa conforme ocupação',
            'Registrar observações importantes no atendimento',
            'Usar check-out para liberar capacidade corretamente',
          ],
        },
        avancado: {
          titulo: 'Nível Avançado',
          descricao: 'Atendimento com foco em produtividade e experiência.',
          checklist: [
            'Antecipar picos usando visão por período',
            'Aplicar protocolo de contingência em lotação alta',
            'Acompanhar taxa de no-show para ajustes operacionais',
          ],
        },
      },
      rotinas: {
        diaria: {
          titulo: 'Rotina Diária',
          descricao: 'Garantir fluidez do atendimento no turno.',
          checklist: [
            'Conferir reservas do dia e horários críticos',
            'Executar check-ins e check-outs em tempo real',
            'Usar filtros de status para reduzir atrasos',
          ],
        },
        semanal: {
          titulo: 'Rotina Semanal',
          descricao: 'Ajuste operacional com base na semana.',
          checklist: [
            'Revisar gargalos de atendimento',
            'Atualizar padrões de alocação de mesas',
            'Alinhar melhorias com equipe de gestão',
          ],
        },
        mensal: {
          titulo: 'Rotina Mensal',
          descricao: 'Padronização e melhoria contínua do atendimento.',
          checklist: [
            'Consolidar indicadores de check-in e no-show',
            'Atualizar checklist operacional da equipe',
            'Definir plano de ação para próximos ciclos',
          ],
        },
      },
    },
  },
  byEstablishmentId: {
    1: {
      marketing: {
        descricao: 'Marketing do Seu Justino: foco em agenda da casa e sazonalidade local.',
      },
      atendimento: {
        descricao: 'Atendimento do Seu Justino: atenção especial para horários de pico.',
      },
    },
    7: {
      marketing: {
        descricao: 'Marketing do Highline: priorizar peças premium e eventos especiais.',
      },
    },
  },
}
