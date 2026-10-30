/** Tipos e rótulos da aba Eventos, iguais aos do painel do Renato. */

export interface Evento {
  id: string;
  data: string;
  nomeCliente: string;
  documento: string;
  telefone: string;
  email: string;
  tipoEvento: string;
  pax: number;
  valorContrato: number;
  valorSinal: number;
  dataSinal: string;
  observacao: string;
  status: string;
  createdByEmail: string;
  createdAt: string;
  updatedByEmail: string;
  updatedAt: string;
  contratoAnexoUrl: string;
  contratoAnexoNome: string;
  pagamentoPendente: boolean;
  [followup: string]: string | number | boolean;
}

export interface Tarefa {
  id: string;
  eventoId: string;
  titulo: string;
  dataVencimento: string;
  responsavelEmail: string;
  status: "pendente" | "concluida" | string;
  createdByEmail: string;
  createdAt: string;
  concluidaEm: string;
}

export interface Interacao {
  id: string;
  eventoId: string;
  tipo: string;
  texto: string;
  createdByEmail: string;
  createdAt: string;
}

export interface Cotacao {
  id: string;
  eventoId: string;
  status: string;
  nomeEmpresaCliente: string;
  nomeEvento: string;
  dataEvento: string;
  valorTotal: number;
  pax: number;
  emailCliente: string;
  nomeResponsavel: string;
  createdByEmail: string;
  createdAt: string;
  decidedByEmail: string;
  decidedAt: string;
  decisionNote: string;
  contratoDocUrl: string;
  sentByEmail: string;
  sentAt: string;
  [campo: string]: string | number;
}

export const EVENTO_TIPO_LABEL: Record<string, string> = { aniversario: "Aniversário", casamento: "Casamento", formatura: "Formatura", corporativo: "Corporativo", confraternizacao: "Confraternização", outro: "Outro" };
export const EVENTO_STATUS_LABEL: Record<string, string> = { orcamento: "Orçamento", confirmado: "Confirmado", realizado: "Realizado", cancelado: "Cancelado" };
export const EVENTO_STATUS_BADGE: Record<string, "y" | "b" | "g" | "r"> = { orcamento: "y", confirmado: "b", realizado: "g", cancelado: "r" };
export const INTERACAO_TIPO_LABEL: Record<string, string> = { nota: "Nota", ligacao: "Ligação", reuniao: "Reunião", email: "E-mail", whatsapp: "WhatsApp" };
export const COTACAO_STATUS_LABEL: Record<string, string> = { rascunho: "Rascunho", aguardando_aprovacao: "Aguardando aprovação", aprovado: "Aprovado", recusado: "Recusado", enviado: "Enviado" };
export const COTACAO_STATUS_BADGE: Record<string, "y" | "b" | "g" | "r"> = { rascunho: "y", aguardando_aprovacao: "b", aprovado: "g", recusado: "r", enviado: "g" };
export const COTACAO_EDITAVEL = ["rascunho", "recusado"];

export type CampoDef = [string, string, "text" | "number" | "email" | "date" | "time"];
export interface GrupoCampos { titulo: string; campos: CampoDef[] }

export const EVENTO_FOLLOWUP_GROUPS: GrupoCampos[] = [
  { titulo: "Negociação & contrato", campos: [
    ["responsavel", "Responsável (contato no cliente)", "text"], ["agente", "Agente/vendedor interno", "text"], ["promotor", "Promotor", "text"],
    ["ambiente", "Ambiente/espaço", "text"], ["origemLead", "Origem do lead", "text"], ["statusAdm", "OK ADM", "text"],
    ["statusFormalizacao", "Formalização da negociação", "text"], ["statusDocInfo", "Doc. info", "text"], ["statusContrato", "Contrato", "text"], ["statusAgenda", "Agenda", "text"],
  ] },
  { titulo: "Operacional", campos: [
    ["statusPagamento", "Pagamento", "text"], ["statusTemposMovimentos", "Tempos e movimentos", "text"], ["statusOs", "OS", "text"], ["statusEmailCompras", "E-mail compras", "text"],
    ["statusLista", "Lista de convidados", "text"], ["statusZig", "ZIG", "text"], ["statusExcedentes", "Excedentes", "text"], ["atracao", "Atração", "text"], ["producao", "Produção", "text"],
  ] },
  { titulo: "Pós-evento & financeiro", campos: [
    ["paxPresente", "Pax presente (real)", "number"], ["statusNotaFiscal", "Nota fiscal", "text"], ["feedback", "Feedback", "text"],
    ["valorExcedente", "Valor excedente", "number"], ["valorProducao", "Valor produção", "number"], ["valorTotal", "Valor total", "number"],
    ["comissaoCowMe", "Comissão COW ME", "number"], ["comissaoTimeComercial", "Comissão time comercial", "number"], ["comissaoPorAnalista", "Comissão por analista", "number"],
  ] },
];
export const EVENTO_FOLLOWUP_FIELDS = EVENTO_FOLLOWUP_GROUPS.flatMap((g) => g.campos.map((c) => c[0]));

export const COTACAO_FIELD_GROUPS: GrupoCampos[] = [
  { titulo: "Cliente", campos: [
    ["nomeEmpresaCliente", "Nome da empresa/cliente", "text"], ["apelidoCliente", "Apelido (nome curto usado no contrato)", "text"], ["cnpjCliente", "CNPJ", "text"],
    ["enderecoCliente", "Endereço completo", "text"], ["dataAberturaEmpresaCliente", "Empresa aberta desde (por extenso, ex.: 10 de janeiro de 2015)", "text"],
    ["nomeResponsavel", "Responsável (contato)", "text"], ["emailCliente", "E-mail do cliente", "email"], ["telefoneCliente", "Telefone do cliente", "text"],
  ] },
  { titulo: "Evento", campos: [
    ["nomeEvento", "Nome do evento", "text"], ["dataEvento", "Data do evento", "date"], ["horaInicio", "Hora de início", "time"], ["horaFim", "Hora de término", "time"],
    ["duracaoExtenso", "Duração por extenso (ex.: 6 (seis) horas)", "text"], ["pax", "Pax contratado", "number"], ["paxExtenso", "Pax por extenso (ex.: 150 (cento e cinquenta) pessoas)", "text"],
    ["ambiente", "Ambiente/espaço locado (ex.: Deck)", "text"], ["atracaoContratada", "Atração contratada (ex.: DJ Fulano)", "text"], ["menuDescricao", "Menu acordado", "text"],
  ] },
  { titulo: "Financeiro", campos: [
    ["valorTotal", "Valor total (R$)", "number"], ["valorTotalExtenso", "Valor por extenso (ex.: setenta e seis mil reais)", "text"], ["formaPagamento", "Forma de pagamento", "text"],
  ] },
];

export function pendenciasEvento(ev: Evento) {
  return EVENTO_FOLLOWUP_FIELDS.filter((f) => !ev[f]).length;
}
