"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ZigAoVivo } from "./zigValor";
import { EscalaDia } from "./EscalaDia";

type Dia = NonNullable<NonNullable<ZigAoVivo["escala"]>["dias"]>[number];
type Setor = Dia["setores"][number];

const PAGAMENTO: Record<number, number> = { 8: 125, 9: 135, 10: 145, 11: 155, 12: 165 };
const SETOR: Record<string, string> = {
  salao: "Garçom", cumim: "Cumim", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza",
  seguranca: "Segurança", caixa: "Caixa/Hostess", runner: "Runner/RP", manutencao: "Manutenção", estoquista: "Estoquista",
};
const MOTIVO: Record<string, string> = {
  demanda: "Aumento de movimento", folga: "Cobertura de folga", ferias: "Cobertura de férias",
  falta: "Cobertura de falta", compensacao: "Compensação de horas", outro: "Outro motivo",
};
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function dataCurta(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function rotuloSemana(dias: Dia[]) {
  if (!dias.length) return "Semana";
  const [ano, mes, dia] = dias[0].date.split("-").map(Number);
  const fim = dias[dias.length - 1].date.split("-");
  return `${Math.ceil(dia / 7)} sem.${MESES[mes - 1]}/${String(ano).slice(2)} (${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")} a ${fim[2]}/${fim[1]})`;
}

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="sjCollapse" open>
      <summary>
        <span className="sjChev">▸</span>
        {titulo}
        <span className="sjHint">clique para abrir</span>
      </summary>
      <div className="sjCard sjBloco sjCollapseBody">{children}</div>
    </details>
  );
}

export function HorarioCasa({ zig }: { zig: ZigAoVivo | null }) {
  const linhas = zig?.escala?.horario || [];
  return (
    <Cartao titulo="Horário de funcionamento">
      <div className="sjRole">
        <h3>Horário de funcionamento</h3>
        <span className="sjBadgeP">MANUAL OPERACIONAL, PÁG. 10</span>
      </div>
      <p className="sjNote">Capacidade simultânea máxima da casa: <b>380 pessoas</b> — todo cálculo de escala respeita esse teto, mesmo em dias de público total maior (giro/turnover). Sábado opera em blocos de horário com intensidade diferente (ver Manual, pág. 13) — sugestão de turno mais longo pros setores de bar/salão nesse dia.</p>
      <div className="sjTableInner">
        <table>
          <thead><tr><th>Dia</th><th>Abre</th><th>Fecha</th><th>Duração</th><th>O que tem</th></tr></thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.dia}>
                <td><b>{linha.dia}</b></td>
                {linha.fechado ? <td colSpan={3} className="sjMini">FECHADO — só manutenção e entregas programadas</td> : (
                  <><td>{linha.abre}</td><td>{linha.fecha}</td><td>{linha.duracao}</td></>
                )}
                <td className="sjMini">{linha.fechado ? "—" : linha.texto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}

type Rascunho = { qty: number; turno: number; aus: number };

function deslocar(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function indiceDia(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

const NOME_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function semanaEscolhida(segunda: string, base: Dia[]) {
  if (!segunda) return base;
  return [0, 1, 2, 3, 4, 5, 6].map((passo) => {
    const date = deslocar(segunda, passo);
    const nome = NOME_DIA[indiceDia(date)];
    const modelo = base.find((dia) => dia.dia === nome);
    if (!modelo) return { date, dia: nome, fechado: true, pax: 0, fonte: "Casa fechada", presentesPico: 0, setores: [] };
    return { ...modelo, date, dia: nome };
  });
}

function semanasDoMes(ano: number, mes: number, segundaSel: string, hoje: string) {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const volta = primeiro.getUTCDay() === 0 ? 6 : primeiro.getUTCDay() - 1;
  const inicio = new Date(Date.UTC(ano, mes - 1, 1 - volta));
  return Array.from({ length: 6 }, (_, semana) => {
    const monday = new Date(inicio);
    monday.setUTCDate(inicio.getUTCDate() + semana * 7);
    const mondayIso = monday.toISOString().slice(0, 10);
    const days = Array.from({ length: 7 }, (__, dia) => {
      const data = new Date(monday);
      data.setUTCDate(monday.getUTCDate() + dia);
      const iso = data.toISOString().slice(0, 10);
      return { iso, n: data.getUTCDate(), fora: data.getUTCMonth() !== mes - 1, hoje: iso === hoje };
    });
    return { monday: mondayIso, days, on: mondayIso === segundaSel };
  });
}

export function EscalaPagina({ zig }: { zig: ZigAoVivo | null }) {
  const baseDias = zig?.escala?.dias || [];
  const hoje = hojeSp();
  const [segunda, setSegunda] = useState(baseDias[0]?.date || "");
  const [calAberto, setCalAberto] = useState(false);
  const [mesCal, setMesCal] = useState(() => (baseDias[0]?.date || hoje).slice(0, 7));
  const dias = semanaEscolhida(segunda || baseDias[0]?.date || "", baseDias);
  const abertos = dias.filter((dia) => !dia.fechado);
  const inicial = abertos.find((dia) => dia.date >= hoje)?.date || abertos[0]?.date || "";
  const [data, setData] = useState(inicial);
  const [rascunho, setRascunho] = useState<Record<string, Rascunho>>({});
  const [status, setStatus] = useState("");
  const [estudo, setEstudo] = useState(false);
  const [avulsoData, setAvulsoData] = useState(inicial);
  const [avulsoSetor, setAvulsoSetor] = useState("salao");
  const [avulsoMotivo, setAvulsoMotivo] = useState("demanda");
  const [avulsoTurno, setAvulsoTurno] = useState(8);
  const [avulsoAus, setAvulsoAus] = useState(0);
  const [avulsoQtd, setAvulsoQtd] = useState(1);
  const [avulsoNota, setAvulsoNota] = useState("");
  const [avulsoStatus, setAvulsoStatus] = useState("");
  const dia = dias.find((item) => item.date === data) || abertos[0];
  const diaAvulso = dias.find((item) => item.date === avulsoData) || dia;

  function chave(date: string, setor: string) {
    return `${date}|${setor}`;
  }
  function ler(date: string, setor: Setor): Rascunho {
    return rascunho[chave(date, setor.chave)] || { qty: 0, turno: setor.turno, aus: 0 };
  }
  function gravar(date: string, setor: string, proximo: Rascunho) {
    setRascunho((atual) => ({ ...atual, [chave(date, setor)]: proximo }));
  }
  function sugerirDia() {
    if (!dia || dia.fechado) {
      setStatus("Casa fechada nesse dia (Manual) — nada pra sugerir.");
      return;
    }
    const proximo = { ...rascunho };
    let n = 0;
    dia.setores.forEach((setor) => {
      const aus = ler(dia.date, setor).aus;
      const qtd = setor.manual ? 0 : setor.sugerido + Math.min(aus, setor.fixa);
      proximo[chave(dia.date, setor.chave)] = { qty: qtd, turno: setor.turno, aus };
      if (qtd > 0) n += 1;
    });
    setRascunho(proximo);
    setStatus(n ? `${n} setor(es) com sugestão (turno ótimo de 8 a 12h em cada um).` : "Nenhum setor precisa de reforço nesse dia.");
  }
  function zerarDia() {
    if (!dia) return;
    const proximo = { ...rascunho };
    dia.setores.forEach((setor) => {
      proximo[chave(dia.date, setor.chave)] = { qty: 0, turno: setor.turno, aus: ler(dia.date, setor).aus };
    });
    setRascunho(proximo);
    setStatus("Dia zerado.");
  }

  const custoRascunho = useMemo(() => Object.values(rascunho).reduce((total, item) => total + item.qty * (PAGAMENTO[item.turno] || 0), 0), [rascunho]);
  const cmo = zig?.escala?.cmo;
  const totalCmo = custoRascunho || cmo?.total || 0;
  const pct = cmo?.faturamento ? (totalCmo / cmo.faturamento) * 100 : cmo?.pct;
  const pctTxt = pct == null ? "—" : `${pct.toFixed(1).replace(".", ",")}%`;
  const acima = pct != null && pct > 8;
  const pedidos = zig?.freelancers || [];

  return (
    <>
      <HorarioCasa zig={zig} />
      <Cartao titulo="Solicitação semanal de freelancers">
        <div className="sjRole">
          <h3>Solicitação semanal de freelancers</h3>
          <span className="sjBadgeP">PREENCHIMENTO RÁPIDO</span>
        </div>
        <p className="sjNote"><b>Um quadro só:</b> escolha a semana, clique no dia e ajuste os extras de cada setor com <b>−</b> e <b>+</b> ao lado da quantidade sugerida (a sugestão usa o mapa de calor da Zig e as reservas por horário). Antes de enviar, a <b>escala completa</b> — equipe fixa + <b>1 freelancer por linha</b>, com o horário sugerido de cada um — abre para conferência. <b>Use esta para o planejamento normal da semana</b>; a &quot;Solicitação de freelancers (avulsa)&quot; é para reforço de última hora.</p>
        <div className="sjToolbar">
          <div className="sjTb" style={{ position: "relative" }}>
            <label>Semana
              <button type="button" className="sjSemanaBtn" onClick={() => setCalAberto((aberto) => !aberto)}>{rotuloSemana(dias)}</button>
            </label>
            {calAberto ? (
              <div className="sjCalPop">
                <div className="sjCalNav">
                  <button type="button" onClick={() => setMesCal(deslocar(`${mesCal}-01`, -1).slice(0, 7))}>‹</button>
                  <span>{MESES[Number(mesCal.slice(5, 7)) - 1]}/{mesCal.slice(2, 4)}</span>
                  <button type="button" onClick={() => setMesCal(deslocar(`${mesCal}-01`, 32).slice(0, 7))}>›</button>
                </div>
                <div className="sjCalHead"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div>
                {semanasDoMes(Number(mesCal.slice(0, 4)), Number(mesCal.slice(5, 7)), segunda || dias[0]?.date || "", hoje).map((semana) => (
                  <div
                    key={semana.monday}
                    className={semana.on ? "sjCalWeek on" : "sjCalWeek"}
                    onClick={() => { setSegunda(semana.monday); setData(deslocar(semana.monday, 1)); setCalAberto(false); setStatus("Semana carregada."); }}
                  >
                    {semana.days.map((diaCal) => (
                      <span key={diaCal.iso} className={`sjCalDay${diaCal.fora ? " fora" : ""}${diaCal.hoje ? " hoje" : ""}`}>{diaCal.n}</span>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className="sjAnaliseBtn" onClick={() => setStatus("Semana carregada com o público e o horário da ZigPay.")}>Carregar semana</button>
          <span className="sjMini">{status}</span>
        </div>
        <div className="sjSubs">
          {dias.map((item) => {
            const qtd = item.setores.reduce((total, setor) => total + ler(item.date, setor).qty, 0);
            return (
              <button key={item.date} type="button" className={dia?.date === item.date ? "on" : ""} onClick={() => setData(item.date)}>
                {item.dia.slice(0, 3).toLowerCase()} {dataCurta(item.date)}{item.fechado ? " fechado" : ""}{qtd ? <span className="sjBadgeG">{qtd}</span> : null}
              </button>
            );
          })}
        </div>
        {dia && !dia.fechado ? (
          <p className="sjPaxBar">
            Pax esperado nesse dia: <b>{dia.pax.toLocaleString("pt-BR")}</b> pessoas
            {dia.fonte.includes("média") ? <span className="sjMini"> (méd. hist.)</span> : null}
            <span className="sjMini sjPaxSub">Mesmo valor em todo setor — só muda a distribuição por horário. Presentes no pico: ~{Math.round(dia.presentesPico)}.</span>
          </p>
        ) : null}
        <div className="sjToolbar">
          <button type="button" className="sjAnaliseBtn" style={{ background: "#233a1f", borderColor: "#3a5c30" }} onClick={sugerirDia}>Sugerir solicitação do dia</button>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620", borderColor: "#5c2530" }} onClick={zerarDia}>Zerar o dia</button>
          <label className="sjMini">Permanência do cliente (h)
            <input className="sjInput" type="number" min={1} max={8} step={0.1} defaultValue={zig?.escala?.permanenciaH || 3.9} style={{ width: 64 }} readOnly />
          </label>
          <button type="button" className="sjAnaliseBtn" style={{ background: acima ? "#4a1c24" : "#1f3a26" }}>
            {acima ? "CMO freelancers acima do teto: " : "CMO freelancers: "}{reais(totalCmo)}{pct != null ? ` • ${pctTxt} do faturamento (teto 8%)` : ""}
          </button>
        </div>
        <div className="sjTableInner">
          <table>
            <thead>
              <tr>
                <th>Setor</th><th>Brigada padrão</th><th>Limite de brigada</th><th>Necessário no pico</th><th>Equipe fixa hoje</th><th>Ausências</th><th>Sugerido</th><th>Extras a solicitar</th><th>Turno</th><th>Custo</th>
              </tr>
            </thead>
            <tbody>
              {dia && !dia.fechado ? dia.setores.map((setor) => {
                const item = ler(dia.date, setor);
                const custo = item.qty * (PAGAMENTO[item.turno] || 0);
                const sugerido = setor.manual ? 0 : setor.sugerido + Math.min(item.aus, setor.fixa);
                return (
                  <tr key={setor.chave} style={item.qty > 0 ? { background: "#241a12" } : undefined}>
                    <td><b>{setor.label}</b>{setor.manual ? <span className="sjMini"> • só manual</span> : null}{setor.limite != null ? <span className="sjMini"> (máx. {setor.limite})</span> : null}</td>
                    <td>{setor.brigada}</td>
                    <td>{setor.limite == null ? "—" : setor.limite}</td>
                    <td>{setor.necessario}</td>
                    <td>{Math.max(0, setor.fixa - item.aus)}{setor.referencia ? <span className="sjMini"> ref.</span> : null}</td>
                    <td>
                      <input className="sjInput sjAus" type="number" min={0} value={item.aus} onChange={(evento) => gravar(dia.date, setor.chave, { ...item, aus: Math.max(0, Number(evento.target.value) || 0) })} />
                    </td>
                    <td>{setor.manual || sugerido <= 0 ? "—" : <b>{sugerido} <span className="sjMini">({setor.turno}h)</span></b>}</td>
                    <td>
                      <div className="sjQty">
                        <button type="button" onClick={() => gravar(dia.date, setor.chave, { ...item, qty: Math.max(0, item.qty - 1) })}>−</button>
                        <input className="sjInput" type="number" min={0} value={item.qty} onChange={(evento) => gravar(dia.date, setor.chave, { ...item, qty: Math.max(0, Number(evento.target.value) || 0) })} />
                        <button type="button" onClick={() => gravar(dia.date, setor.chave, { ...item, qty: item.qty + 1 })}>+</button>
                      </div>
                    </td>
                    <td>
                      {item.qty > 0 ? (
                        <select className="sjInput" value={item.turno} onChange={(evento) => gravar(dia.date, setor.chave, { ...item, turno: Number(evento.target.value) })}>
                          {[8, 9, 10, 11, 12].map((hora) => <option key={hora} value={hora}>{hora}h — R$ {PAGAMENTO[hora]}</option>)}
                        </select>
                      ) : "—"}
                    </td>
                    <td>{item.qty > 0 ? reais(custo) : "—"}</td>
                  </tr>
                );
              }) : <tr><td colSpan={10}>Casa fechada nesse dia (Manual).</td></tr>}
            </tbody>
          </table>
        </div>
        {dias.every((item) => item.setores.every((setor) => ler(item.date, setor).qty === 0)) ? (
          <p className="sjMini">Nenhum extra solicitado ainda nesta semana. Use Sugerir solicitação do dia ou os botões − e +.</p>
        ) : null}
        <div className="sjFormAcoes">
          <button type="button" className="sjAnaliseBtn" onClick={() => setStatus("Escala completa aberta abaixo, pra conferência.")}>Visualizar escala completa</button>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#8a4423" }} onClick={() => setStatus("Conferência pronta nesta tela. O envio ao RH grava na planilha do painel do Seu Justino.")}>Enviar semana ao RH</button>
        </div>
      </Cartao>
      <EscalaDia zig={zig} />
      <Cartao titulo="Estudo de dimensionamento da escala">
        <div className="sjRole"><h3>Estudo de dimensionamento • como o BI calcula quantas pessoas cada setor precisa</h3></div>
        <p className="sjNote">A regra de &quot;atendimento por pessoa&quot; é de clientes atendidos por uma pessoa <b>ao mesmo tempo</b>. O estudo mostra, para o dia escolhido, o caminho completo: público do dia → chegadas por meia hora (mapa de calor da ZigPay) → clientes presentes ao mesmo tempo → pessoas necessárias por setor → o que a equipe fixa já cobre → freelancers.</p>
        <div className="sjToolbar">
          <div className="sjTb"><label>Dia do estudo<input className="sjInput" type="date" value={dia?.date || ""} onChange={(evento) => { setData(evento.target.value); setEstudo(false); }} /></label></div>
          <div className="sjTb"><label>Permanência do cliente (h)<input className="sjInput" type="number" readOnly value={zig?.escala?.permanenciaH || 3.9} style={{ width: 80 }} /></label></div>
          <button type="button" className="sjAnaliseBtn" onClick={() => setEstudo(true)}>Calcular estudo</button>
        </div>
        {estudo && dia && !dia.fechado ? (
          <div className="sjNote">
            <p>1) Público esperado: <b>{dia.pax.toLocaleString("pt-BR")}</b> ({dia.fonte}).</p>
            <p>2) Presentes ao mesmo tempo no pico: <b>~{Math.round(dia.presentesPico)}</b>, limitado a {zig?.escala?.capacidade || 380}.</p>
            <p>3) Por setor, necessário no pico, equipe fixa e freelancers sugeridos:</p>
            <div className="sjTableInner">
              <table>
                <thead><tr><th>Setor</th><th>Necessário no pico</th><th>Equipe fixa</th><th>Sugerido</th><th>Turno</th></tr></thead>
                <tbody>
                  {dia.setores.map((setor) => (
                    <tr key={setor.chave}><td>{setor.label}</td><td>{setor.necessario}</td><td>{setor.fixa}</td><td>{setor.sugerido}</td><td>{setor.manual ? "manual" : `${setor.turno}h`}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <p className="sjMini">Escolha o dia e clique em <b>Calcular estudo</b>.</p>}
      </Cartao>
      <Cartao titulo="Solicitação de freelancers (avulsa)">
        <div className="sjRole">
          <h3>Solicitação de freelancers (avulsa)</h3>
          <span className="sjBadgeP">APROVAÇÃO RH</span>
        </div>
        <p className="sjNote"><b>Use esta só pra reforço de última hora</b> — pro planejamento normal da semana, use a &quot;Solicitação semanal de freelancers&quot; (Operação). Peça um freelancer específico, por dia, setor e turno — cada pedido vai pra aprovação do RH. Depois que o dia passar, confirme aqui quem realmente compareceu: isso é o que conta no custo (falta não entra na conta). Quando o dia ainda não tem reserva lançada, a sugestão usa a média histórica daquele dia da semana (marcado &quot;méd. hist.&quot; na tabela abaixo) em vez de sair zerada.</p>
        <div className="sjToolbar">
          <div className="sjTb"><label>Data<input className="sjInput" type="date" value={avulsoData} onChange={(evento) => setAvulsoData(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Setor<select className="sjInput" value={avulsoSetor} onChange={(evento) => setAvulsoSetor(evento.target.value)}>{Object.entries(SETOR).map(([chave, nome]) => <option key={chave} value={chave}>{nome}</option>)}</select></label></div>
          <div className="sjTb"><label>Motivo<select className="sjInput" value={avulsoMotivo} onChange={(evento) => setAvulsoMotivo(evento.target.value)}>{Object.entries(MOTIVO).map(([chave, nome]) => <option key={chave} value={chave}>{nome}</option>)}</select></label></div>
          <div className="sjTb"><label>Turno<select className="sjInput" value={avulsoTurno} onChange={(evento) => setAvulsoTurno(Number(evento.target.value))}>{[8, 9, 10, 11, 12].map((hora) => <option key={hora} value={hora}>{hora}h — R$ {PAGAMENTO[hora]}</option>)}</select></label></div>
          <div className="sjTb"><label>CLT ausente hoje<input className="sjInput" type="number" min={0} value={avulsoAus} onChange={(evento) => setAvulsoAus(Math.max(0, Number(evento.target.value) || 0))} /></label></div>
          <div className="sjTb"><label>Quantidade<input className="sjInput" type="number" min={1} value={avulsoQtd} onChange={(evento) => setAvulsoQtd(Math.max(1, Number(evento.target.value) || 1))} /></label></div>
          <button type="button" className="sjAnaliseBtn" onClick={() => setAvulsoStatus(`Pedido de ${avulsoQtd} em ${SETOR[avulsoSetor] || avulsoSetor} anotado. A gravação segue na planilha do RH.`)}>Solicitar</button>
          <span className="sjMini">{avulsoStatus}</span>
        </div>
        <h3 className="sjFormTitulo">Sugestão de extras por setor — quadro mínimo do RH × reservas do dia ({avulsoData ? dataCurta(avulsoData) : "escolha uma data"})</h3>
        <p className="sjMini">Linha destacada = setor selecionado acima, usando o &quot;CLT ausente hoje&quot; informado. Nos demais setores a ausência é considerada 0.</p>
        {diaAvulso && !diaAvulso.fechado ? <p className="sjAlertG">Público esperado nesse dia: {diaAvulso.pax.toLocaleString("pt-BR")} pessoas{diaAvulso.fonte.includes("média") ? " (méd. hist.)" : ""}.</p> : null}
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Brigada padrão</th><th>Setor</th><th>Necessário no pico</th><th>Equipe fixa hoje</th><th>Ausências</th><th>Freelancers a contratar</th></tr></thead>
            <tbody>
              {diaAvulso && !diaAvulso.fechado ? diaAvulso.setores.map((setor) => {
                const marcado = setor.chave === avulsoSetor;
                const aus = marcado ? avulsoAus : 0;
                const ajustado = setor.manual ? 0 : Math.max(0, Math.max(setor.necessario, setor.brigada) - Math.max(0, setor.fixa - aus));
                return (
                  <tr key={setor.chave} className={marcado ? "sjLinhaSel" : undefined}>
                    <td>{setor.brigada}</td>
                    <td>{setor.label}{marcado ? " ▶" : ""}</td>
                    <td>{setor.necessario}</td>
                    <td>{Math.max(0, setor.fixa - aus)}</td>
                    <td>{aus}</td>
                    <td><b>{ajustado}</b></td>
                  </tr>
                );
              }) : <tr><td colSpan={6}>Escolha data e setor acima.</td></tr>}
            </tbody>
          </table>
        </div>
        <label className="sjFormBloco">
          <b>Observação (opcional)</b>
          <textarea className="sjInput" rows={3} placeholder="Motivo, evento, cobertura de folga, etc." value={avulsoNota} onChange={(evento) => setAvulsoNota(evento.target.value)} />
        </label>
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Data</th><th>Setor</th><th>Motivo</th><th>Turno</th><th>Qtd</th><th>Custo</th><th>Status</th><th>Presença</th><th>Ação</th></tr></thead>
            <tbody>
              {pedidos.length ? pedidos.map((pedido, indice) => (
                <tr key={`${pedido.date}-${pedido.sector}-${indice}`}>
                  <td>{dataCurta(pedido.date)}</td>
                  <td>{SETOR[pedido.sector] || pedido.sector}</td>
                  <td>{MOTIVO[pedido.reason] || pedido.reason || "—"}</td>
                  <td>{pedido.shiftHours ? `${pedido.shiftHours}h` : "—"}</td>
                  <td>{pedido.qty}</td>
                  <td>{reais(pedido.totalCost)}</td>
                  <td>{pedido.status || "—"}</td>
                  <td>{pedido.attendance || "—"}</td>
                  <td>—</td>
                </tr>
              )) : <tr><td colSpan={9}>Sem pedidos na cópia do banco. A próxima coleta da planilha traz a lista.</td></tr>}
            </tbody>
          </table>
        </div>
      </Cartao>
    </>
  );
}
