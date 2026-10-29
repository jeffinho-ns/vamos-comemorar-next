import { campoDre, type CampoDre, type DreAoVivo } from "./dreValor";
import type { BiLiveData } from "./useBiLive";
import { campoZig, type CampoZig, type ZigAoVivo } from "./zigValor";

export type CampoPainel = {
  pronto: boolean;
  valor: number | null;
  tipo: "money" | "pct" | "int" | "texto";
  texto: string | null;
  detalhe: string | null;
  origem: "zig" | "dre" | "banco";
};

function doZig(campo: CampoZig, origem: "zig" = "zig"): CampoPainel {
  return {
    pronto: campo.pronto,
    valor: campo.valor,
    tipo: campo.tipo || "money",
    texto: null,
    detalhe: campo.detalhe,
    origem,
  };
}

function doDre(campo: CampoDre): CampoPainel {
  return {
    pronto: campo.pronto,
    valor: campo.valor,
    tipo: campo.tipo === "texto" ? "texto" : campo.tipo,
    texto: campo.texto,
    detalhe: campo.detalhe,
    origem: "dre",
  };
}

function doBanco(
  valor: number | null,
  tipo: CampoPainel["tipo"],
  detalhe: string | null = null,
): CampoPainel {
  return { pronto: valor != null, valor, tipo, texto: null, detalhe, origem: "banco" };
}

function campoLive(campo: string, live: BiLiveData | null | undefined): CampoPainel | null {
  if (!live) return null;
  if (campo === "Reservas geradas no dia") return doBanco(live.hoje.reservas, "int", "Reservas de hoje no Agilizai");
  if (campo === "Comparecimento das reservas") {
    if (!live.hoje.reservas) return doBanco(null, "pct", "Sem reserva hoje para calcular o comparecimento");
    return doBanco(
      Math.round((live.hoje.checkins / live.hoje.reservas) * 10000) / 100,
      "pct",
      "Check-in sobre reservas de hoje",
    );
  }
  if (campo === "Total de clientes na casa (dia)") {
    return doBanco(live.hoje.pessoas, "int", "Pessoas nas reservas de hoje");
  }
  if (campo === "Clientes sem reserva (passantes)") {
    const convidados = live.hoje.convidados;
    if (convidados == null) return null;
    return doBanco(Math.max(0, convidados - live.hoje.checkins), "int", "Convidados com check-in além das reservas");
  }
  if (campo === "reservas da semana" || campo === "Reservas da semana (pax) — vazio = lançadas") {
    return doBanco(live.agenda.pessoas, "int", "Pessoas nas reservas dos próximos 30 dias");
  }
  return null;
}

export function campoPainel(
  paginaId: string,
  campo: string,
  zig: ZigAoVivo | null | undefined,
  dre: DreAoVivo | null | undefined,
  live?: BiLiveData | null,
): CampoPainel | null {
  const zigCampo = campoZig(paginaId, campo, zig);
  if (zigCampo && (zigCampo.valor != null || zigCampo.pronto || (zig && !zig.disponivel))) {
    return doZig(zigCampo);
  }
  const dreCampo = campoDre(paginaId, campo, dre, zig?.faturamentoMes);
  if (dreCampo && (dreCampo.valor != null || dreCampo.texto || dreCampo.pronto || (dre && !dre.disponivel))) {
    return doDre(dreCampo);
  }
  return campoLive(campo, live);
}
