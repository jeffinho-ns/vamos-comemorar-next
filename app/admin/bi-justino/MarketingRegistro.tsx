"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertasFlow } from "./DiretoriaQuadros";
import { DuvidasBox } from "./marketing/DuvidasBox";
import { lerEntradas, linhasDeEnvios } from "./marketing/espelhoDados";
import { FecharMes } from "./marketing/FecharMes";
import type { KpisMarketing, RascunhoMarketing } from "./marketing/kpisMarketing";
import { UltimosEnviosMarketing } from "./marketing/UltimosEnviosMarketing";
import { chamarBi, type DadosPlanilha } from "./usePlanilha";

type ItemOutro = { id: string; descricao: string; valor: string };
type Linha = Record<string, number | string | null>;

function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function textoNumero(valor: number | string | null | undefined) {
  if (valor == null || valor === "") return "";
  return String(valor).replace(".", ",");
}

function numero(texto: string) {
  const limpo = texto.trim();
  if (!limpo) return 0;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function centavos(valor: number) {
  return Math.round(valor * 100) / 100;
}

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function novoId() {
  return `outros-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function itemVazio(): ItemOutro {
  return { id: novoId(), descricao: "", valor: "" };
}

function itensDe(linha: Linha, itensSalvos: unknown): ItemOutro[] {
  if (Array.isArray(itensSalvos) && itensSalvos.length) {
    return itensSalvos.map((item) => {
      const registro = (item && typeof item === "object" ? item : {}) as { desc?: unknown; value?: unknown };
      return { id: novoId(), descricao: typeof registro.desc === "string" ? registro.desc : "", valor: textoNumero(typeof registro.value === "number" ? registro.value : null) };
    });
  }
  const total = linha.mkOther;
  if (total == null || total === "" || Number(total) === 0) return [itemVazio()];
  return [{ id: novoId(), descricao: "Outros (importado)", valor: textoNumero(total) }];
}

function mensagemErro(erro: string | undefined) {
  if (erro === "registro_em_branco") return "Preencha ao menos um valor. Use 0 só onde realmente não houve.";
  if (erro === "valores_invalidos") return "Preencha todos os números. Zero vale; em branco não.";
  if (erro === "nome_obrigatorio") return "Informe quem está enviando.";
  if (erro === "data_invalida" || erro === "data_futura") return "Escolha a data do registro, até hoje.";
  return "Não consegui gravar agora. Tente de novo.";
}

export function MarketingRegistro({
  dados,
  kpis,
  onSalvo,
  onRascunho,
}: {
  dados: DadosPlanilha;
  kpis: KpisMarketing;
  onSalvo: () => void;
  onRascunho: (rascunho: RascunhoMarketing) => void;
}) {
  const [data, setData] = useState(hoje);
  const [nome, setNome] = useState("");
  const [trafego, setTrafego] = useState("");
  const [atracoes, setAtracoes] = useState("");
  const [itens, setItens] = useState<ItemOutro[]>(() => [itemVazio()]);
  const [reservas, setReservas] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [show, setShow] = useState("");
  const [ticket, setTicket] = useState("");
  const [passantes, setPassantes] = useState("");
  const [nota, setNota] = useState("");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const envios = useMemo(() => lerEntradas(dados, "marketing"), [dados]);
  const linhas = useMemo(() => linhasDeEnvios(envios), [envios]);
  const outrosTotal = centavos(itens.reduce((soma, item) => soma + numero(item.valor), 0));
  const totalClientes = numero(show) + numero(passantes);

  useEffect(() => {
    onRascunho({
      date: data,
      trafego: numero(trafego),
      atracoes: numero(atracoes),
      outros: outrosTotal,
      reservas: numero(reservas),
      pessoasPorReserva: numero(pessoas),
      comparecimento: numero(show),
      passantes: numero(passantes),
    });
  }, [data, trafego, atracoes, outrosTotal, reservas, pessoas, show, passantes, onRascunho]);

  function atualizarItem(id: string, campo: "descricao" | "valor", valor: string) {
    setItens((lista) => lista.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  async function enviar() {
    setEnviando(true);
    setStatus("Enviando…");
    try {
      const r = await chamarBi<{ ok?: boolean; error?: string; planilha?: boolean }>("/api/bi/justino/envio/marketing", {
        date: data,
        submittedByName: nome,
        mkTraffic: trafego,
        mkAttractions: atracoes,
        mkOther: outrosTotal,
        mkReservations: reservas,
        mkPeople: pessoas,
        mkShow: show,
        mkTicket: ticket,
        mkWalkins: passantes,
        mkNote: nota,
      });
      if (!r.ok || !r.json?.ok) {
        setStatus(r.status === 403 ? "Sem permissão para enviar." : mensagemErro(r.json?.error));
        return;
      }
      setStatus(r.json.planilha ? "Registro gravado e enviado à planilha." : "Registro gravado neste painel.");
      onSalvo();
    } catch {
      setStatus("Não consegui gravar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function escolher(linha: Linha) {
    const doc = envios.find((item) => item.date === linha.date);
    setData(String(linha.date || hoje()));
    if (typeof linha.submittedByName === "string" && linha.submittedByName) setNome(linha.submittedByName);
    setTrafego(textoNumero(linha.mkTraffic));
    setAtracoes(textoNumero(linha.mkAttractions));
    setItens(itensDe(linha, doc?.values?.mkOtherItems));
    setReservas(textoNumero(linha.mkReservations ?? linha.mkReservas));
    setPessoas(textoNumero(linha.mkPeople));
    setShow(textoNumero(linha.mkShow ?? linha.mkAttendance));
    setTicket(textoNumero(linha.mkTicket));
    setPassantes(textoNumero(linha.mkWalkins));
    setNota(typeof linha.mkNote === "string" ? linha.mkNote : "");
    setStatus("Dia carregado no formulário. Ajuste e envie de novo para substituir.");
  }

  function limpar() {
    setTrafego("");
    setAtracoes("");
    setItens([itemVazio()]);
    setReservas("");
    setPessoas("");
    setShow("");
    setTicket("");
    setPassantes("");
    setNota("");
    setStatus("Dados digitados apagados. Nada foi apagado da planilha.");
  }

  return (
    <>
      <details className="sjCollapse" open>
        <summary>
          <span className="sjChev">▸</span>
          Envio do dia • Marketing
          <span className="sjHint">clique para abrir</span>
        </summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Envio do dia • Marketing</h3>
            <span className="sjBadgeP">EDIÇÃO DA ÁREA</span>
          </div>
          <div className="sjToolbar">
            <div className="sjTb"><label>Data do registro<input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} /></label></div>
            <div className="sjTb"><label>Enviado por<input className="sjInput" value={nome} placeholder="Seu nome" onChange={(evento) => setNome(evento.target.value)} /></label></div>
            <button type="button" className="sjAnaliseBtn" disabled={enviando} onClick={() => { void enviar(); }}>Enviar registro do dia</button>
            <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={limpar}>🗑 Apagar dados digitados</button>
            <span className="sjMini" role="status">{status}</span>
          </div>
          <p className="sjMini">Pra corrigir um dia que já foi enviado: escolha a data acima, abra &quot;Últimos envios&quot; mais abaixo e clique na linha da data — os campos aqui em cima são preenchidos automaticamente com o que já foi enviado, só ajustar e enviar de novo.</p>
          <Campo titulo="Investimento em tráfego pago" ajuda="Base observada: R$ 4.500/mês • saudável inicial ≈ 0,85% do faturamento" valor={trafego} onChange={setTrafego} />
          <Campo titulo="Gastos com atrações" sub="Bandas, DJs, cantores." ajuda="Média DRE: R$ 48,1 mil/mês • saudável ≤ 8% do faturamento" valor={atracoes} onChange={setAtracoes} />
          <div className="sjFormBloco">
            <b>Outros gastos de marketing</b>
            <p className="sjMini">Adicione quantos itens precisar; o total entra sozinho no gasto de marketing.</p>
            <div className="sjMkItens">
              {itens.map((item) => (
                <div className="sjMkItem" key={item.id}>
                  <input className="sjInput" aria-label="Descrição do item" placeholder="Descrição (ex: post patrocinado, influenciador)" value={item.descricao} onChange={(evento) => atualizarItem(item.id, "descricao", evento.target.value)} />
                  <input className="sjInput" aria-label="Valor do item" inputMode="decimal" placeholder="0" value={item.valor} onChange={(evento) => atualizarItem(item.id, "valor", evento.target.value)} />
                  <button type="button" className="sjAnaliseBtn" aria-label="Remover item" onClick={() => setItens((lista) => lista.filter((atual) => atual.id !== item.id))}>×</button>
                </div>
              ))}
            </div>
            <div className="sjToolbar">
              <button type="button" className="sjAnaliseBtn" onClick={() => setItens((lista) => [...lista, itemVazio()])}>+ Adicionar item</button>
              <span className="sjMini">Total em outros itens: <b>{reais(outrosTotal)}</b></span>
            </div>
          </div>
          <div className="sjFormBloco">
            <b>Reservas geradas no dia</b>
            <p className="sjMini">Base operacional: <b>150/mês</b> • hoje: <b>{numero(reservas) || 0}</b> reserva(s)</p>
            <div className="sjMkPar">
              <label>Reservas<input className="sjInput" inputMode="numeric" value={reservas} onChange={(evento) => setReservas(evento.target.value)} /></label>
              <label>Pessoas/reserva<input className="sjInput" inputMode="numeric" value={pessoas} onChange={(evento) => setPessoas(evento.target.value)} /></label>
            </div>
            <p className="sjMini">Reservas/Pessoas por dia (média de pessoas por reserva) • base informada: <b>12/reserva</b> • hoje: <b>{numero(pessoas) || 0}</b>/reserva</p>
          </div>
          <Campo titulo="Comparecimento das reservas" ajuda="Total de público que compareceram de reservas" valor={show} onChange={setShow} inteiro />
          <Campo titulo="Ticket médio atribuído" ajuda="Base informada: R$ 130 • vale pra reserva comparecida e pra passante" valor={ticket} onChange={setTicket} />
          <Campo titulo="Clientes sem reserva (passantes)" ajuda="Público que entrou sem reserva prévia — também gera faturamento (entra no ticket médio)." valor={passantes} onChange={setPassantes} inteiro />
          <div className="sjFormBloco">
            <b>Total de clientes na casa (dia)</b>
            <input className="sjInput" readOnly aria-readonly="true" value={Math.round(totalClientes).toLocaleString("pt-BR")} />
            <p className="sjMini">Comparecimento das reservas + passantes.</p>
          </div>
          <label className="sjFormBloco">
            <b>Observação do dia</b>
            <textarea className="sjInput" rows={3} value={nota} onChange={(evento) => setNota(evento.target.value)} />
            <p className="sjMini">Campanhas, mudança de público, sazonalidade e desvios.</p>
          </label>
        </section>
      </details>
      <FecharMes area="marketing" dados={dados} onSalvo={onSalvo} />
      <AlertasFlow titulo="Alertas Marketing" alertas={kpis.alertas} nota="O bônus não premia apenas corte de mídia: o BI verifica eficiência do funil e a margem global da casa antes de destravar pagamento." />
      <details className="sjCollapse">
        <summary>
          <span className="sjChev">▸</span>
          Últimos envios • Marketing
          <span className="sjHint">clique para abrir</span>
        </summary>
        <UltimosEnviosMarketing linhas={linhas} onAtualizar={onSalvo} onEscolher={escolher} />
      </details>
      <DuvidasBox area="gestores" dados={dados} onSalvo={onSalvo} />
    </>
  );
}

function Campo({ titulo, sub, ajuda, valor, onChange, inteiro }: { titulo: string; sub?: string; ajuda: string; valor: string; onChange: (valor: string) => void; inteiro?: boolean }) {
  return (
    <label className="sjFormBloco">
      <b>{titulo}</b>
      {sub ? <p className="sjMini">{sub}</p> : null}
      <input className="sjInput" inputMode={inteiro ? "numeric" : "decimal"} value={valor} onChange={(evento) => onChange(evento.target.value)} />
      <p className="sjMini">{ajuda}</p>
    </label>
  );
}
