"use client";

import { useMemo, useState } from "react";
import { chamarBi } from "../usePlanilha";
import type { IgAtivacao, IgPost, IgRetornoResp } from "./espelhoTipos";
import { fmt1, fmtInt, IG_ATIV_TIPO_LABEL } from "./instagramCalculo";
import { Tabela } from "./MarketingInstagramUi";
import { hojeSp } from "./numeros";

const TIPOS = Object.entries(IG_ATIV_TIPO_LABEL);
const DIAS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

function dataCurta(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${DIAS[new Date(`${iso}T12:00:00`).getDay()]} ${dia}/${mes}/${ano}`;
}
function ddmm(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—";
}

type Form = { id: string; data: string; tipo: string; titulo: string; oferta: string; postId: string; observacao: string };
const vazio = (): Form => ({ id: "", data: hojeSp(), tipo: "reel", titulo: "", oferta: "", postId: "", observacao: "" });

/** Card "🗓️ Ativações do Instagram (o que foi executado)" — saveIgAtivacao / deleteIgAtivacao. */
export function MarketingInstagramAtivacoes({ itens, posts, onSalvo }: { itens: IgAtivacao[]; posts: IgPost[]; onSalvo: () => void }) {
  const [form, setForm] = useState<Form>(vazio);
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const opcoesPost = useMemo(() => {
    const ref = new Date(`${form.data || hojeSp()}T12:00:00`).getTime();
    return posts.filter((p) => Math.abs((new Date(`${p.date}T12:00:00`).getTime() - ref) / 86400000) <= 7).sort((a, b) => b.date.localeCompare(a.date));
  }, [posts, form.data]);

  function campo<K extends keyof Form>(chave: K, valor: Form[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar() {
    if (!form.data) return setStatus("Escolha a data.");
    if (!form.titulo.trim()) return setStatus("Dê um título à ação.");
    setOcupado(true);
    setStatus("Salvando…");
    const r = await chamarBi("/api/bi/justino/marketing/instagram/ativacao", { ...form, id: form.id || undefined, titulo: form.titulo.trim(), oferta: form.oferta.trim(), observacao: form.observacao.trim() });
    setOcupado(false);
    if (!r.ok) return setStatus(r.status === 403 ? "Sem permissão para salvar." : "Não consegui salvar a ação.");
    setStatus(form.id ? "Ação atualizada." : "Ação registrada.");
    setForm(vazio());
    onSalvo();
  }

  async function apagar(id: string) {
    if (!window.confirm("Apagar esta ação? As reservas já vinculadas a ela continuam, mas perdem o vínculo.")) return;
    setOcupado(true);
    const r = await chamarBi("/api/bi/justino/marketing/instagram/ativacao/apagar", { id });
    setOcupado(false);
    setStatus(r.ok ? "Ação apagada." : "Não consegui apagar.");
    if (r.ok) onSalvo();
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>🗓️ Ativações do Instagram (o que foi executado)</h3></div>
      <p className="sjMini">Registre cada ação (Reel de convite, Story de aniversário, promoção do dia…). É esse cadastro que permite ligar a ação às reservas que ela gerou.</p>
      <div className="sjMkGrade">
        <label className="sjMini">Data da ação<input className="sjInput" type="date" value={form.data} onChange={(e) => campo("data", e.target.value)} /></label>
        <label className="sjMini">Tipo
          <select className="sjInput" value={form.tipo} onChange={(e) => campo("tipo", e.target.value)}>
            {TIPOS.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </label>
        <label className="sjMini sjMkSpan2">Título<input className="sjInput" value={form.titulo} placeholder="Ex.: Reel de convite — chope pela metade na terça" onChange={(e) => campo("titulo", e.target.value)} /></label>
        <label className="sjMini">Oferta / gancho (opcional)<input className="sjInput" value={form.oferta} placeholder="Ex.: Open de chope R$ 69,90" onChange={(e) => campo("oferta", e.target.value)} /></label>
        <label className="sjMini sjMkSpan2">Post vinculado (opcional)
          <select className="sjInput" value={form.postId} onChange={(e) => campo("postId", e.target.value)}>
            <option value="">— sem post vinculado —</option>
            {opcoesPost.map((p) => <option key={p.id} value={p.id}>{ddmm(p.date)}{p.hora ? ` ${p.hora}` : ""} • {p.tipo} • {(p.legenda || "").slice(0, 40)}</option>)}
          </select>
        </label>
        <label className="sjMini sjMkSpan2">Observação (opcional)<input className="sjInput" value={form.observacao} placeholder="Palavra-chave, público-alvo, ajuste feito…" onChange={(e) => campo("observacao", e.target.value)} /></label>
      </div>
      <div className="sjMkAcoes">
        <button type="button" className="sjAnaliseBtn" style={{ background: "#8a4423" }} disabled={ocupado} onClick={() => { void salvar(); }}>{form.id ? "Salvar edição" : "Registrar ação"}</button>
        {form.id ? <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={() => { setForm(vazio()); setStatus(""); }}>Cancelar edição</button> : null}
        {status ? <span className="sjMini" role="status">{status}</span> : null}
      </div>
      {itens.length ? (
        <Tabela
          colunas={["Data", "Tipo", "Ação", "Ações"]}
          linhas={itens.slice(0, 30).map((a) => [
            dataCurta(a.data),
            IG_ATIV_TIPO_LABEL[a.tipo] || a.tipo,
            <span key={a.id}><b>{a.titulo}</b>{a.oferta ? <><br /><span className="sjMini">{a.oferta}</span></> : null}</span>,
            <span key={`${a.id}-acoes`} style={{ whiteSpace: "nowrap" }}>
              <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={() => { setForm({ id: a.id, data: a.data, tipo: a.tipo, titulo: a.titulo, oferta: a.oferta || "", postId: a.postId || "", observacao: a.observacao || "" }); setStatus("Editando ação — altere e clique em \"Salvar edição\"."); }}>Editar</button>{" "}
              <button type="button" className="sjAnaliseBtn sjMkGrafBtn" style={{ background: "#3a1620" }} disabled={ocupado} onClick={() => { void apagar(a.id); }}>Apagar</button>
            </span>,
          ])}
        />
      ) : <p className="sjMini">Nenhuma ação registrada ainda.</p>}
    </section>
  );
}

/** Card "💰 Retorno em reservas por ação" (igRenderRetorno). */
export function MarketingInstagramRetorno({ retorno, onSalvo }: { retorno: IgRetornoResp | null; onSalvo: () => void }) {
  const R = retorno && retorno.ok ? retorno : null;
  const items = R?.items ?? [];
  const semanas = R?.semanas ?? [];
  const c = R?.cobertura30 ?? { total: 0, comOrigem: 0 };
  const pc = c.total ? Math.round((c.comOrigem / c.total) * 100) : null;
  const mx = Math.max(1, ...semanas.map((x) => x.total));
  const tipos = [...(R?.porTipo ?? [])].sort((a, b) => (b.diretas - a.diretas) || (b.ganhoSoma - a.ganhoSoma));
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>💰 Retorno em reservas por ação</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      {!R ? <p className="sjMini">Não consegui carregar o retorno agora (precisa da área Marketing).</p> : (
        <>
          <p className="sjMini">{items.length ? `${items.length} ação(ões) registrada(s).` : "Nenhuma ação registrada ainda. Cadastre em \"Ativações do Instagram\" acima."}</p>
          {c.total ? (
            <p className="sjNote" style={{ borderLeftColor: pc != null && pc >= 80 ? "var(--green)" : pc != null && pc >= 40 ? "var(--yellow)" : "var(--red)" }}>
              <b>Cobertura da origem:</b> {c.comOrigem} de {c.total} reservas dos últimos 30 dias têm origem informada ({pc}%). {pc != null && pc >= 80 ? "Boa base para decidir." : "Abaixo de 80% o retorno do Instagram fica subestimado: peça ao time para marcar a origem em toda reserva."}
            </p>
          ) : <p className="sjMini">Sem reservas lançadas nos últimos 30 dias.</p>}
          <Tabela
            colunas={["Semana", "Reservas lançadas", "Com origem", "Instagram"]}
            linhas={semanas.map((x) => [
              ddmm(x.semana),
              <span key={x.semana} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ height: 8, width: Math.round((x.total / mx) * 120), background: "#c96736", borderRadius: 4 }} /><b>{x.total}</b></span>,
              x.informadas,
              <b key={`${x.semana}-ig`}>{x.instagram}</b>,
            ])}
          />
          {items.length ? (
            <>
              <h4 className="sjMkH4">Por ação</h4>
              <Tabela
                colunas={["Data", "Ação", "Post", "Diretas", "Janela 4 dias", "Normal", "Ganho"]}
                linhas={items.map((i) => {
                  const ganho = i.base && !i.emAndamento ? i.janela.n - i.base.n : null;
                  return [
                    dataCurta(i.data),
                    <span key={i.id}><b>{i.titulo}</b><br /><span className="sjMini">{IG_ATIV_TIPO_LABEL[i.tipo] || i.tipo}{i.oferta ? ` • ${i.oferta}` : ""}</span></span>,
                    i.post ? <span key={`${i.id}-post`}>{i.post.permalink ? <a href={i.post.permalink} target="_blank" rel="noopener noreferrer">{i.post.tipo}{i.post.hora ? ` ${i.post.hora}` : ""}</a> : `${i.post.tipo}${i.post.hora ? ` ${i.post.hora}` : ""}`}{i.post.reach != null ? <><br /><span className="sjMini">alcance {fmtInt(i.post.reach)}</span></> : null}</span> : <span key={`${i.id}-post`} className="sjMini">—</span>,
                    <span key={`${i.id}-d`}><b>{i.diretas.n}</b><br /><span className="sjMini">{i.diretas.pax} pax</span></span>,
                    <span key={`${i.id}-j`}>{i.janela.n}<br /><span className="sjMini">{i.janela.pax} pax</span></span>,
                    i.base ? <span key={`${i.id}-b`}>{fmt1(i.base.n)}<br /><span className="sjMini">média de {i.base.semanas} sem.</span></span> : <span key={`${i.id}-b`} className="sjMini">sem base</span>,
                    <b key={`${i.id}-g`} className={ganho == null ? "" : ganho > 0 ? "sjPos" : ganho < 0 ? "sjNeg" : ""}>{i.emAndamento ? <span className="sjMini">em andamento</span> : ganho == null ? "—" : `${ganho > 0 ? "+" : ""}${fmt1(ganho)}`}</b>,
                  ];
                })}
              />
              <h4 className="sjMkH4">Ranking por tipo de ação</h4>
              <Tabela
                colunas={["Tipo", "Ações", "Reservas diretas", "Diretas por ação", "Ganho médio na janela"]}
                linhas={tipos.map((t) => [
                  <b key={t.tipo}>{IG_ATIV_TIPO_LABEL[t.tipo] || t.tipo}</b>,
                  t.acoes,
                  t.diretas,
                  fmt1(t.acoes ? t.diretas / t.acoes : 0),
                  t.ganhoN ? `${t.ganhoSoma / t.ganhoN > 0 ? "+" : ""}${fmt1(t.ganhoSoma / t.ganhoN)} (${t.ganhoN} ação(ões))` : <span key={`${t.tipo}-sb`} className="sjMini">sem base</span>,
                ])}
              />
            </>
          ) : null}
        </>
      )}
      <p className="sjMini"><b>Como ler:</b> <b>Diretas</b> são reservas lançadas com origem Instagram ligada à ação — é a medida confiável. <b>Janela</b> são as reservas lançadas no dia da ação e nos 3 seguintes, contra a média das mesmas janelas nas 4 semanas anteriores (sem outra ação no meio); isso é <b>correlação, não prova</b>. Reservas lançadas em lote pela grade semanal ficam fora da janela. Decisões fortes só com 4 a 6 semanas de dados.</p>
    </section>
  );
}
