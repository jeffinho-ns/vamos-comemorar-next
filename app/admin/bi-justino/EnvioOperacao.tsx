"use client";

import { useState } from "react";
import { getApiUrl } from "../../config/api";
import type { ZigAoVivo } from "./zigValor";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function textoNumero(valor: number | null | undefined) {
  if (valor == null) return "";
  return String(valor).replace(".", ",");
}

export function EnvioOperacao({
  zig,
  onSalvo,
}: {
  zig: ZigAoVivo | null;
  onSalvo: () => void;
}) {
  const salvo = zig?.envioOperacao;
  const [data, setData] = useState(salvo?.date || hoje());
  const [nome, setNome] = useState(salvo?.submittedByName || "");
  const [ocorrencias, setOcorrencias] = useState(salvo?.opIncidents || "");
  const [plano, setPlano] = useState(salvo?.opAction || "");
  const [publico, setPublico] = useState(textoNumero(salvo?.opPublic));
  const [perdas, setPerdas] = useState(textoNumero(salvo?.opLoss));
  const [manutencao, setManutencao] = useState(textoNumero(salvo?.opMaintenance));
  const [descartaveis, setDescartaveis] = useState(textoNumero(salvo?.opDisposableReq));
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const acesso = token();
    if (!acesso) {
      setStatus("Entre de novo para enviar o registro.");
      return;
    }
    setEnviando(true);
    setStatus("Enviando…");
    try {
      const res = await fetch(`${getApiUrl()}/api/bi/justino/envio/operacao`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acesso}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: data,
          submittedByName: nome,
          opIncidents: ocorrencias,
          opAction: plano,
          opPublic: publico,
          opLoss: perdas,
          opMaintenance: manutencao,
          opDisposableReq: descartaveis,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        const erro = json?.error;
        if (erro === "registro_em_branco") setStatus("Preencha ao menos um valor. Use 0 só onde realmente não houve.");
        else if (erro === "valores_invalidos") setStatus("Preencha público, perdas, manutenção e descartáveis. Zero vale; deixe em branco não.");
        else if (erro === "nome_obrigatorio") setStatus("Informe quem está enviando.");
        else if (erro === "data_invalida" || erro === "data_futura") setStatus("Escolha a data do registro, até hoje.");
        else if (erro === "acesso_negado") setStatus("Sem permissão para enviar este registro.");
        else setStatus("Não consegui gravar agora. Tente de novo.");
        return;
      }
      setStatus(json.planilha ? "Registro gravado no banco e na planilha." : "Registro gravado no banco.");
      onSalvo();
    } catch {
      setStatus("Sem conexão com a API.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="sjCard sjBloco">
      <h3>Envio do dia • Gerente Operador</h3>
      <div className="sjFormLinha">
        <label>
          <span className="sjMini">Data do registro</span>
          <input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
        </label>
        <label>
          <span className="sjMini">Enviado por</span>
          <input className="sjInput" value={nome} placeholder="Seu nome" onChange={(evento) => setNome(evento.target.value)} />
        </label>
      </div>
      <label className="sjFormBloco">
        <b>Ocorrências operacionais</b>
        <textarea className="sjInput" rows={3} value={ocorrencias} onChange={(evento) => setOcorrencias(evento.target.value)} />
        <span className="sjMini">Ruptura, fila, caixa, bar, cozinha, segurança, fornecedor, clima.</span>
      </label>
      <label className="sjFormBloco">
        <b>Plano de ação do dia</b>
        <textarea className="sjInput" rows={3} value={plano} onChange={(evento) => setPlano(evento.target.value)} />
        <span className="sjMini">Ação, responsável e prazo.</span>
      </label>
      <h3 className="sjFormTitulo">Custos e público do dia</h3>
      <div className="sjField">
        <div>
          <b>Público total do mês</b>
          <p className="sjMini">Base para custo por cliente e dimensionamento operacional.</p>
        </div>
        <input className="sjInput" inputMode="decimal" value={publico} onChange={(evento) => setPublico(evento.target.value)} />
        <p className="sjMini">Pessoas no mês.</p>
      </div>
      <div className="sjField">
        <div>
          <b>Perdas / quebras / desperdícios (R$)</b>
          <p className="sjMini"><span className="sjOk">Obrigatório.</span> Justificar desvios nas ocorrências.</p>
        </div>
        <input className="sjInput" inputMode="decimal" value={perdas} onChange={(evento) => setPerdas(evento.target.value)} />
        <p className="sjMini">Entra no custo da operação e na Diretoria.</p>
      </div>
      <div className="sjField">
        <div>
          <b>Manutenção solicitada (R$)</b>
        </div>
        <input className="sjInput" inputMode="decimal" value={manutencao} onChange={(evento) => setManutencao(evento.target.value)} />
        <p className="sjMini">Financeiro valida pagamento; gerente registra causa e necessidade.</p>
      </div>
      <div className="sjField">
        <div>
          <b>Descartáveis solicitados (R$)</b>
        </div>
        <input className="sjInput" inputMode="decimal" value={descartaveis} onChange={(evento) => setDescartaveis(evento.target.value)} />
        <p className="sjMini">Compare com o custo validado pelo Financeiro.</p>
      </div>
      <div className="sjFormAcoes">
        <button type="button" className="sjAnaliseBtn" disabled={enviando} onClick={enviar}>Enviar registro do dia</button>
        {status ? <span className="sjMini">{status}</span> : null}
      </div>
    </section>
  );
}
