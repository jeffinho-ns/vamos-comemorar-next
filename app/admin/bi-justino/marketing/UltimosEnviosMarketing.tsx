"use client";

import { useMemo, useState } from "react";

type Linha = Record<string, number | string | null>;

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

function mesAtual() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());
}

function deslocarMes(mes: string, delta: number) {
  const ano = Number(mes.slice(0, 4));
  const indice = Number(mes.slice(5, 7)) - 1 + delta;
  const data = new Date(ano, indice, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function num(valor: number | string | null | undefined) {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim()) {
    const n = Number(valor);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function tem(valor: number | string | null | undefined) {
  return valor != null && valor !== "";
}

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function inteiro(valor: number) {
  return Math.round(valor).toLocaleString("pt-BR");
}

function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return "—";
  const semana = DIAS[new Date(`${iso}T12:00:00`).getDay()] || "";
  return `${semana} ${dia}/${mes}/${ano}`;
}

function horaCurta(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function reservasDe(linha: Linha) {
  if (tem(linha.mkReservations)) return num(linha.mkReservations);
  return num(linha.mkReservas);
}

function comparecimentoDe(linha: Linha) {
  if (tem(linha.mkShow)) return num(linha.mkShow);
  return num(linha.mkAttendance);
}

function faturamentoDe(linha: Linha) {
  if (tem(linha.mkShow) || tem(linha.mkWalkins) || tem(linha.mkTicket)) {
    return (num(linha.mkShow) + num(linha.mkWalkins)) * num(linha.mkTicket);
  }
  return num(linha.mkRevenue);
}

function outrosDe(linha: Linha) {
  const total = reais(num(linha.mkOther));
  const itens = num(linha.mkOtherCount);
  return itens > 0 ? `${total} (${inteiro(itens)} it.)` : total;
}

export function UltimosEnviosMarketing({
  linhas,
  onAtualizar,
  onEscolher,
}: {
  linhas: Linha[];
  onAtualizar: () => void;
  onEscolher: (linha: Linha) => void;
}) {
  const [mes, setMes] = useState(mesAtual);
  const doMes = useMemo(
    () => linhas.filter((linha) => String(linha.date || "").startsWith(mes)).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [linhas, mes],
  );
  const trafego = doMes.reduce((soma, linha) => soma + num(linha.mkTraffic), 0);
  const atracoes = doMes.reduce((soma, linha) => soma + num(linha.mkAttractions), 0);
  const reservas = doMes.reduce((soma, linha) => soma + reservasDe(linha), 0);
  const faturamento = doMes.reduce((soma, linha) => soma + faturamentoDe(linha), 0);
  const rotulo = `${MESES[Number(mes.slice(5, 7)) - 1] || mes} de ${mes.slice(0, 4)}`;
  const totais = [
    ["Envios", inteiro(doMes.length)],
    ["Tráfego pago", reais(trafego)],
    ["Atrações", reais(atracoes)],
    ["Reservas", inteiro(reservas)],
    ["Faturamento gerado", reais(faturamento)],
  ];
  return (
    <section className="sjCard sjBloco sjCollapseBody">
      <div className="sjRole">
        <h3>Últimos envios • Marketing</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>Atualizar</button>
      </div>
      <div className="sjMkMesNav">
        <button type="button" onClick={() => setMes((atual) => deslocarMes(atual, -1))} aria-label="Mês anterior">‹</button>
        <div>
          <b>{rotulo}</b>
          <span className="sjMini">{doMes.length} envio(s)</span>
        </div>
        <button type="button" onClick={() => setMes((atual) => deslocarMes(atual, 1))} aria-label="Próximo mês">›</button>
      </div>
      <div className="sjMkHistKpis">
        {totais.map(([rotuloTotal, valor]) => (
          <article key={rotuloTotal} className="sjMkHistKpi">
            <div className="v">{valor}</div>
            <span className="sjMini">{rotuloTotal}</span>
          </article>
        ))}
      </div>
      {doMes.length ? doMes.map((linha) => {
        const quando = typeof linha.submittedAt === "string" ? horaCurta(linha.submittedAt) : "";
        const nome = typeof linha.submittedByName === "string" && linha.submittedByName ? linha.submittedByName : "—";
        const stats = [
          ["Tráfego pago", reais(num(linha.mkTraffic))],
          ["Atrações", reais(num(linha.mkAttractions))],
          ["Outros", outrosDe(linha)],
          ["Reservas", tem(linha.mkReservations) || tem(linha.mkReservas) ? inteiro(reservasDe(linha)) : "—"],
          ["Comparecimento", tem(linha.mkShow) || tem(linha.mkAttendance) ? inteiro(comparecimentoDe(linha)) : "—"],
          ["Faturamento gerado", reais(faturamentoDe(linha))],
        ];
        return (
          <button key={String(linha.date)} type="button" className="sjMkDia" onClick={() => onEscolher(linha)}>
            <span className="sjMkDiaPonto" aria-hidden="true" />
            <span className="sjMkDiaMain">
              <b>{dataCurta(String(linha.date || ""))}</b>
              <span className="sjMini">{quando ? `${nome} • ${quando}` : nome}</span>
            </span>
            <span className="sjMkDiaStats">
              {stats.map(([label, val]) => (
                <span key={label} className="sjMkDiaStat">
                  <span className="sjMini">{label}</span>
                  <b>{val}</b>
                </span>
              ))}
            </span>
          </button>
        );
      }) : <p className="sjMini">Sem envios nesse mês.</p>}
    </section>
  );
}
