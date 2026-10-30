"use client";

import { useState } from "react";
import { getApiUrl } from "../../config/api";
import { AlertasFlow } from "./DiretoriaQuadros";
import { TabelaLancamentos } from "./tabelasReais";
import type { ZigAoVivo } from "./zigValor";

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

export function MarketingRegistro({ zig, onSalvo }: { zig: ZigAoVivo | null; onSalvo: () => void }) {
  const salvo = zig?.envioMarketing;
  const [data, setData] = useState(salvo?.date || hoje());
  const [nome, setNome] = useState(salvo?.submittedByName || "");
  const [trafego, setTrafego] = useState(textoNumero(salvo?.mkTraffic));
  const [atracoes, setAtracoes] = useState(textoNumero(salvo?.mkAttractions));
  const [outros, setOutros] = useState(textoNumero(salvo?.mkOther));
  const [reservas, setReservas] = useState(textoNumero(salvo?.mkReservations));
  const [pessoas, setPessoas] = useState(textoNumero(salvo?.mkPeople));
  const [show, setShow] = useState(textoNumero(salvo?.mkShow));
  const [ticket, setTicket] = useState(textoNumero(salvo?.mkTicket));
  const [passantes, setPassantes] = useState(textoNumero(salvo?.mkWalkins));
  const [nota, setNota] = useState(salvo?.mkNote || "");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const totalClientes = (Number(String(show).replace(",", ".")) || 0) + (Number(String(passantes).replace(",", ".")) || 0);

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
          mkOther: outros,
          mkReservations: reservas,
          mkPeople: pessoas,
          mkShow: show,
          mkTicket: ticket,
          mkWalkins: passantes,
          mkNote: nota,
        }),
      });
      const json = await res.json().catch(() => null);
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

  function limpar() {
    setTrafego(""); setAtracoes(""); setOutros(""); setReservas(""); setPessoas(""); setShow(""); setTicket(""); setPassantes(""); setNota("");
    setStatus("Campos limpos. Nada foi apagado do banco.");
  }

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>Envio do dia • Marketing</h3>
          <span className="sjBadgeP">EDIÇÃO DA ÁREA</span>
        </div>
        <div className="sjToolbar">
          <div className="sjTb"><label>Data do registro<input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Enviado por<input className="sjInput" value={nome} placeholder="Seu nome" onChange={(evento) => setNome(evento.target.value)} /></label></div>
          <button type="button" className="sjAnaliseBtn" disabled={enviando} onClick={enviar}>Enviar registro do dia</button>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={limpar}>Apagar dados digitados</button>
          <span className="sjMini">{status}</span>
        </div>
        <p className="sjMini">Pra corrigir um dia que já foi enviado: escolha a data, veja a linha em Últimos envios e ajuste os campos. O total de clientes soma comparecimento e passantes.</p>
        <Campo titulo="Investimento em tráfego pago" ajuda="Base observada: R$ 4.500/mês • saudável inicial ≈ 0,85% do faturamento" valor={trafego} onChange={setTrafego} />
        <Campo titulo="Gastos com atrações" ajuda="Bandas, DJs, cantores. Média DRE: R$ 48,1 mil/mês • saudável ≤ 8% do faturamento" valor={atracoes} onChange={setAtracoes} />
        <Campo titulo="Outros gastos de marketing" ajuda="O total entra sozinho no gasto de marketing." valor={outros} onChange={setOutros} />
        <div className="sjFormBloco">
          <b>Reservas geradas no dia</b>
          <div className="sjToolbar">
            <div className="sjTb"><label>Reservas<input className="sjInput" inputMode="numeric" value={reservas} onChange={(evento) => setReservas(evento.target.value)} /></label></div>
            <div className="sjTb"><label>Pessoas/reserva<input className="sjInput" inputMode="numeric" value={pessoas} onChange={(evento) => setPessoas(evento.target.value)} /></label></div>
          </div>
          <p className="sjMini">Base operacional: 150/mês • 12 pessoas por reserva.</p>
        </div>
        <Campo titulo="Comparecimento das reservas" ajuda="Total de público que compareceu de reservas" valor={show} onChange={setShow} />
        <Campo titulo="Ticket médio atribuído" ajuda="Base informada: R$ 130 • vale pra reserva comparecida e pra passante" valor={ticket} onChange={setTicket} />
        <Campo titulo="Clientes sem reserva (passantes)" ajuda="Público que entrou sem reserva prévia." valor={passantes} onChange={setPassantes} />
        <div className="sjFormBloco">
          <b>Total de clientes na casa (dia)</b>
          <input className="sjInput" readOnly value={totalClientes} />
          <p className="sjMini">Comparecimento das reservas + passantes.</p>
        </div>
        <label className="sjFormBloco">
          <b>Observação do dia</b>
          <textarea className="sjInput" rows={3} value={nota} onChange={(evento) => setNota(evento.target.value)} />
          <p className="sjMini">Campanhas, mudança de público, sazonalidade e desvios.</p>
        </label>
      </section>
      <section className="sjCard sjBloco">
        <h3>Fechar mês • Marketing</h3>
        <p className="sjMini">O fechamento do mês continua na planilha do painel. Aqui o registro diário já compõe o gasto e os alertas.</p>
      </section>
      <AlertasFlow titulo="Alertas Marketing" alertas={zig?.quadros?.marketing?.alertas || []} nota="O bônus não premia só corte de mídia: o BI olha o funil e a margem da casa antes de liberar." />
      <section className="sjCard sjBloco">
        <h3>Últimos envios • Marketing</h3>
        <TabelaLancamentos zig={zig} area="marketing" colunas={["Data", "Tráfego pago", "Atrações", "Outros", "Reservas", "Comparecimento", "Faturamento gerado"]} chaves={["date", "mkTraffic", "mkAttractions", "mkOther", "mkReservas", "mkAttendance", "mkRevenue"]} />
      </section>
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
