import type { DreAoVivo } from "../dreValor";
import type { ZigAoVivo } from "../zigValor";
import { addDias, hojeSp, numeroDe, segundaDe } from "./numeros";

export type PontoGasto = { rotulo: string; gasto: number; receita: number | null };

function gastosPorDia(zig: ZigAoVivo | null) {
  const gastos = new Map<string, number>();
  for (const linha of zig?.lancamentos?.marketing || []) {
    const data = typeof linha.date === "string" ? linha.date.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    const gasto = (numeroDe(linha.mkTraffic) ?? 0) + (numeroDe(linha.mkAttractions) ?? 0) + (numeroDe(linha.mkOther) ?? 0);
    gastos.set(data, (gastos.get(data) || 0) + gasto);
  }
  return gastos;
}

export function pontosGastoReceita(zig: ZigAoVivo | null): { eixo: "zig" | "registro"; pontos: PontoGasto[] } {
  const gastos = gastosPorDia(zig);
  const serie = [...(zig?.serieMes || [])]
    .filter((ponto) => /^\d{4}-\d{2}-\d{2}$/.test(ponto.dia))
    .sort((a, b) => a.dia.localeCompare(b.dia))
    .slice(-30);
  if (serie.length >= 2) {
    return {
      eixo: "zig",
      pontos: serie.map((ponto) => ({
        rotulo: `${ponto.dia.slice(8, 10)}/${ponto.dia.slice(5, 7)}`,
        gasto: gastos.get(ponto.dia) ?? 0,
        receita: ponto.zig || 0,
      })),
    };
  }
  return {
    eixo: "registro",
    pontos: [...gastos.keys()].sort().slice(-30).map((data) => ({
      rotulo: `${data.slice(8, 10)}/${data.slice(5, 7)}`,
      gasto: gastos.get(data) ?? 0,
      receita: null,
    })),
  };
}

export function semanasSeisMeses(zig: ZigAoVivo | null) {
  const segunda = segundaDe(hojeSp());
  const inicio = addDias(segunda, -26 * 7);
  return (zig?.semanas || [])
    .filter((semana) => semana.inicio >= inicio && semana.inicio < segunda && semana.faturamento > 0)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export function pontosDre(dre: DreAoVivo | null) {
  const valor = dre?.valores?.revenue;
  if (!dre?.disponivel || typeof valor !== "number" || !Number.isFinite(valor)) return [];
  return [{ rotulo: dre.mes || dre.mesKey || "Mês", valor }];
}
