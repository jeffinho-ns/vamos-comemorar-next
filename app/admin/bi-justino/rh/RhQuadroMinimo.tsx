"use client";

import { useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Cabecalho, Tabela } from "../financeiro/ui";
import { FREELANCER_SECTORS, FREELANCER_SECTOR_LABEL, SECTOR_BASE_FALLBACK, type Employee, type SetorBase } from "./rhTipos";

type Edicao = Record<string, { atendimento: string; brigada: string; limite: string }>;

function contagemLocal(employees: Employee[], tipo: string, setor: string) {
  return employees.filter((e) => e.ativo && e.contratacao === tipo && e.cargo === setor).length;
}

/** "Quadro mínimo por setor" (renderSectorBaseTable / saveSectorBaseUI). */
export function RhQuadroMinimo({ sectorBase, employees, onAtualizar, onSalvo }: { sectorBase: Record<string, SetorBase>; employees: Employee[]; onAtualizar: () => void; onSalvo: () => void }) {
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [status, setStatus] = useState("");

  function base(s: string): SetorBase {
    return sectorBase[s] || SECTOR_BASE_FALLBACK[s];
  }
  function abrirEdicao() {
    const inicial: Edicao = {};
    FREELANCER_SECTORS.forEach((s) => {
      const b = base(s);
      inicial[s] = { atendimento: String(b.atendimentoPorPessoa), brigada: String(b.brigadaPadrao), limite: String(b.limiteBrigada || 0) };
    });
    setEdicao(inicial);
    setStatus("");
  }
  function mudar(s: string, campo: "atendimento" | "brigada" | "limite", valor: string) {
    setEdicao((atual) => (atual ? { ...atual, [s]: { ...atual[s], [campo]: valor } } : atual));
  }
  async function salvar() {
    if (!edicao) return;
    const rows = FREELANCER_SECTORS.map((s) => ({
      sector: s,
      atendimentoPorPessoa: Number(edicao[s].atendimento) || 1,
      brigadaPadrao: Number(edicao[s].brigada) || 0,
      limiteBrigada: Math.max(0, Math.round(Number(edicao[s].limite) || 0)),
    }));
    setStatus("Salvando…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/rh/quadro-minimo", { rows });
    if (r.ok) {
      setStatus("Salvo.");
      setEdicao(null);
      onSalvo();
    } else {
      setStatus("Falha ao salvar.");
    }
  }

  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo="Quadro mínimo por setor">
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
      </Cabecalho>
      <p className="sjNote">Alimenta a sugestão automática de freelancer na aba Gerente Operador: necessário = Pax ÷ atendimento por pessoa; mínimo do dia = maior entre necessário e brigada padrão; sugestão = mínimo − CLT presente. <b>Limite de brigada</b> = máximo de pessoas do setor ao mesmo tempo (equipe fixa + freelancers): trava a solicitação de freelancers no quadro do Gerente Operador (0 = sem limite). <b>CLT agora é automático</b> — conta os colaboradores ativos com contratação CLT no quadro &quot;Colaboradores&quot; abaixo, por cargo. Atendimento por pessoa e brigada padrão continuam editáveis aqui. <b>Cozinha tem teto fixo de 5 pessoas ao mesmo tempo</b> (espaço físico, não cabe mais gente) — a sugestão nunca passa disso, mesmo em dia de público alto.</p>
      <Tabela
        colunas={["Setor", "Atendimento por pessoa", "CLT", <span key="int" title="Intermitente">INT</span>, "PJ", "Brigada padrão",
          <span key="lim" title="Máximo de pessoas do setor trabalhando AO MESMO TEMPO (equipe fixa + freelancers). 0 ou vazio = sem limite. Trava a solicitação de freelancers no quadro do Gerente Operador.">Limite de brigada</span>]}
        linhas={FREELANCER_SECTORS.map((s) => {
          const b = base(s);
          const intN = b.int != null ? b.int : contagemLocal(employees, "INT", s);
          const pjN = b.pj != null ? b.pj : contagemLocal(employees, "PJ", s);
          if (!edicao) {
            return { key: s, cels: [FREELANCER_SECTOR_LABEL[s], String(b.atendimentoPorPessoa), String(b.clt), String(intN), String(pjN), String(b.brigadaPadrao), b.limiteBrigada && b.limiteBrigada > 0 ? String(b.limiteBrigada) : <span key="l" className="sjMini">sem limite</span>] };
          }
          const e = edicao[s];
          return {
            key: s,
            cels: [
              FREELANCER_SECTOR_LABEL[s],
              <input key="a" className="sjInput" type="number" min={1} step={1} style={{ maxWidth: 100 }} value={e.atendimento} onChange={(ev) => mudar(s, "atendimento", ev.target.value)} />,
              <span key="c">{b.clt} <span className="sjMini">(colaboradores ativos)</span></span>,
              <span key="i">{intN} <span className="sjMini">(colaboradores ativos)</span></span>,
              <span key="p">{pjN} <span className="sjMini">(colaboradores ativos)</span></span>,
              <input key="b" className="sjInput" type="number" min={0} step={1} style={{ maxWidth: 80 }} value={e.brigada} onChange={(ev) => mudar(s, "brigada", ev.target.value)} />,
              <input key="l" className="sjInput" type="number" min={0} step={1} style={{ maxWidth: 90 }} placeholder="sem limite" title="Máx. de pessoas do setor ao mesmo tempo (equipe fixa + freelancers). 0 = sem limite." value={e.limite} onChange={(ev) => mudar(s, "limite", ev.target.value)} />,
            ],
          };
        })}
      />
      <div className="sjLinhaAcoes" style={{ paddingTop: 8 }}>
        {edicao ? (
          <>
            <button type="button" className="sjBtn" onClick={salvar}>Salvar quadro mínimo</button>
            <button type="button" className="sjBtn sjBtnR" onClick={() => { setEdicao(null); setStatus(""); }}>Cancelar</button>
          </>
        ) : <button type="button" className="sjBtn" onClick={abrirEdicao}>Editar</button>}
        <span className="sjMini">{status}</span>
      </div>
    </section>
  );
}
