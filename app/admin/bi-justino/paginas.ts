export type Kind = "int" | "money" | "pct";
export type RealKey =
  | "reservas"
  | "pessoas"
  | "checkins"
  | "convidados"
  | "agenda"
  | "agendaPessoas"
  | "mes";

export interface Kpi {
  id: string;
  label: string;
  base: number;
  kind?: Kind;
  real?: RealKey;
}

export interface Subaba {
  id: string;
  label: string;
  kpis: Kpi[];
  tabela?: { titulo: string; colunas: string[]; linhas: string[][] };
}

export interface Pagina {
  id: string;
  label: string;
  grupo: "topo" | "setores" | "eventos" | "meio" | "docs" | "fim";
  subabas: Subaba[];
}

function k(id: string, label: string, base: number, kind?: Kind, real?: RealKey): Kpi {
  return { id, label, base, kind, real };
}

function sub(id: string, label: string, kpis: Kpi[], tabela?: Subaba["tabela"]): Subaba {
  return { id, label, kpis, tabela };
}

export const PAGINAS: Pagina[] = [
  {
    id: "master",
    label: "📊 Diretoria",
    grupo: "topo",
    subabas: [
      sub("visao", "Visão do mês", [
        k("m-fat", "Faturamento do mês", 612400, "money"),
        k("m-proj", "Faturamento projetado", 640000, "money"),
        k("m-ano", "Mesmo mês, ano anterior", 548200, "money"),
        k("m-media", "Média mensal do ano", 526000, "money"),
        k("m-ticket", "Ticket médio • mês", 86, "money"),
        k("m-margem", "Margem líquida", 11, "pct"),
        k("m-eco", "Economia vs meta", 18400, "money"),
        k("m-cmv", "CMV real", 21, "pct"),
        k("m-res", "Reservas hoje", 0, "int", "reservas"),
        k("m-pax", "Pessoas hoje", 0, "int", "pessoas"),
        k("m-ck", "Check-ins de reserva", 0, "int", "checkins"),
        k("m-ag", "Agenda em 30 dias", 0, "int", "agenda"),
      ], {
        titulo: "Custo por área",
        colunas: ["Área", "Meta", "Real", "Status"],
        linhas: [
          ["Marketing", "4%", "3,6%", "Dentro"],
          ["Financeiro", "fixo + 3%", "dentro", "Dentro"],
          ["RH", "19%", "17,4%", "Dentro"],
          ["Operação", "perdas", "acima", "Atenção"],
          ["CMV", "22%", "21%", "Dentro"],
        ],
      }),
    ],
  },
  {
    id: "operacao",
    label: "Gerente Operador",
    grupo: "setores",
    subabas: [
      sub("reg", "📋 Registro do dia", [
        k("op-pax", "Pessoas do dia", 186),
        k("op-giro", "Giro de mesa", 2),
        k("op-espera", "Tempo de espera (min)", 18),
        k("op-quebra", "Quebra de louça", 3),
      ]),
      sub("ind", "📊 Indicadores", [
        k("op-nps", "Nota da casa", 87, "pct"),
        k("op-perda", "Perdas do mês", 4200, "money"),
        k("op-manut", "Manutenção", 1800, "money"),
      ]),
      sub("esc", "👥 Escala e freelancers", [
        k("op-clt", "Na escala", 42),
        k("op-free", "Freelancers pedidos", 6),
        k("op-falta", "Faltas", 1),
      ], {
        titulo: "Pedidos de freelancer",
        colunas: ["Setor", "Data", "Pessoas", "Status"],
        linhas: [
          ["Salão", "sábado", "2", "Aprovado"],
          ["Bar", "sexta", "1", "Pendente"],
          ["Cozinha", "sábado", "3", "Aprovado"],
        ],
      }),
      sub("med", "⚡ Medidores", [
        k("op-luz", "Energia (kWh)", 1840),
        k("op-agua", "Água (m³)", 46),
        k("op-gas", "Gás (kg)", 120),
      ]),
      sub("fec", "🗓️ Fechamento e dúvidas", [
        k("op-duv", "Dúvidas abertas", 4),
        k("op-fech", "Dias fechados no mês", 18),
      ]),
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    grupo: "setores",
    subabas: [
      sub("daily", "Registro do dia", [
        k("mk-pub", "Público previsto", 220),
        k("mk-ing", "Ingresso médio", 40, "money"),
        k("mk-atr", "Atração do dia", 1),
      ]),
      sub("plan", "Projeção", [
        k("mk-traf", "Tráfego", 12000, "money"),
        k("mk-out", "Outros", 3500, "money"),
        k("mk-atracao", "Atrações", 18000, "money"),
      ]),
      sub("dem", "Demandas", [k("mk-dem", "Demandas abertas", 7), k("mk-ok", "Concluídas", 12)]),
      sub("graf", "Análise de gráficos", [k("mk-band", "Bandas no ranking", 8), k("mk-orc", "Orçamento de atrações", 45000, "money")]),
      sub("ins", "Insights", [k("mk-seg", "Segunda", 90), k("mk-sex", "Sexta", 240), k("mk-sab", "Sábado", 310)]),
      sub("insta", "Instagram", [
        k("mk-segd", "Seguidores", 48200),
        k("mk-alc", "Alcance 7 dias", 36100),
        k("mk-ret", "Retorno das ativações", 8, "pct"),
      ]),
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    grupo: "setores",
    subabas: [
      sub("fat", "Faturamento", [
        k("fn-fat", "Faturamento do mês", 612400, "money"),
        k("fn-cart", "Cartões", 12800, "money"),
        k("fn-util", "Utilidades", 9400, "money"),
        k("fn-eco", "Economia vs meta", 6200, "money"),
      ]),
      sub("dre", "DRE", [
        k("fn-imp", "Impostos", 48000, "money"),
        k("fn-alug", "Aluguel", 85000, "money"),
        k("fn-liq", "Resultado", 67400, "money"),
      ], {
        titulo: "Linhas da DRE",
        colunas: ["Conta", "Mês", "Ano"],
        linhas: [
          ["Receita bruta", "R$ 612 mil", "R$ 4,2 mi"],
          ["CMV", "21%", "20%"],
          ["Pessoal", "17%", "18%"],
        ],
      }),
    ],
  },
  {
    id: "rh",
    label: "RH",
    grupo: "setores",
    subabas: [
      sub("daily", "Envio do dia", [
        k("rh-core", "RH estrutural", 92000, "money"),
        k("rh-extra", "Extras", 14000, "money"),
        k("rh-cmo", "CMO / receita", 17, "pct"),
        k("rh-eco", "Economia vs meta", 4800, "money"),
        k("rh-head", "Colaboradores ativos", 58),
        k("rh-serv", "Serviço do mês", 38600, "money"),
      ]),
      sub("colab", "Colaboradores", [
        k("rh-clt", "CLT", 41),
        k("rh-pj", "PJ", 9),
        k("rh-adm", "Admissões no mês", 2),
      ], {
        titulo: "Quadro",
        colunas: ["Área", "Nome", "Admissão", "Base"],
        linhas: [
          ["Salão", "Ana Lima", "2024-03", "R$ 2.400"],
          ["Bar", "Pedro Souza", "2023-11", "R$ 2.600"],
          ["Cozinha", "Márcio Alves", "2022-01", "R$ 3.200"],
        ],
      }),
    ],
  },
  {
    id: "cmv",
    label: "CMV",
    grupo: "setores",
    subabas: [
      sub("teo", "Teórico", [
        k("cmv-food", "CMV teórico • comida", 28, "pct"),
        k("cmv-bev", "CMV teórico • bebida", 18, "pct"),
        k("cmv-cob", "Cobertura ficha técnica", 74, "pct"),
        k("cmv-real", "CMV real", 21, "pct"),
      ]),
      sub("itens", "Itens sem ficha", [k("cmv-sem", "Itens sem ficha", 16), k("cmv-venda", "Vendido sem ficha", 22400, "money")], {
        titulo: "Maiores vendas sem ficha",
        colunas: ["Item", "Categoria", "30 dias"],
        linhas: [
          ["Caipirinha", "Drink", "R$ 8.400"],
          ["Picanha", "Comida", "R$ 6.100"],
          ["Chopp", "Bebida", "R$ 5.200"],
        ],
      }),
    ],
  },
  {
    id: "eventos",
    label: "Eventos",
    grupo: "eventos",
    subabas: [
      sub("ind", "Indicadores", [
        k("ev-mes", "Eventos no mês", 4),
        k("ev-fat", "Faturamento de eventos", 86000, "money"),
        k("ev-sinal", "Sinais recebidos", 24000, "money"),
      ]),
      sub("tar", "Tarefas", [k("ev-hoje", "Tarefas de hoje", 5), k("ev-atr", "Atrasadas", 1)]),
      sub("pipe", "Pipeline", [k("ev-aberto", "Em negociação", 7), k("ev-fech", "Fechados", 3)], {
        titulo: "Próximos",
        colunas: ["Data", "Cliente", "Tipo", "Status"],
        linhas: [
          ["08/11", "Casa Oliveira", "Casamento", "Contrato"],
          ["15/11", "Atlas Ltda", "Corporativo", "Sinal"],
          ["22/11", "Família Reis", "Aniversário", "Proposta"],
        ],
      }),
    ],
  },
  {
    id: "reservas",
    label: "Reservas",
    grupo: "eventos",
    subabas: [
      sub("hoje", "Hoje no banco", [
        k("rs-n", "Reservas hoje", 0, "int", "reservas"),
        k("rs-p", "Pessoas hoje", 0, "int", "pessoas"),
        k("rs-c", "Check-ins de reserva", 0, "int", "checkins"),
        k("rs-g", "Check-ins de convidados", 0, "int", "convidados"),
        k("rs-a", "Agenda em 30 dias", 0, "int", "agenda"),
        k("rs-ap", "Pessoas na agenda", 0, "int", "agendaPessoas"),
        k("rs-m", "Reservas no mês", 0, "int", "mes"),
      ]),
      sub("lista", "Lista simulada da planilha", [
        k("rs-sem", "Reservas na semana", 64),
        k("rs-hh", "Happy hour", 11),
        k("rs-aniv", "Aniversários", 3),
      ]),
    ],
  },
  {
    id: "auditoriaop",
    label: "🛠️ Auditoria Operacional",
    grupo: "meio",
    subabas: [
      sub("itens", "Itens", [k("ao-ok", "Conformes", 28), k("ao-pend", "Pendentes", 6), k("ao-aprov", "Aguardando aprovação", 2)], {
        titulo: "Últimos itens",
        colunas: ["Setor", "Item", "Status"],
        linhas: [
          ["Salão", "Limpeza do piso", "Ok"],
          ["Bar", "Temperatura do gelo", "Pendente"],
          ["Cozinha", "Validade da proteína", "Aprovar"],
        ],
      }),
    ],
  },
  {
    id: "auditoria",
    label: "🛠️ Histórico Sistema",
    grupo: "meio",
    subabas: [
      sub("log", "Log", [k("au-hoje", "Alterações hoje", 14), k("au-mes", "No mês", 220)], {
        titulo: "O que mudou",
        colunas: ["Quando", "Quem", "Ação", "Área"],
        linhas: [
          ["16:10", "Renato", "editou", "Financeiro"],
          ["15:42", "Paula", "incluiu reserva", "Reservas"],
          ["11:05", "Márcio", "enviou CMV", "CMV"],
        ],
      }),
    ],
  },
  {
    id: "documentos",
    label: "Documentações",
    grupo: "docs",
    subabas: [
      sub("lista", "Arquivos", [k("doc-n", "Documentos", 23), k("doc-novo", "Novos no mês", 2)], {
        titulo: "Pasta",
        colunas: ["Nome", "Área", "Atualizado"],
        linhas: [
          ["Manual de abertura", "Operação", "setembro"],
          ["Contrato de banda", "Marketing", "agosto"],
          ["Alvará", "Financeiro", "julho"],
        ],
      }),
    ],
  },
  {
    id: "manual",
    label: "📘 Manual Operacional",
    grupo: "fim",
    subabas: [
      sub("cap", "Capítulos", [k("man-p", "Páginas", 86), k("man-rev", "Revisão", 4)], {
        titulo: "Sumário",
        colunas: ["Capítulo", "Área"],
        linhas: [
          ["Abertura da casa", "Operação"],
          ["Fechamento de caixa", "Financeiro"],
          ["Escala de sábado", "RH"],
        ],
      }),
    ],
  },
  {
    id: "contatos",
    label: "📞 Contatos de Emergência",
    grupo: "fim",
    subabas: [
      sub("lista", "Cadastrados", [k("ct-n", "Contatos ativos", 9)], {
        titulo: "Prestadores",
        colunas: ["Nome", "Especialidade", "Telefone"],
        linhas: [
          ["Flávio", "Eletrodomésticos", "11 90000-0000"],
          ["Casa Luz", "Elétrica", "11 91111-0000"],
          ["Hidro Sul", "Hidráulica", "11 92222-0000"],
        ],
      }),
    ],
  },
];

export const GRUPO_LABEL: Record<Pagina["grupo"], string | null> = {
  topo: null,
  setores: "Setores",
  eventos: "🎉 Eventos & Reservas",
  meio: null,
  docs: "📄 Documentos",
  fim: null,
};
