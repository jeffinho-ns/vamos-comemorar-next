"use client";

import { useState } from "react";
import { getApiUrl } from "../../config/api";
import { AlertasFlow } from "./DiretoriaQuadros";
import { UltimosEnviosMarketing } from "./marketing/UltimosEnviosMarketing";
import type { ZigAoVivo } from "./zigValor";

type ItemOutro = { id: string; descricao: string; valor: string };

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function textoNumero(valor: number | null | undefined) {
  if (valor == null) return "";
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

function corpoEnvio(valor: unknown) {
  if (!valor || typeof valor !== "object") return null;
  const registro = valor as Record<string, unknown>;
  return {
    ok: registro.ok === true,
    error: typeof registro.error === "string" ? registro.error : "",
    planilha: registro.planilha === true,
  };
}

function numLinha(valor: number | string | null | undefined) {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim()) {
    const n = Number(valor);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function itemVazio(): ItemOutro {
  return { id: novoId(), descricao: "", valor: "" };
}

function itensIniciais(valor: number | null | undefined): ItemOutro[] {
  if (valor == null) return [itemVazio()];
  return [{ id: novoId(), descricao: "Outros (importado)", valor: textoNumero(valor) }];
}

export function MarketingRegistro({ zig, onSalvo }: { zig: ZigAoVivo | null; onSalvo: () => void }) {
  const salvo = zig?.envioMarketing;
  const [data, setData] = useState(salvo?.date || hoje());
  const [nome, setNome] = useState(salvo?.submittedByName || "");
  const [trafego, setTrafego] = useState(textoNumero(salvo?.mkTraffic));
  const [atracoes, setAtracoes] = useState(textoNumero(salvo?.mkAttractions));
  const [itens, setItens] = useState<ItemOutro[]>(() => itensIniciais(salvo?.mkOther));
  const [reservas, setReservas] = useState(textoNumero(salvo?.mkReservations));
  const [pessoas, setPessoas] = useState(textoNumero(salvo?.mkPeople));
  const [show, setShow] = useState(textoNumero(salvo?.mkShow));
  const [ticket, setTicket] = useState(textoNumero(salvo?.mkTicket));
  const [passantes, setPassantes] = useState(textoNumero(salvo?.mkWalkins));
  const [nota, setNota] = useState(salvo?.mkNote || "");
  const [mes, setMes] = useState("");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const outrosTotal = centavos(itens.reduce((soma, item) => soma + numero(item.valor), 0));
  const totalClientes = numero(show) + numero(passantes);

  function atualizarItem(id: string, campo: "descricao" | "valor", valor: string) {
    setItens((lista) => lista.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  async function enviar() {
    const acesso = token();
    if (!acesso) {
      setStatus("Entre de novo para enviar o registro.");
      return;
    }
    setEnviando(true);
    setStatus("Enviando…");
    try {
      const res = await fetch(`${getApiUrl()}/api/bi/justino/envio/marketing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${acesso}`, "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const json = corpoEnvio(await res.json().catch(() => null));
      if (!res.ok || !json?.ok) {
        const erro = json?.error;
        if (erro === "registro_em_branco") setStatus("Preencha ao menos um valor. Use 0 só onde realmente não houve.");
        else if (erro === "valores_invalidos") setStatus("Preencha todos os números. Zero vale; em branco não.");
        else if (erro === "nome_obrigatorio") setStatus("Informe quem está enviando.");
        else if (erro === "data_invalida" || erro === "data_futura") setStatus("Escolha a data do registro, até hoje.");
        else setStatus("Não consegui gravar agora. Tente de novo.");
        return;
      }
      setStatus(json.planilha ? "Registro gravado e enviado à planilha." : "Registro gravado neste painel.");
      onSalvo();
    } catch {
      setStatus("Não consegui gravar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function escolher(linha: Record<string, number | string | null>) {
    setData(String(linha.date || hoje()));
    if (typeof linha.submittedByName === "string" && linha.submittedByName) setNome(linha.submittedByName);
    setTrafego(textoNumero(numLinha(linha.mkTraffic)));
    setAtracoes(textoNumero(numLinha(linha.mkAttractions)));
    setItens(itensIniciais(numLinha(linha.mkOther)));
    setReservas(textoNumero(numLinha(linha.mkReservations ?? linha.mkReservas)));
    setPessoas(textoNumero(numLinha(linha.mkPeople)));
    setShow(textoNumero(numLinha(linha.mkShow ?? linha.mkAttendance)));
    setTicket(textoNumero(numLinha(linha.mkTicket)));
    setPassantes(textoNumero(numLinha(linha.mkWalkins)));
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
    setStatus("Campos limpos. Nada foi apagado do banco.");
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
            <button type="button" className="sjAnaliseBtn" disabled={enviando} onClick={enviar}>Enviar registro do dia</button>
            <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={limpar}>Apagar dados digitados</button>
            <span className="sjMini" role="status">{status}</span>
          </div>
          <p className="sjMini">Pra corrigir um dia que já foi enviado, clique nele em Últimos envios. O total de outros itens entra sozinho no gasto.</p>
          <Campo titulo="Investimento em tráfego pago" ajuda="Base observada: R$ 4.500/mês • saudável inicial ≈ 0,85% do faturamento" valor={trafego} onChange={setTrafego} />
          <Campo titulo="Gastos com atrações" ajuda="Bandas, DJs, cantores. Média DRE: R$ 48,1 mil/mês • saudável ≤ 8% do faturamento" valor={atracoes} onChange={setAtracoes} />
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
            <p className="sjMini">Base operacional: 150/mês.</p>
            <div className="sjMkPar">
              <label>Reservas<input className="sjInput" inputMode="numeric" value={reservas} onChange={(evento) => setReservas(evento.target.value)} /></label>
              <label>Pessoas/reserva<input className="sjInput" inputMode="numeric" value={pessoas} onChange={(evento) => setPessoas(evento.target.value)} /></label>
            </div>
            <p className="sjMini">Reservas e pessoas por dia. Base informada: 12 pessoas por reserva.</p>
          </div>
          <Campo titulo="Comparecimento das reservas" ajuda="Total de público que compareceu de reservas" valor={show} onChange={setShow} />
          <Campo titulo="Ticket médio atribuído" ajuda="Base informada: R$ 130 • vale pra reserva comparecida e pra passante" valor={ticket} onChange={setTicket} />
          <Campo titulo="Clientes sem reserva (passantes)" ajuda="Público que entrou sem reserva prévia — também gera faturamento (entra no ticket médio)." valor={passantes} onChange={setPassantes} />
          <div className="sjFormBloco">
            <b>Total de clientes na casa (dia)</b>
            <input className="sjInput" readOnly aria-readonly="true" value={totalClientes} />
            <p className="sjMini">Comparecimento das reservas + passantes.</p>
          </div>
          <label className="sjFormBloco">
            <b>Observação do dia</b>
            <textarea className="sjInput" rows={3} value={nota} onChange={(evento) => setNota(evento.target.value)} />
            <p className="sjMini">Campanhas, mudança de público, sazonalidade e desvios.</p>
          </label>
        </section>
      </details>
      <section className="sjCard sjBloco">
        <h3>Fechar mês • Marketing</h3>
        <div className="sjToolbar">
          <div className="sjTb">
            <label>Fechar mês<input className="sjInput" type="month" value={mes} onChange={(evento) => setMes(evento.target.value)} /></label>
          </div>
        </div>
        <p className="sjMini">O fechamento continua na planilha.</p>
      </section>
      <AlertasFlow titulo="Alertas Marketing" alertas={zig?.quadros?.marketing?.alertas || []} nota="O bônus não premia apenas corte de mídia: o BI verifica eficiência do funil e a margem global da casa antes de destravar pagamento." />
      <details className="sjCollapse">
        <summary>
          <span className="sjChev">▸</span>
          Últimos envios • Marketing
          <span className="sjHint">clique para abrir</span>
        </summary>
        <UltimosEnviosMarketing linhas={zig?.lancamentos?.marketing || []} onAtualizar={onSalvo} onEscolher={escolher} />
      </details>
    </>
  );
}

function Campo({ titulo, ajuda, valor, onChange }: { titulo: string; ajuda: string; valor: string; onChange: (valor: string) => void }) {
  return (
    <label className="sjFormBloco">
      <b>{titulo}</b>
      <input className="sjInput" inputMode="decimal" value={valor} onChange={(evento) => onChange(evento.target.value)} />
      <p className="sjMini">{ajuda}</p>
    </label>
  );
}
