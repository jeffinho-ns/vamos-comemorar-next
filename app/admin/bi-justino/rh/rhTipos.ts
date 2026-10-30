// Tipos e constantes da página RH — copiados do painel do Renato (setores, funções, níveis, horário da casa).

export interface HorarioDia { trabalha: boolean; entrada: string; saida: string; almoco: string; jantar: string }

export interface Employee {
  id: string;
  nome: string;
  cargo: string;
  cargoOutro: string;
  funcaoCargo: string;
  nivel: string;
  contratacao: string;
  mesReferencia: string;
  ativo: boolean;
  salario: number;
  adSalarial: number;
  horasExtras: number;
  adicionalNoturno: number;
  fgts: number;
  inss: number;
  irrf: number;
  salarioFamilia: number;
  quebra: number;
  vt: number;
  vr: number;
  ferias: number;
  decimoTerceiro: number;
  beneficios: number;
  valorTotal: number;
  horarioSemanal: HorarioDia[];
  feriasInicio: string;
  feriasFim: string;
  dataAdmissao: string;
  dataDesligamento: string;
  tipoDesligamento: string;
  desligamentoObs: string;
  valorRescisao: number;
}
export interface EmployeesPayload { ok: boolean; items?: Employee[] }

/** Foto mensal da ficha (getEmployeesMonth). */
export type FichaMes = Partial<Employee>;
export interface EmployeesMonthPayload { ok: boolean; items?: { employeeId: string; snapshot: FichaMes }[]; closed?: boolean }

export interface SetorBase { atendimentoPorPessoa: number; clt: number; int?: number; pj?: number; brigadaPadrao: number; limiteBrigada?: number }
export interface SectorBasePayload { ok: boolean; bySector?: Record<string, SetorBase> }

export interface ReservationDoc { date: string; pax?: number | null }
export interface ReservationsPayload { ok: boolean; docs?: ReservationDoc[] }

export const FREELANCER_SECTORS = ["salao", "cumim", "bar", "cozinha", "limpeza", "seguranca", "caixa", "runner", "manutencao", "estoquista"];
export const FREELANCER_SECTOR_LABEL: Record<string, string> = {
  salao: "Garçom", cumim: "Cumim", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza", seguranca: "Segurança", caixa: "Caixa/Hostess", runner: "Runner/RP", manutencao: "Manutenção", estoquista: "Estoquista",
};
export const FREELANCER_REASON_LABEL: Record<string, string> = {
  demanda: "Aumento de movimento", folga: "Cobertura de folga", ferias: "Cobertura de férias", falta: "Cobertura de falta", compensacao: "Compensação de horas", outro: "Outro motivo",
};
export const SECTOR_BASE_FALLBACK: Record<string, SetorBase> = {
  salao: { atendimentoPorPessoa: 45, clt: 4, brigadaPadrao: 4 },
  cumim: { atendimentoPorPessoa: 90, clt: 2, brigadaPadrao: 1 },
  bar: { atendimentoPorPessoa: 80, clt: 2, brigadaPadrao: 4 },
  cozinha: { atendimentoPorPessoa: 60, clt: 4, brigadaPadrao: 4 },
  limpeza: { atendimentoPorPessoa: 250, clt: 0, brigadaPadrao: 1 },
  seguranca: { atendimentoPorPessoa: 75, clt: 0, brigadaPadrao: 1 },
  caixa: { atendimentoPorPessoa: 110, clt: 2, brigadaPadrao: 2 },
  runner: { atendimentoPorPessoa: 300, clt: 0, brigadaPadrao: 1 },
  manutencao: { atendimentoPorPessoa: 400, clt: 0, brigadaPadrao: 1 },
  estoquista: { atendimentoPorPessoa: 400, clt: 0, brigadaPadrao: 1 },
};
/** Teto físico por setor (cozinha não cabe mais que 5 ao mesmo tempo). */
export const SECTOR_MAX_SIMULTANEO: Record<string, number> = { cozinha: 5 };

export const NIVEL_LABEL: Record<string, string> = { junior: "Júnior", pleno: "Pleno", senior: "Sênior" };

export const FUNCAO_CARGO_OPTIONS: { value: string; label: string; setor: string | null }[] = [
  { value: "chefeBar", label: "Chefe de Bar", setor: "bar" },
  { value: "subchefeBar", label: "Subchefe de Bar", setor: "bar" },
  { value: "auxiliarBar", label: "Auxiliar de Bar", setor: "bar" },
  { value: "chefeCozinha", label: "Chefe de Cozinha", setor: "cozinha" },
  { value: "subchefeCozinha", label: "Subchefe de Cozinha", setor: "cozinha" },
  { value: "auxiliarCozinha", label: "Auxiliar de Cozinha", setor: "cozinha" },
  { value: "chefeCaixa", label: "Chefe de Caixa", setor: "caixa" },
  { value: "maitre", label: "Maitre", setor: "salao" },
  { value: "chefeFila", label: "Chefe de Fila", setor: "salao" },
  { value: "gerente", label: "Gerente", setor: null },
];
export const FUNCAO_CARGO_LABEL: Record<string, string> = Object.fromEntries(FUNCAO_CARGO_OPTIONS.map((o) => [o.value, o.label]));

export const TIPO_DESLIGAMENTO_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— (ativo, não se aplica)" },
  { value: "pedidoDemissao", label: "Pedido de demissão (colaborador)" },
  { value: "demissaoSemJustaCausa", label: "Demissão pela empresa" },
  { value: "demissaoJustaCausa", label: "Justa causa" },
  { value: "acordo", label: "Acordo (distrato mútuo)" },
];

/** Campos numéricos da ficha, na ordem do formulário do HTML (EMPLOYEE_NUM_FIELDS). */
export const EMPLOYEE_NUM_FIELDS = ["salario", "adSalarial", "horasExtras", "adicionalNoturno", "fgts", "inss", "irrf", "salarioFamilia", "quebra", "vt", "vr", "ferias", "decimoTerceiro", "beneficios", "valorTotal"] as const;
export type CampoNumerico = (typeof EMPLOYEE_NUM_FIELDS)[number];
export const ROTULO_NUMERICO: Record<CampoNumerico, string> = {
  salario: "Salário", adSalarial: "Adicional salarial", horasExtras: "Horas extras", adicionalNoturno: "Adicional noturno", fgts: "FGTS", inss: "INSS", irrf: "IRRF",
  salarioFamilia: "Salário família", quebra: "Quebra", vt: "VT", vr: "VR", ferias: "Férias", decimoTerceiro: "13º", beneficios: "Benefícios", valorTotal: "Valor total",
};

/** Horário de funcionamento (Manual Operacional, pág. 10) — fecha>24 = madrugada seguinte. */
export const HORARIO_FUNCIONAMENTO: Record<number, { abre: number; fecha: number; txt: string } | null> = {
  0: { abre: 12, fecha: 21, txt: "Feijoada em buffet livre. Roda de samba 360º." },
  1: null,
  2: { abre: 18, fecha: 25, txt: "Noite. Som ambiente." },
  3: { abre: 18, fecha: 25, txt: "Noite. Música ao vivo." },
  4: { abre: 18, fecha: 25, txt: "Noite. Música ao vivo." },
  5: { abre: 18, fecha: 27, txt: "Noite longa. Casa cheia, entrada por faixa de público. Palco 360º." },
  6: { abre: 14, fecha: 29, txt: "O dia mais longo da casa. Abre à tarde e emenda na noite. Palco 360º." },
};

export const COLAB_SETOR_ORDEM = ["gerencia", "salao", "caixa", "cumim", "runner", "bar", "cozinha", "limpeza", "seguranca", "estoquista", "manutencao", "outros"];
export const COLAB_SETOR_LABEL: Record<string, string> = {
  gerencia: "Gerência", salao: "Garçom", caixa: "Caixa / Hostess", cumim: "Cumim", runner: "Runner / RP", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza", seguranca: "Segurança", estoquista: "Estoquista", manutencao: "Manutenção", outros: "Outros",
};

export function fichaVazia(mesReferencia: string): Employee {
  return {
    id: "", nome: "", cargo: "outro", cargoOutro: "", funcaoCargo: "", nivel: "pleno", contratacao: "CLT", mesReferencia, ativo: true,
    salario: 0, adSalarial: 0, horasExtras: 0, adicionalNoturno: 0, fgts: 0, inss: 0, irrf: 0, salarioFamilia: 0, quebra: 0, vt: 0, vr: 0, ferias: 0, decimoTerceiro: 0, beneficios: 0, valorTotal: 0,
    horarioSemanal: [0, 1, 2, 3, 4, 5, 6].map(() => ({ trabalha: false, entrada: "", saida: "", almoco: "", jantar: "" })),
    feriasInicio: "", feriasFim: "", dataAdmissao: "", dataDesligamento: "", tipoDesligamento: "", desligamentoObs: "", valorRescisao: 0,
  };
}
