"use client";

import { useMemo, useRef, useState } from "react";
import { chamarBi, payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { MkReuniaoItem, MkReunioesResp } from "./espelhoTipos";

type Tipo = MkReuniaoItem["tipo"];
type Status = MkReuniaoItem["status"];
type Prioridade = MkReuniaoItem["prioridade"];
type FiltroStatus = "" | Status | "atrasado" | "todos";

type Item = {
  id: string;
  tipo: Tipo;
  data: string;
  titulo: string;
  descricao: string;
  participantes: string;
  decisoes: string;
  responsavel: string;
  prazo: string;
  prioridade: Prioridade;
  status: Status;
  reuniaoId: string;
  observacao: string;
};

function doEspelho(item: MkReuniaoItem): Item {
  return {
    id: item.id, tipo: item.tipo, data: item.dataReuniao || "", titulo: item.titulo || "", descricao: item.descricao || "",
    participantes: item.participantes || "", decisoes: item.decisoes || "", responsavel: item.responsavel || "", prazo: item.prazo || "",
    prioridade: item.prioridade || "media", status: item.status || "aberto", reuniaoId: item.reuniaoId || "", observacao: item.observacao || "",
  };
}

function paraPlanilha(item: Item) {
  return {
    id: item.id || undefined, tipo: item.tipo, titulo: item.titulo, descricao: item.descricao, dataReuniao: item.data,
    participantes: item.participantes, decisoes: item.decisoes, responsavel: item.responsavel, prazo: item.prazo,
    prioridade: item.prioridade, status: item.status, reuniaoId: item.reuniaoId, observacao: item.observacao,
  };
}

const TIPO: Record<Tipo, string> = { demanda: "Demanda", pauta: "Pauta", ata: "Ata" };
const STATUS: Record<Status, string> = { aberto: "Aberto", andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado" };
const PRIO: Record<Prioridade, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function somarDias(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function dataCurta(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function vazio(): Item {
  return {
    id: "", tipo: "demanda", data: hojeSp(), titulo: "", descricao: "", participantes: "", decisoes: "",
    responsavel: "", prazo: "", prioridade: "media", status: "aberto", reuniaoId: "", observacao: "",
  };
}

function pendente(item: Item) {
  return item.status === "aberto" || item.status === "andamento";
}

function atrasada(item: Item, hoje: string) {
  return item.tipo === "demanda" && item.status !== "concluido" && item.status !== "cancelado" && Boolean(item.prazo) && item.prazo < hoje;
}

export function MarketingDemandasPainel({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const hoje = hojeSp();
  const limite = somarDias(hoje, 7);
  const formRef = useRef<HTMLDetailsElement>(null);
  const itens = useMemo(() => (payloadDe<MkReunioesResp>(dados, "getMkReunioes")?.items ?? []).map(doEspelho), [dados]);
  const [form, setForm] = useState<Item>(vazio);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"" | Tipo>("");
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("");
  const demandas = itens.filter((item) => item.tipo === "demanda");
  const aberto = demandas.filter((item) => item.status === "aberto").length;
  const andamento = demandas.filter((item) => item.status === "andamento").length;
  const atrasadas = demandas.filter((item) => atrasada(item, hoje)).length;
  const semana = demandas.filter((item) => pendente(item) && item.prazo >= hoje && item.prazo <= limite).length;
  const concluidas = demandas.filter((item) => item.status === "concluido").length;
  const responsaveis = useMemo(
    () => [...new Set(itens.map((item) => item.responsavel.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [itens],
  );
  const reunioes = itens.filter((item) => item.tipo !== "demanda");
  const porResp = useMemo(() => quadro(itens.filter((item) => item.tipo === "demanda"), hoje), [itens, hoje]);
  const visiveis = useMemo(() => itens.filter((item) => passa(item, filtroTipo, filtroResp, filtroStatus, hoje)).sort((a, b) => (a.prazo || "9999-99-99").localeCompare(b.prazo || "9999-99-99")), [itens, filtroTipo, filtroResp, filtroStatus, hoje]);
  const ehDemanda = form.tipo === "demanda";

  function campo<K extends keyof Item>(chave: K, valor: Item[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function gravar(item: Item, mensagem: string) {
    setOcupado(true);
    setAviso("Salvando…");
    const r = await chamarBi("/api/bi/justino/marketing/demandas", paraPlanilha(item));
    setOcupado(false);
    if (!r.ok) {
      setAviso(r.status === 403 ? "Sem permissão para salvar." : "Não consegui salvar.");
      return false;
    }
    setAviso(mensagem);
    onSalvo();
    return true;
  }

  async function salvar() {
    const titulo = form.titulo.trim();
    if (!titulo) {
      setAviso("Informe o título.");
      return;
    }
    const item: Item = {
      ...form,
      titulo,
      descricao: form.descricao.trim(),
      participantes: ehDemanda ? "" : form.participantes.trim(),
      decisoes: form.tipo === "ata" ? form.decisoes.trim() : "",
      responsavel: form.responsavel.trim(),
      reuniaoId: ehDemanda ? form.reuniaoId : "",
      observacao: form.observacao.trim(),
    };
    if (await gravar(item, "Salvo.")) setForm(vazio());
  }

  async function concluir(item: Item) {
    await gravar({ ...item, status: "concluido" }, "Demanda concluída.");
  }

  async function apagar(item: Item) {
    if (!window.confirm("Apagar este item? Fica registrado no histórico de exclusões da Diretoria.")) return;
    setOcupado(true);
    const r = await chamarBi("/api/bi/justino/marketing/demandas/apagar", { id: item.id });
    setOcupado(false);
    setAviso(r.ok ? "Item apagado." : "Não consegui apagar.");
    if (r.ok) onSalvo();
  }

  function editar(item: Item) {
    setForm({ ...item });
    setAviso("");
    if (formRef.current) formRef.current.open = true;
  }

  return (
    <>
      <section className="sjCard sjBloco">
        <p className="sjNote"><b>Reuniões e demandas • Marketing</b> — registre pautas e atas das reuniões e as demandas que saem delas, com responsável e prazo. Uma demanda pode ser ligada à pauta/ata de onde nasceu.</p>
      </section>
      <div className="sjMkKpis">
        <article className="sjCard"><small>Demandas em aberto</small><div className="v">{aberto}</div></article>
        <article className="sjCard"><small>Em andamento</small><div className="v">{andamento}</div></article>
        <article className="sjCard" title="Não concluídas e com prazo já vencido."><small>Atrasadas</small><div className="v">{atrasadas}</div></article>
        <article className="sjCard"><small>Vencem em 7 dias</small><div className="v">{semana}</div></article>
        <article className="sjCard"><small>Concluídas</small><div className="v">{concluidas}</div></article>
      </div>
      <details className="sjCollapse" ref={formRef}>
        <summary><span className="sjChev">▸</span>{form.id ? "Editar item" : "+ Nova demanda / pauta / ata"}<span className="sjHint">clique para abrir</span></summary>
        <div className="sjCard sjBloco sjCollapseBody">
          <div className="sjToolbar">
            <div className="sjTb"><label>Tipo<select className="sjInput" value={form.tipo} onChange={(evento) => campo("tipo", evento.target.value as Tipo)}><option value="demanda">Demanda</option><option value="pauta">Pauta de reunião</option><option value="ata">Ata de reunião</option></select></label></div>
            <div className="sjTb"><label>{ehDemanda ? "Data de abertura" : "Data da reunião"}<input className="sjInput" type="date" value={form.data} onChange={(evento) => campo("data", evento.target.value)} /></label></div>
            <div className="sjTb"><label>Responsável<input className="sjInput" list="sjMkResponsaveis" placeholder="Quem responde pelo prazo" value={form.responsavel} onChange={(evento) => campo("responsavel", evento.target.value)} /></label></div>
            <div className="sjTb"><label>Prazo<input className="sjInput" type="date" value={form.prazo} onChange={(evento) => campo("prazo", evento.target.value)} /></label></div>
            <div className="sjTb"><label>Prioridade<select className="sjInput" value={form.prioridade} onChange={(evento) => campo("prioridade", evento.target.value as Prioridade)}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label></div>
            <div className="sjTb"><label>Status<select className="sjInput" value={form.status} onChange={(evento) => campo("status", evento.target.value as Status)}><option value="aberto">Aberto</option><option value="andamento">Em andamento</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></label></div>
            {ehDemanda ? <div className="sjTb"><label>Nasceu de qual reunião?<select className="sjInput" value={form.reuniaoId} onChange={(evento) => campo("reuniaoId", evento.target.value)}><option value="">— nenhuma —</option>{reunioes.map((item) => <option key={item.id} value={item.id}>{TIPO[item.tipo]} • {dataCurta(item.data)} • {item.titulo}</option>)}</select></label></div> : null}
          </div>
          <datalist id="sjMkResponsaveis">{responsaveis.map((nome) => <option key={nome} value={nome} />)}</datalist>
          <label className="sjFormBloco"><b>Título</b><input className="sjInput" placeholder="ex.: Calendário de conteúdo de novembro" value={form.titulo} onChange={(evento) => campo("titulo", evento.target.value)} /></label>
          <label className="sjFormBloco"><b>Descrição / pontos da pauta</b><textarea className="sjInput" rows={3} value={form.descricao} onChange={(evento) => campo("descricao", evento.target.value)} /></label>
          {ehDemanda ? null : <label className="sjFormBloco"><b>Participantes</b><input className="sjInput" placeholder="Opcional — nomes separados por vírgula" value={form.participantes} onChange={(evento) => campo("participantes", evento.target.value)} /></label>}
          {form.tipo === "ata" ? <label className="sjFormBloco"><b>Decisões e encaminhamentos</b><textarea className="sjInput" rows={3} placeholder="O que foi decidido na reunião" value={form.decisoes} onChange={(evento) => campo("decisoes", evento.target.value)} /></label> : null}
          <label className="sjFormBloco"><b>Observação</b><textarea className="sjInput" rows={2} value={form.observacao} onChange={(evento) => campo("observacao", evento.target.value)} /></label>
          <div className="sjToolbar">
            <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void salvar(); }}>Salvar</button>
            {form.id ? <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={() => { setForm(vazio()); setAviso(""); }}>Cancelar edição</button> : null}
            <span className="sjMini" role="status">{aviso}</span>
          </div>
        </div>
      </details>
      <details className="sjCollapse" open>
        <summary><span className="sjChev">▸</span>Demandas por responsável<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <h3>Demandas por responsável</h3>
          <div className="sjTableInner"><table>
            <thead><tr><th scope="col">Responsável</th><th scope="col">Em aberto</th><th scope="col">Em andamento</th><th scope="col">Atrasadas</th><th scope="col">Próximo prazo</th><th scope="col">Concluídas</th></tr></thead>
            <tbody>
              {porResp.length ? porResp.map((linha) => (
                <tr key={linha.nome}><td>{linha.nome}</td><td>{linha.aberto}</td><td>{linha.andamento}</td><td>{linha.atrasadas ? <span className="sjBadgeR">{linha.atrasadas}</span> : 0}</td><td>{linha.prazo ? dataCurta(linha.prazo) : "—"}</td><td>{linha.concluidas}</td></tr>
              )) : <tr><td colSpan={6}>Nenhuma demanda cadastrada ainda.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </details>
      <details className="sjCollapse" open>
        <summary><span className="sjChev">▸</span>Demandas, pautas e atas<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Demandas, pautas e atas</h3>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
          </div>
          <div className="sjToolbar">
            <div className="sjTb"><label>Tipo<select className="sjInput" value={filtroTipo} onChange={(evento) => setFiltroTipo(evento.target.value as "" | Tipo)}><option value="">Todos</option><option value="demanda">Demandas</option><option value="pauta">Pautas</option><option value="ata">Atas</option></select></label></div>
            <div className="sjTb"><label>Responsável<select className="sjInput" value={filtroResp} onChange={(evento) => setFiltroResp(evento.target.value)}><option value="">Todos</option>{responsaveis.map((nome) => <option key={nome} value={nome}>{nome}</option>)}</select></label></div>
            <div className="sjTb"><label>Status<select className="sjInput" value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value as FiltroStatus)}><option value="">Pendentes (sem concluídas)</option><option value="aberto">Aberto</option><option value="andamento">Em andamento</option><option value="atrasado">Atrasado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option><option value="todos">Todos</option></select></label></div>
          </div>
          <div className="sjTableInner"><table>
            <thead><tr><th scope="col">Tipo</th><th scope="col">Data</th><th scope="col">Título</th><th scope="col">Responsável</th><th scope="col">Prazo</th><th scope="col">Prioridade</th><th scope="col">Status</th><th scope="col">Ação</th></tr></thead>
            <tbody>
              {visiveis.length ? visiveis.map((item) => {
                const origem = reunioes.find((reuniao) => reuniao.id === item.reuniaoId);
                const tarde = atrasada(item, hoje);
                return (
                  <tr key={item.id}>
                    <td>{TIPO[item.tipo]}</td>
                    <td>{dataCurta(item.data)}</td>
                    <td>
                      <b>{item.titulo}</b>
                      {item.descricao ? <p className="sjMini">{item.descricao}</p> : null}
                      {item.decisoes ? <p className="sjMini sjMkOk">✔ {item.decisoes}</p> : null}
                      {item.participantes ? <p className="sjMini">👥 {item.participantes}</p> : null}
                      {origem ? <p className="sjMini">↳ de: {origem.titulo}</p> : null}
                    </td>
                    <td>{item.responsavel || "—"}</td>
                    <td>{item.prazo ? dataCurta(item.prazo) : "—"}</td>
                    <td><span className={item.prioridade === "alta" ? "sjBadgeR" : "sjBadge"}>{PRIO[item.prioridade]}</span></td>
                    <td>{tarde ? <span className="sjBadgeR">Atrasada</span> : <span className={item.status === "concluido" ? "sjBadgeG" : item.status === "andamento" ? "sjBadgeY" : item.status === "cancelado" ? "sjBadgeR" : "sjBadge"}>{STATUS[item.status]}</span>}</td>
                    <td>
                      {item.tipo === "demanda" && pendente(item) ? <button type="button" className="sjAnaliseBtn" style={{ background: "#1e5b3e" }} disabled={ocupado} onClick={() => { void concluir(item); }}>✓ Concluir</button> : null}
                      <button type="button" className="sjAnaliseBtn" onClick={() => editar(item)}>Editar</button>
                      <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} disabled={ocupado} onClick={() => { void apagar(item); }}>Apagar</button>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={8}>Nada por aqui.</td></tr>}
            </tbody>
          </table></div>
        </section>
      </details>
    </>
  );
}

function passa(item: Item, tipo: string, resp: string, status: FiltroStatus, hoje: string) {
  if (tipo && item.tipo !== tipo) return false;
  if (resp && item.responsavel.trim() !== resp) return false;
  if (status === "todos") return true;
  if (status === "atrasado") return atrasada(item, hoje);
  if (status) return item.status === status;
  return item.status !== "concluido" && item.status !== "cancelado";
}

function quadro(demandas: Item[], hoje: string) {
  const nomes = [...new Set(demandas.map((item) => item.responsavel.trim() || "(sem responsável)"))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return nomes.map((nome) => {
    const meus = demandas.filter((item) => (item.responsavel.trim() || "(sem responsável)") === nome);
    const prazos = meus.filter((item) => pendente(item) && item.prazo).map((item) => item.prazo).sort();
    return {
      nome,
      aberto: meus.filter((item) => item.status === "aberto").length,
      andamento: meus.filter((item) => item.status === "andamento").length,
      atrasadas: meus.filter((item) => atrasada(item, hoje)).length,
      prazo: prazos[0] || "",
      concluidas: meus.filter((item) => item.status === "concluido").length,
    };
  });
}
