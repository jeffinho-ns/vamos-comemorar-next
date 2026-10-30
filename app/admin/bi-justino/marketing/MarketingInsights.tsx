"use client";

import { useMemo, useState } from "react";
import type { ZigAoVivo } from "../zigValor";

type DiaZig = NonNullable<ZigAoVivo["porDiaSemana"]>[number];
type Classe = "forte" | "fraco" | "médio";
type Diagnostico = "fluxo" | "ticket" | "ambos" | "modelo" | "equilibrado";

const ORDEM = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
const SEM_MEDIA = "Ainda sem média desse dia da semana.";

const MANUAL: Record<(typeof ORDEM)[number], readonly string[]> = {
  Segunda: ["Casa fechada para o público: só manutenção e entregas programadas."],
  Terça: ["Abre 18h, fecha 1h.", "Som ambiente — noite de conversa, sem banda.", "Promoção: chope pela metade do preço até 1h.", "Couvert artístico R$ 20 por pessoa a noite toda."],
  Quarta: ["Abre 18h, fecha 1h.", "Música ao vivo: roda de samba e pagode.", "Promoção: open de chope Heineken e Amstel por R$ 69,90 até 23h.", "Couvert artístico R$ 20 por pessoa."],
  Quinta: ["Abre 18h, fecha 1h.", "Música ao vivo: roda de samba.", "Promoção: chope Amstel e Heineken pela metade até 0h.", "Couvert artístico R$ 20 por pessoa."],
  Sexta: ["Abre 18h, fecha 3h — noite longa, casa cheia.", "Banda completa 20h–23h e 23h–2h; DJs até 3h; palco 360º com pagode e TBT do Justa.", "Couvert R$ 25 até 20h; depois a entrada segue a faixa de público do dia."],
  Sábado: ["Abre 14h, fecha 5h — o dia mais longo, em blocos.", "14h–16h som ambiente, 16h–19h pagode, 19h–22h sertanejo, 22h–0h DJ, 0h–3h pagode, 3h–5h DJ.", "Palco 360º. Couvert R$ 25 até 15h; depois a entrada segue a faixa de público."],
  Domingo: ["Abre 12h, fecha 21h.", "Feijoada em buffet livre até 17h; bebida à parte.", "Roda de samba 360º no quintal, das 15h às 18h.", "Couvert artístico R$ 30 por pessoa."],
};

const FLUXO = [
  "Reserva com benefício: drink de boas-vindas ou couvert reduzido para quem reservar até a véspera.",
  "Parcerias de fluxo no dia: empresas do entorno, grupos de aniversário e confraternização, com condição só neste dia.",
  "Concentrar a mídia paga nos 3 dias antes, com oferta clara para este dia.",
  "Atração com público próprio, divulgada também pelo perfil do artista.",
];
const TICKET = [
  "Combo do dia com drink assinatura e petisco, para subir o gasto por pessoa.",
  "Venda sugestiva da equipe: segunda rodada, drink premium e sobremesa, com meta de ticket no briefing.",
  "Acompanhar o ticket durante o serviço, não só no fechamento.",
];
const MODELO = [
  "Registrar o que roda neste dia e replicar nos dias mais fracos.",
  "Proteger o dia: abrir reservas antecipadas e manter a mídia que já funciona.",
  "Testar aqui as ideias novas de ativação.",
];
const EQUILIBRIO = [
  "Dia equilibrado: manter a rotina e testar 1 ativação nova por mês.",
  "Olhar o horário de pico quando a venda por horário entrar na leitura, para ver se a janela forte dá para esticar.",
];
const ANIVERSARIO = "Aniversários são pilar da casa (Manual de Marketing 2022): aniversariante com reserva ganha mesa decorada e entrada VIP; a partir de 20 convidados, balde de cerveja ou cachaça; a partir de 30, uma garrafa de gin. Use como isca nos dias fracos e confirme se o benefício segue o mesmo.";
const JOGO = "Dia de jogo com open ou double de chope é uma alavanca do Manual de Marketing 2022 — pode casar com patrocinadores Ambev/Heineken. Confirme se a ação segue valendo.";
const FEIJOADA = "Domingo: o Manual de Marketing 2022 posiciona a feijoada com música ao vivo como diferencial para família, casais e grupos de amigos.";

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function pessoas(valor: number | null | undefined) {
  if (valor == null) return "—";
  return Math.round(valor).toLocaleString("pt-BR");
}

function media(valores: number[]) {
  if (!valores.length) return null;
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

function temMedia(dia: DiaZig | null | undefined): dia is DiaZig & { faturamentoMedio: number } {
  return !!dia && dia.faturamentoMedio != null && dia.dias > 0;
}

function classeDe(valor: number, referencia: number | null): Classe | null {
  if (!referencia) return null;
  const razao = valor / referencia;
  if (razao >= 1.15) return "forte";
  if (razao <= 0.85) return "fraco";
  return "médio";
}

function diagnosticoDe(publico: number | null, ticket: number | null, mediaPublico: number | null, mediaTicket: number | null): Diagnostico | null {
  if (publico == null || ticket == null || !mediaPublico || !mediaTicket) return null;
  const fluxo = publico / mediaPublico;
  const gasto = ticket / mediaTicket;
  if (fluxo < 0.9 && gasto < 0.9) return "ambos";
  if (fluxo < 0.9) return "fluxo";
  if (gasto < 0.9) return "ticket";
  if (fluxo >= 1.05 && gasto >= 1.05) return "modelo";
  return "equilibrado";
}

function faixaEntrada(publico: number) {
  const arredondado = Math.round(publico);
  if (arredondado > 500) return `Público médio de ${pessoas(publico)} já está na faixa mais alta de entrada do manual (acima de 500 pessoas).`;
  const teto = arredondado <= 250 ? 250 : 500;
  const atual = teto === 250 ? "R$ 30 (consumação R$ 160)" : "R$ 40 (consumação R$ 180)";
  const proxima = teto === 250 ? "R$ 40 (consumação R$ 180)" : "R$ 50 (consumação R$ 200)";
  const falta = teto + 1 - arredondado;
  const perto = falta <= teto * 0.15;
  return `Público médio de ${pessoas(publico)} fica na faixa de entrada ${atual}. Faltam cerca de ${falta} pessoas para cobrar ${proxima} — ${perto ? "está perto de destravar a faixa seguinte." : "a faixa seguinte ainda está distante."}`;
}

function dadosDoDia(nome: string, dia: DiaZig | null, referencia: number | null, classe: Classe | null) {
  if (!temMedia(dia)) {
    return nome === "Segunda" ? [SEM_MEDIA, "Coerente com o manual: a casa fica fechada na segunda."] : [SEM_MEDIA];
  }
  const linhas = [`Faturamento médio ${reais(dia.faturamentoMedio)} (${dia.dias} dia${dia.dias > 1 ? "s" : ""} no período)${referencia && classe ? `, ${Math.round((dia.faturamentoMedio / referencia) * 100)}% da média dos dias com média (${reais(referencia)}) — dia ${classe}.` : "."}`];
  if (dia.publicoMedio != null || dia.ticketMedio != null) {
    linhas.push(`Público médio ${pessoas(dia.publicoMedio)} pessoas e ticket médio ${reais(dia.ticketMedio)}.`);
  }
  if (dia.dias < 4) linhas.push(`Amostra pequena (${dia.dias} dias): trate como indício, não como regra.`);
  return linhas;
}

function cruzamento(nome: string, dia: DiaZig | null, todos: DiaZig[], referencia: number | null) {
  if (!temMedia(dia)) return [SEM_MEDIA];
  const linhas: string[] = [];
  if (referencia) linhas.push(`Este dia fatura ${Math.round((dia.faturamentoMedio / referencia) * 100)}% da média dos dias que já têm faturamento médio.`);
  if (nome === "Terça") {
    const vizinhos = ["Quarta", "Quinta"].map((rotulo) => todos.find((item) => item.nome === rotulo)).filter(temMedia);
    const mediaVizinha = media(vizinhos.map((item) => item.faturamentoMedio));
    if (mediaVizinha && dia.faturamentoMedio) {
      const delta = Math.round(((mediaVizinha - dia.faturamentoMedio) / dia.faturamentoMedio) * 100);
      linhas.push(`Quarta e quinta (música ao vivo) faturam em média ${reais(mediaVizinha)} contra ${reais(dia.faturamentoMedio)} da terça (som ambiente, sem banda) — ${delta >= 0 ? "+" : ""}${delta}%. É hipótese a testar, não prova de causa.`);
    }
  }
  if (nome === "Quarta" && dia.ticketMedio != null) {
    linhas.push(`Ticket médio ${reais(dia.ticketMedio)} contra o open de chope de R$ 69,90 do manual: ${dia.ticketMedio < 69.9 * 1.3 ? "o ticket está colado no open — ofereça petisco e drinks fora dele." : "o ticket já passa do valor do open."}`);
  }
  if (nome === "Domingo" && dia.ticketMedio != null) {
    linhas.push(`Ticket médio ${reais(dia.ticketMedio)} contra feijoada R$ 89,90 + couvert R$ 30 do manual: ${dia.ticketMedio < 119.9 * 1.15 ? "está perto do mínimo da feijoada — trabalhe bebida junto com o buffet." : "já mostra consumo além do buffet."}`);
  }
  if ((nome === "Sexta" || nome === "Sábado") && dia.publicoMedio != null) linhas.push(faixaEntrada(dia.publicoMedio));
  linhas.push("Venda por horário e ranking de atrações não vieram nesta leitura, então o pico e o bloco mais forte ficam de fora do cruzamento.");
  return linhas;
}

function sugestoes(nome: string, dia: DiaZig | null, todos: DiaZig[], diagnostico: Diagnostico | null, classe: Classe | null) {
  if (!temMedia(dia)) return [SEM_MEDIA];
  const linhas = diagnostico === "fluxo"
    ? ["O problema aparente é fluxo: o ticket segura, falta gente.", ...FLUXO]
    : diagnostico === "ticket"
      ? ["O problema aparente é ticket: o público está, o gasto por pessoa não.", ...TICKET]
      : diagnostico === "ambos"
        ? ["Público e ticket abaixo da média. Priorize fluxo e só depois o ticket.", ...FLUXO.slice(0, 3), TICKET[0]]
        : diagnostico === "modelo"
          ? ["Dia modelo: público e ticket acima da média.", ...MODELO]
          : diagnostico === "equilibrado"
            ? [...EQUILIBRIO]
            : ["Sem público ou ticket médio suficiente para separar fluxo de ticket. A prioridade é a captura do público na ZigPay."];
  if (nome === "Terça") {
    const vizinhos = ["Quarta", "Quinta"].map((rotulo) => todos.find((item) => item.nome === rotulo)).filter(temMedia);
    const mediaVizinha = media(vizinhos.map((item) => item.faturamentoMedio));
    if (mediaVizinha && mediaVizinha > dia.faturamentoMedio * 1.15) {
      linhas.push("Testar na terça uma atração leve (voz e violão ou DJ de baixo custo) por 3–4 semanas. O manual descreve a terça como sem banda.");
    }
  }
  if (nome === "Domingo") linhas.push(FEIJOADA);
  if ((nome === "Quarta" || nome === "Quinta") && (classe === "fraco" || diagnostico === "fluxo")) linhas.push(JOGO);
  if (classe === "fraco" || diagnostico === "fluxo" || diagnostico === "ambos") linhas.push(ANIVERSARIO);
  return linhas;
}

function Selo({ classe }: { classe: Classe | null }) {
  if (classe === "forte") return <span className="sjMkOk">forte</span>;
  if (classe === "fraco") return <span className="sjBadgeR">fraco</span>;
  if (classe === "médio") return <span className="sjBadgeY">médio</span>;
  return <span className="sjMini">—</span>;
}

function Lista({ itens }: { itens: readonly string[] }) {
  return <ul className="sjMkLista">{itens.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export function MarketingInsights({ zig }: { zig: ZigAoVivo | null }) {
  const lista = zig?.porDiaSemana ?? [];
  const leitura = useMemo(() => {
    const serie = zig?.porDiaSemana ?? [];
    const abertos = serie.filter(temMedia);
    const referenciaBruta = media(abertos.map((dia) => dia.faturamentoMedio));
    const podeComparar = abertos.length >= 2 && referenciaBruta != null && referenciaBruta > 0;
    const referencia = podeComparar ? referenciaBruta : null;
    const mediaPublico = podeComparar ? media(abertos.map((dia) => dia.publicoMedio).filter((valor): valor is number => valor != null)) : null;
    const mediaTicket = podeComparar ? media(abertos.map((dia) => dia.ticketMedio).filter((valor): valor is number => valor != null)) : null;
    const porNome = ORDEM.map((nome) => {
      const dia = serie.find((item) => item.nome === nome) ?? null;
      const classe = temMedia(dia) ? classeDe(dia.faturamentoMedio, referencia) : null;
      const diagnostico = diagnosticoDe(dia?.publicoMedio ?? null, dia?.ticketMedio ?? null, mediaPublico, mediaTicket);
      return { nome, dia, classe, diagnostico };
    });
    const foco = [...porNome].filter((item) => temMedia(item.dia)).sort((a, b) => (a.dia?.faturamentoMedio ?? 0) - (b.dia?.faturamentoMedio ?? 0))[0];
    return { referencia, porNome, foco: foco?.nome ?? "Sexta", diasComMedia: abertos.length };
  }, [zig?.porDiaSemana]);
  const [escolha, setEscolha] = useState<string | null>(null);
  const diaNome = escolha ?? leitura.foco;
  const atual = leitura.porNome.find((item) => item.nome === diaNome) ?? leitura.porNome[4];
  const fraco = leitura.porNome.filter((item) => temMedia(item.dia)).sort((a, b) => (a.dia?.faturamentoMedio ?? 0) - (b.dia?.faturamentoMedio ?? 0))[0];
  const forte = leitura.porNome.filter((item) => temMedia(item.dia)).sort((a, b) => (b.dia?.faturamentoMedio ?? 0) - (a.dia?.faturamentoMedio ?? 0))[0];
  const resumo = leitura.diasComMedia < 2 || !leitura.referencia || !fraco?.dia || !temMedia(fraco.dia)
    ? "Ainda não há dias suficientes com faturamento médio para cruzar os dados."
    : fraco.dia.faturamentoMedio / leitura.referencia < 0.85
      ? `Foco da semana: ${fraco.nome} (${reais(fraco.dia.faturamentoMedio)}, ${Math.round((fraco.dia.faturamentoMedio / leitura.referencia) * 100)}% da média). Simulação: levar este dia a 85% da média (${reais(leitura.referencia * 0.85)}) adicionaria cerca de ${reais((leitura.referencia * 0.85 - fraco.dia.faturamentoMedio) * 4)} por mês, em 4 ocorrências.`
      : `Nenhum dia está abaixo de 85% da média dos dias com média — foco em elevar a média geral e proteger ${forte?.nome ?? "o dia mais forte"}.`;

  return (
    <>
      <section className="sjCard sjBloco">
        <h3>Insights de Marketing • por dia da semana</h3>
        <p className="sjNote">Cruza faturamento, público, ticket médio, venda por horário, gasto de marketing e ranking de atrações para sugerir ativações que melhorem o fluxo de cada dia. Cada dia traz como o dia funciona (Manual Operacional, ago/2026), o que os dados mostram, o cruzamento dados × manual e as sugestões. Ideias de ativação também vêm do Manual de Marketing 2022, cujos valores podem estar desatualizados.</p>
        <p className="sjMini">Médias do padrão semanal já lido no painel. Tendência, gasto de marketing, venda por horário e ranking de atrações não entram enquanto esses campos não vierem na leitura.</p>
      </section>
      <section className="sjCard sjBloco">
        <h3>Resumo por dia da semana</h3>
        <p className="sjMini">Média dos dias que já têm faturamento médio. Dia sem média fica de fora da comparação.</p>
        <div className="sjTableInner sjMkTabela">
          <table>
            <thead>
              <tr><th>Dia</th><th>Dias no período</th><th>Faturamento médio</th><th>Público médio</th><th>Ticket médio</th><th>Leitura</th></tr>
            </thead>
            <tbody>
              {leitura.porNome.map((item) => (
                <tr key={item.nome}>
                  <td>{item.nome}</td>
                  <td>{item.dia?.dias ?? "—"}</td>
                  <td>{temMedia(item.dia) ? reais(item.dia.faturamentoMedio) : "—"}</td>
                  <td>{pessoas(item.dia?.publicoMedio)}</td>
                  <td>{reais(item.dia?.ticketMedio)}</td>
                  <td><Selo classe={item.classe} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sjNote">{resumo}</p>
      </section>
      <section className="sjCard sjBloco">
        <div className="sjMkDias" role="group" aria-label="Dia da semana">
          {leitura.porNome.map((item) => (
            <button key={item.nome} type="button" className={diaNome === item.nome ? "on" : ""} aria-pressed={diaNome === item.nome} onClick={() => setEscolha(item.nome)}>
              {item.nome}
              <Selo classe={item.classe} />
            </button>
          ))}
        </div>
        <h4 className="sjMkH4">{atual.nome}</h4>
        <p><b>Como o dia funciona.</b> <span className="sjMini">Manual Operacional, v1 ago/2026</span></p>
        <Lista itens={MANUAL[atual.nome]} />
        <p><b>O que os dados mostram.</b></p>
        <Lista itens={dadosDoDia(atual.nome, atual.dia, leitura.referencia, atual.classe)} />
        <p><b>Dados × manual.</b> <span className="sjMini">cruzamento da programação do dia com o que aconteceu</span></p>
        <Lista itens={cruzamento(atual.nome, atual.dia, lista, leitura.referencia)} />
        <p><b>Sugestões de ativação.</b> <span className="sjMini">opinião a partir dos dados — valide com a operação</span></p>
        <Lista itens={sugestoes(atual.nome, atual.dia, lista, atual.diagnostico, atual.classe)} />
      </section>
    </>
  );
}
