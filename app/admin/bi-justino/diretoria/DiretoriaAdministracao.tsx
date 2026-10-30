"use client";

import { useState } from "react";
import type { DeletionsLogResp, SalariesResp, UsersListResp } from "../marketing/espelhoTipos";
import { reais } from "../marketing/numeros";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { LABEL_AREA } from "./consolidado";
import { fmtDate } from "./diretoriaCalculo";

const PAPEIS: { role: string; label: string }[] = [
  { role: "marketing", label: LABEL_AREA.marketing },
  { role: "financeiro", label: LABEL_AREA.financeiro },
  { role: "rh", label: LABEL_AREA.rh },
  { role: "operacao", label: LABEL_AREA.operacao },
  { role: "cmv", label: LABEL_AREA.cmv },
];
function quando(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Seção "⚙️ Administração" da Diretoria: elegibilidade, acessos e histórico de exclusões (leitura do espelho). */
export function DiretoriaAdministracao({ dados, onAtualizar }: { dados: DadosPlanilha; onAtualizar: () => void }) {
  const salarios = payloadDe<SalariesResp>(dados, "getSalaries")?.rows ?? [];
  const usuarios = payloadDe<UsersListResp>(dados, "getUsersList")?.users ?? [];
  const exclusoes = payloadDe<DeletionsLogResp>(dados, "getDeletionsLog")?.items ?? [];
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(6);
  const totalPaginas = Math.max(1, Math.ceil(exclusoes.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = exclusoes.slice(paginaAtual * porPagina, paginaAtual * porPagina + porPagina);

  return (
    <>
      <section className="sjCard sjBloco" style={{ background: "#16110c", borderColor: "#4a3a2c" }}>
        <h3>⚙️ Administração</h3>
        <p className="sjMini">Elegibilidade de bônus, criação de acesso ao BI e histórico de exclusões — tarefa administrativa, não acompanhamento diário.</p>
      </section>
      <details className="sjCollapse">
        <summary><span className="sjChev">▸</span> Elegibilidade do bônus • salário e admissão<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Elegibilidade do bônus • salário e admissão</h3>
            <span><button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>🔄 Atualizar</button> <span className="sjBadgeR">DADOS SENSÍVEIS • SOMENTE O ADMINISTRADOR DO BI</span></span>
          </div>
          <div className="sjTableInner">
            <table>
              <thead><tr><th>Área</th><th>Nome</th><th>Admissão</th><th>Salário-base</th></tr></thead>
              <tbody>
                {PAPEIS.map((p) => {
                  const s = salarios.find((item) => item.role === p.role);
                  return <tr key={p.role}><td>{p.label}</td><td>{s?.name || "—"}</td><td>{s?.admissionDate ? fmtDate(s.admissionDate) : "—"}</td><td>{s?.baseSalary ? reais(s.baseSalary) : "—"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="sjNota">Estes campos ficam numa planilha separada, visível e editável só pelo acesso do administrador — a edição continua no painel do Seu Justino; aqui a tela só mostra a cópia já gravada.</p>
        </section>
      </details>
      <details className="sjCollapse">
        <summary><span className="sjChev">▸</span> Acessos cadastrados<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Acessos cadastrados</h3>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>🔄 Atualizar</button>
          </div>
          <p className="sjNota">Criar ou redefinir acesso ao BI continua no painel do Seu Justino (ação sensível, não passa por este proxy). Quem é cadastrado lá só vê as abas marcadas; Diretoria enxerga todas as áreas automaticamente.</p>
          <div className="sjTableInner">
            <table>
              <thead><tr><th>E-mail</th><th>Nível</th><th>Abas</th><th>Ação</th></tr></thead>
              <tbody>
                {usuarios.length ? usuarios.map((u) => <tr key={u.email}><td>{u.email}</td><td>{u.role === "owner" ? "Diretoria" : "Usuário"}</td><td>{u.areas || "—"}</td><td className="sjMini">no painel</td></tr>) : <tr><td colSpan={4} className="sjMini">Ainda sem cópia no banco.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </details>
      <details className="sjCollapse">
        <summary><span className="sjChev">▸</span> Histórico de exclusões<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Histórico de exclusões</h3>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>🔄 Atualizar</button>
          </div>
          <p className="sjNota">Todo envio diário, projeção de marketing ou acesso apagado fica registrado aqui — quem apagou, quando, e o que era. Só exclusões. Pra ver TODA ação (criar/editar/apagar) de qualquer área, use o &quot;Log de auditoria&quot; na aba Histórico Sistema.</p>
          <div className="sjTableInner">
            <table>
              <thead><tr><th>Quando</th><th>Quem apagou</th><th>Tipo</th><th>Referência</th><th>O que era</th></tr></thead>
              <tbody>
                {visiveis.length ? visiveis.map((e, i) => <tr key={`${e.deletedAt}-${i}`}><td>{quando(e.deletedAt)}</td><td>{e.deletedByEmail}</td><td>{e.kind}</td><td>{e.refDate ? fmtDate(e.refDate) : "—"}</td><td>{e.summary}</td></tr>) : <tr><td colSpan={5} className="sjMini">Nenhuma exclusão registrada.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="sjToolbar">
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" disabled={paginaAtual === 0} onClick={() => setPagina((p) => Math.max(0, p - 1))}>‹ Anterior</button>
            <span className="sjMini">{exclusoes.length ? `página ${paginaAtual + 1} de ${totalPaginas} • ${exclusoes.length} exclusão(ões)` : "—"}</span>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" disabled={paginaAtual >= totalPaginas - 1} onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}>Próxima ›</button>
            <label className="sjMini">Mostrar por página
              <select className="sjInput" value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(0); }}>
                {[6, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </section>
      </details>
      <section className="sjCard sjBloco">
        <p className="sjNota"><b>Acesso:</b> ninguém vê nada sem entrar com e-mail e senha. Cada pessoa edita a área dela e envia o registro do dia, mas só o administrador do BI vê a seção de salário/elegibilidade de bônus e a coluna de bônus projetado da Diretoria. Os acessos são criados pelo administrador no painel, na seção &quot;Criar ou redefinir acesso ao BI&quot;.</p>
      </section>
    </>
  );
}
