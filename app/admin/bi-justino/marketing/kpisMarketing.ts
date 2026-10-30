import { HEALTHY, bonusColaborador, statusCost, statusHigh, type Consolidado, type Selo } from "../diretoria/consolidado";
import type { MkAtual, PorData } from "./espelhoDados";
import { reais } from "./numeros";

/** Valores digitados no "Envio do dia • Marketing" (o painel do Renato calcula os KPIs em cima do rascunho). */
export interface RascunhoMarketing {
  date: string;
  trafego: number;
  atracoes: number;
  outros: number;
  reservas: number;
  pessoasPorReserva: number;
  comparecimento: number;
  passantes: number;
}

export const RASCUNHO_VAZIO: RascunhoMarketing = {
  date: "", trafego: 0, atracoes: 0, outros: 0, reservas: 0, pessoasPorReserva: 0, comparecimento: 0, passantes: 0,
};

export interface AlertaMarketing {
  nivel: Selo[0];
  titulo: string;
  valor: string;
  selo: string;
  detalhe?: string;
}

export interface KpisMarketing {
  gasto: number;
  receita: number;
  roas: number;
  cac: number;
  impacto: number;
  temDado: boolean;
  bonus: number | null;
  alertas: AlertaMarketing[];
  totalClientes: number;
  serieGasto: number[];
  serieReceita: number[];
}

function pct(valor: number) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

function alerta(titulo: string, valor: string, selo: Selo, detalhe?: string): AlertaMarketing {
  return { nivel: selo[0], titulo, valor, selo: selo[1], detalhe };
}

function ultimos(mk: Record<string, MkAtual>, n: number, campo: keyof MkAtual) {
  return Object.keys(mk).sort().slice(-n).map((data) => mk[data][campo] || 0);
}

/**
 * calcAllDrafts (parte Marketing) do painel do Renato: KPIs do topo e "Alertas Marketing".
 * `m` é o consolidado da Diretoria (faturamento do mês e margem); `zigRevenue` é o faturamento Zig por dia.
 */
export function calcularKpisMarketing(
  rascunho: RascunhoMarketing,
  zigRevenue: PorData,
  mkAtual: Record<string, MkAtual>,
  m: Consolidado | null,
  opPublico: number | null,
): KpisMarketing {
  const r = m?.r ?? 0;
  const margem = m?.margin ?? 0;
  const gasto = rascunho.trafego + rascunho.outros + rascunho.atracoes;
  const attended = rascunho.comparecimento;
  const totalClientes = attended + rascunho.passantes;
  const receita = rascunho.date ? zigRevenue[rascunho.date] || 0 : 0;
  const roas = gasto ? receita / gasto : 0;
  const cac = attended ? gasto / attended : 0;
  const meta = Math.max(4500, r * HEALTHY.trafficRate) + HEALTHY.marketingOther + r * HEALTHY.attractionRate;
  const impacto = meta - gasto;
  const score = Math.max(0, Math.min(1.25, 1 + impacto / Math.max(1, meta)));
  const temDado = gasto > 0 || receita > 0;
  const bonus = m && m.salarios.length ? bonusColaborador("marketing", margem, score, m.salarios) : null;

  const alertas: AlertaMarketing[] = [
    alerta("Tráfego pago", reais(rascunho.trafego), statusCost(rascunho.trafego, Math.max(4500, r * 0.00855), Math.max(5500, r * 0.012))),
    alerta("Atrações (bandas/DJs/cantores)", reais(rascunho.atracoes), statusCost(rascunho.atracoes, r * HEALTHY.attractionRate, r * HEALTHY.attractionRate * 1.15)),
  ];
  const esperado = rascunho.reservas * rascunho.pessoasPorReserva;
  if (esperado > 0) {
    const showPct = (attended / esperado) * 100;
    alertas.push(alerta("Comparecimento", `${attended} pessoa(s) de reserva`, statusHigh(showPct, 80, 75), `Esperado pelas reservas: ~${Math.round(esperado)} pessoa(s) (${rascunho.reservas} reserva(s) × ${rascunho.pessoasPorReserva} pessoas/reserva) • ${pct(showPct)} do esperado.`));
  } else {
    alertas.push(alerta("Comparecimento", `${attended} pessoa(s) de reserva`, ["y", "SEM Nº DE RESERVAS PRA COMPARAR"]));
  }
  if (roas < 15) alertas.push(alerta("ROAS atribuído", `${roas.toFixed(1)}x`, ["y", "ATENÇÃO"], "A base histórica estimada é muito alta; valide atribuição antes de escalar mídia."));
  if (opPublico) {
    const diffPct = (Math.abs(totalClientes - opPublico) / opPublico) * 100;
    if (diffPct > 15) {
      alertas.push(alerta("Divergência de público vs Operação", `${Math.round(totalClientes).toLocaleString("pt-BR")} (marketing) × ${opPublico.toLocaleString("pt-BR")} (operação)`, ["y", "ATENÇÃO"], "Confira reservas, passantes e o público registrado pela Operação."));
    }
  }
  return {
    gasto, receita, roas, cac, impacto, temDado, bonus, alertas, totalClientes,
    serieGasto: ultimos(mkAtual, 14, "spend"),
    serieReceita: ultimos(mkAtual, 14, "revenue"),
  };
}
