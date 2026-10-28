"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import type { ZigAoVivo } from "./zigValor";

export interface NovidadesAoVivo {
  disponivel: boolean;
  motivo?: string | null;
  food?: {
    pedidos: number | null;
    renda: number | null;
    ticket: number | null;
    horas: number | null;
    preparoMin: number | null;
    vendidos: { nome: string; volume: number }[];
  } | null;
  delivery?: { plataforma: string; valor: number }[];
  avaliacoes?: {
    media: number | null;
    total: number;
    pendentes: number;
    itens: { nota: number; quando: string; status: string; texto: string; sugestao: string }[];
  } | null;
  instagram?: { seguidores: number | null; alcance30: number | null; data: string; posts: number } | null;
  crm?: {
    reservas: { status: string; reservas: number; pessoas: number }[];
    funil: { periodo: string; conversas: number | null; reservas: number | null; comparecimentoPct: number | null; porIAPct: number | null } | null;
    saude: { nota: number | null; faixa: string | null; itens: { titulo: string; valor: string; estado: string }[] } | null;
  } | null;
}

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return <AnimatedNumber value={valor} kind="money" />;
}

function BlocoNovo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="sjCard sjBloco">
      <h3>{titulo}</h3>
      {children}
      <span className="sjTag real">painel</span>
    </section>
  );
}

export function FontesNovas({
  paginaId,
  zig,
  novidades,
}: {
  paginaId: string;
  zig: ZigAoVivo | null;
  novidades: NovidadesAoVivo | null;
}) {
  const bilheteria = zig?.bilheteria?.[0];
  const blocos = [];
  if (paginaId === "financeiro" || paginaId === "master") {
    blocos.push(
      <BlocoNovo key="servico" titulo="Taxa de serviço do mês">
        <div className="v">{reais(zig?.servicoMes)}</div>
        <p className="sjMini">Gorjeta lançada pela Zig no mês, separada do faturamento.</p>
      </BlocoNovo>,
    );
  }
  if (paginaId === "marketing" && bilheteria) {
    blocos.push(
      <BlocoNovo key="bilheteria" titulo="Receita de entrada (Bilheteria)">
        <div className="v">{reais(bilheteria.receita)}</div>
        <p className="sjMini">{bilheteria.mes} · {bilheteria.entradasQtd} entradas · {bilheteria.publicoMes} no público</p>
      </BlocoNovo>,
    );
  }
  if (paginaId === "marketing" && novidades?.instagram) {
    const insta = novidades.instagram;
    blocos.push(
      <BlocoNovo key="insta" titulo="Instagram">
        <div className="sjCampos">
          <div className="sjCampo"><small>Seguidores</small><div className="v">{insta.seguidores ?? "—"}</div></div>
          <div className="sjCampo"><small>Alcance em 30 dias</small><div className="v">{insta.alcance30 ?? "—"}</div></div>
          <div className="sjCampo"><small>Posts lidos</small><div className="v">{insta.posts}</div></div>
        </div>
        {insta.data ? <p className="sjMini">Última leitura da conta em {insta.data}.</p> : null}
      </BlocoNovo>,
    );
  }
  if (paginaId === "marketing" && novidades?.food) {
    blocos.push(
      <BlocoNovo key="food" titulo="99Food">
        <div className="sjCampos">
          <div className="sjCampo"><small>Pedidos</small><div className="v">{novidades.food.pedidos ?? "—"}</div></div>
          <div className="sjCampo"><small>Renda</small><div className="v">{reais(novidades.food.renda)}</div></div>
          <div className="sjCampo"><small>Ticket</small><div className="v">{reais(novidades.food.ticket)}</div></div>
          <div className="sjCampo"><small>Horas conectada</small><div className="v">{novidades.food.horas ?? "—"}</div></div>
          <div className="sjCampo"><small>Preparo</small><div className="v">{novidades.food.preparoMin ?? "—"} min</div></div>
        </div>
        {novidades.food.vendidos.length ? <p className="sjMini">{novidades.food.vendidos.map((item) => `${item.nome} (${item.volume})`).join(" · ")}</p> : null}
      </BlocoNovo>,
    );
  }
  if (paginaId === "marketing" && novidades?.delivery?.length) {
    blocos.push(
      <BlocoNovo key="delivery" titulo="Delivery por plataforma">
        <div className="sjCampos">
          {novidades.delivery.map((item) => (
            <div key={item.plataforma} className="sjCampo"><small>{item.plataforma}</small><div className="v">{reais(item.valor)}</div></div>
          ))}
        </div>
      </BlocoNovo>,
    );
  }
  if (paginaId === "marketing" && novidades?.avaliacoes) {
    const aval = novidades.avaliacoes;
    blocos.push(
      <BlocoNovo key="google" titulo="Avaliações Google">
        <p className="sjMini">Média {aval.media == null ? "—" : aval.media.toFixed(2).replace(".", ",")} · {aval.total} lidas · {aval.pendentes} para responder</p>
        {aval.itens.slice(0, 6).map((item) => (
          <article key={`${item.quando}-${item.nota}-${item.texto.slice(0, 12)}`} className="sjCampo">
            <small>{item.nota} estrelas · {item.quando || item.status}</small>
            <p className="sjNota">{item.texto || "Sem texto"}</p>
            {item.sugestao ? <p className="sjMini">Sugestão: {item.sugestao}</p> : null}
          </article>
        ))}
      </BlocoNovo>,
    );
  }
  if (paginaId === "reservas" && novidades?.crm) {
    const crm = novidades.crm;
    blocos.push(
      <BlocoNovo key="saude" titulo="Saúde do atendimento por IA">
        <div className="v">{crm.saude?.nota == null ? "—" : `${crm.saude.nota}%`}</div>
        <p className="sjMini">{crm.saude?.faixa || "Ainda sem leitura do Dionísio"}</p>
        {crm.saude?.itens.map((item) => (
          <p key={item.titulo} className="sjMini">{item.titulo}: {item.valor}</p>
        ))}
      </BlocoNovo>,
    );
    if (crm.funil) {
      blocos.push(
        <BlocoNovo key="funil" titulo="Funil do Dionísio">
          <p className="sjMini">{crm.funil.periodo || "Último período"} · {crm.funil.conversas ?? "—"} conversas · {crm.funil.reservas ?? "—"} reservas · comparecimento {crm.funil.comparecimentoPct ?? "—"}% · pela IA {crm.funil.porIAPct ?? "—"}%</p>
        </BlocoNovo>,
      );
    }
    if (crm.reservas.length) {
      blocos.push(
        <BlocoNovo key="crm" titulo="Reservas do Dionísio">
          <div className="sjTableInner">
            <table>
              <thead><tr><th>Status</th><th>Reservas</th><th>Pessoas</th></tr></thead>
              <tbody>
                {crm.reservas.map((linha) => (
                  <tr key={linha.status}><td>{linha.status}</td><td>{linha.reservas}</td><td>{linha.pessoas}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </BlocoNovo>,
      );
    }
  }
  if (!blocos.length) return null;
  return <>{blocos}</>;
}
