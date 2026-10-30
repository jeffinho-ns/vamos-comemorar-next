/** MESMA avaliação de crmCfgAvalia()/crmNota() do painel do Renato (Saúde do atendimento por IA). */

export type Semaforo = "r" | "y" | "g";
export interface ItemSaude { id: string; t: string; v: string; e: Semaforo; meta: string; acao: string; tip: string }

type Cfg = Record<string, unknown>;
const CRM_NOTA_PESOS: Record<string, number> = { ia: 3, regras: 2, followup: 2, humano: 2, travados: 2 };

const N = (x: unknown): number | null => (x == null || x === "" || Number.isNaN(Number(x)) ? null : Number(x));
const B = (x: unknown): boolean | null => (typeof x === "boolean" ? x : null);
const sn = (b: boolean | null) => (b === true ? "sim" : b === false ? "não" : "?");
const dm = (d: unknown) => (d ? `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}` : "");

export function crmNota(L: ItemSaude[]) {
  let ponto = 0;
  let max = 0;
  let lidos = 0;
  L.forEach((x) => {
    if (/^não lido/i.test(x.v)) return;
    const w = CRM_NOTA_PESOS[x.id] || 1;
    max += w; lidos += 1; ponto += w * (x.e === "g" ? 1 : x.e === "y" ? 0.5 : 0);
  });
  return { nota: max ? Math.round((ponto / max) * 100) : null, lidos, total: L.length };
}

export function crmCfgAvalia(c: Cfg, cap: number | null): ItemSaude[] {
  const L: ItemSaude[] = [];
  const hora = cap ? new Date(cap).getHours() : 12;
  const ev = c.ultimoEventoWhatsapp as { acao?: string; data?: string; hora?: string; quem?: string } | undefined;
  const quem = ev ? ` • último evento: ${ev.acao === "ativou a IA" ? "ativada" : "desativada"} ${dm(ev.data)} ${ev.hora} por ${ev.quem}` : "";
  const ia = B(c.iaWhatsappLigada);
  L.push({ id: "ia", t: "IA no WhatsApp", v: ia == null ? "não lido" : `${ia ? "Ligada" : "DESLIGADA"}${quem}`, e: ia == null ? "y" : ia ? "g" : hora >= 9 && hora <= 21 ? "r" : "y", meta: "ligada o dia todo",
    acao: "Religar a IA no WhatsApp e deixar o \"Chamar humano\" configurado, em vez de ligar/desligar à mão. Se houver erro de resposta, corrigir a regra e testar em \"Testes da IA\".",
    tip: `Se a IA do WhatsApp está desligada, todo cliente cai direto na fila de atendimento humano. Desligada em horário comercial = conversas esperando atendente = reservas perdidas. Instagram: ${B(c.iaInstagramLigada) == null ? "não lido" : B(c.iaInstagramLigada) ? "ligada" : "desligada"}.` });
  const rc = N(c.regrasChars);
  L.push({ id: "regras", t: "Regras de comportamento da IA", v: rc == null ? (c.regrasExcedem ? "acima de 1.500 caracteres" : "dentro do limite") : `${rc.toLocaleString("pt-BR")} / 1.500 caracteres`, e: (rc != null && rc > 1500) || Boolean(c.regrasExcedem) ? "r" : rc == null ? "y" : "g", meta: "até 1.500 caracteres",
    acao: "Reescrever em ≤1.500 caracteres (frases curtas, uma ideia por linha), testar em \"Testes da IA\" e só então salvar.", tip: "As \"regras de comportamento\" são as instruções permanentes da assistente. O Dionísio só salva se couber em 1.500 caracteres." });
  const ed = N(c.edicoes30d);
  const edp = N(c.editores30d);
  L.push({ id: "edicoes", t: "Mudanças nas regras da IA (30 dias)", v: ed == null ? "não lido" : `${ed} edições por ${edp == null ? "?" : edp} pessoa(s)`, e: ed == null ? "y" : ed <= 8 ? "g" : ed <= 15 ? "y" : "r", meta: "até 8 por mês, com um responsável",
    acao: "Definir uma pessoa que aprova as mudanças, guardar a versão anterior e testar antes de salvar.", tip: "Muitas edições por muitas pessoas, sem teste, fazem a IA mudar de comportamento de um dia para o outro." });
  const fi = Array.isArray(c.followUpIntervalos) ? (c.followUpIntervalos as number[]) : [];
  const fu = B(c.followUpLigado);
  L.push({ id: "followup", t: "Follow-up automático (cliente que parou de responder)", v: fu == null ? "não lido" : fu ? `Ligado • ${fi.length ? `intervalos: ${fi.join(", ")} min` : "SEM intervalo configurado (0)"}` : "Desligado", e: fu == null ? "y" : fu ? (fi.length >= 2 ? "g" : fi.length === 1 ? "y" : "r") : "y", meta: "ligado com 2 ou mais intervalos (ex.: 15 min, 2 h, fim do dia)",
    acao: "Em Configuração de IA → Follow-up, informar os intervalos (ex.: 15, 120 e 600 min) e desligar só para Saudações.", tip: "Follow-up é a IA retomando sozinha quem parou de responder. Se o intervalo está em 0 ele nunca dispara." });
  const hs = [B(c.humanoGrupoGrande), B(c.humanoSemMesas), B(c.humanoForaPrazo)];
  const hn = hs.filter((x) => x === true).length;
  L.push({ id: "humano", t: "Chamar humano quando…", v: hs.every((x) => x == null) ? "não lido" : `grupo grande: ${sn(hs[0])} • sem mesas: ${sn(hs[1])} • fora do prazo: ${sn(hs[2])}`, e: hs.every((x) => x == null) ? "y" : hn === 3 ? "g" : hn > 0 ? "y" : "r", meta: "os 3 ligados",
    acao: "Ligar os três em Configuração de IA → Comportamento. Grupos de 20+ pessoas (25% de cancelamento) devem ir direto para uma pessoa.", tip: "Regras que encaminham a conversa para uma pessoa nos casos de risco." });
  const mf = B(c.msgForaHorarioHumano);
  L.push({ id: "foraHorario", t: "Mensagem fora do horário do atendimento humano", v: mf == null ? "não lido" : mf ? "Ligada" : "Desligada", e: mf == null ? "y" : mf ? "g" : "y", meta: "ligada, informando horário e prazo",
    acao: "Ligar e escrever \"Atendemos de ... às ...; respondemos em até ... minutos\".", tip: "Quando o cliente pede uma pessoa fora do horário, ele deve saber quando será atendido." });
  const ih = N(c.inatividadeHoras);
  L.push({ id: "inatividade", t: "Tempo limite do atendimento humano", v: ih == null ? "não lido" : `${ih} h sem mensagem encerra o atendimento`, e: ih == null ? "y" : ih >= 3 ? "g" : ih >= 2 ? "y" : "r", meta: "3 a 4 horas",
    acao: "Em Configuração de IA → Comportamento, aumentar o tempo limite de inatividade para 3–4 h.", tip: "Depois desse tempo sem mensagens, o atendimento humano é encerrado automaticamente." });
  const sac = (c.sac as Cfg | undefined) || {};
  const tr = N(sac.ativosMais24h);
  L.push({ id: "travados", t: "Atendimentos humanos travados há mais de 24 h", v: tr == null ? "não lido" : `${tr} travado(s) • ${N(sac.ativos) == null ? "?" : String(sac.ativos)} ativos no total`, e: tr == null ? "y" : tr === 0 ? "g" : tr <= 5 ? "y" : "r", meta: "0",
    acao: "Abrir a lista de atendimentos ativos antigos, responder ou encerrar cada um.", tip: "Enquanto estiver em atendimento humano, a IA não responde." });
  const lt = N(sac.emLotePct);
  L.push({ id: "lote", t: "Atendimentos humanos encerrados em lote (na hora cheia)", v: lt == null ? "não lido" : `${lt}% • mediana ${N(sac.medianaMin) == null ? "?" : String(sac.medianaMin)} min`, e: lt == null ? "y" : lt < 30 ? "g" : lt < 60 ? "y" : "r", meta: "abaixo de 30%",
    acao: "Aumentar o tempo limite (item acima) e fechar atendimentos por resolução, não por tempo.", tip: "Quando a maioria dos atendimentos termina junta, na hora cheia, quem fecha é o relógio do sistema." });
  const r24 = N(sac.reaberturas24h);
  const rb = N(sac.reaberturas);
  const rp = r24 != null && rb != null && rb > 0 ? Math.round((r24 / rb) * 100) : null;
  L.push({ id: "reab", t: "Cliente volta em menos de 24 h", v: rp == null ? "não lido" : `${rp}% das reaberturas (${r24} de ${rb}) • ${N(sac.conversasCom3Mais) || 0} conversas voltaram 3+ vezes`, e: rp == null ? "y" : rp < 25 ? "g" : rp < 45 ? "y" : "r", meta: "abaixo de 25%",
    acao: "Ler as conversas que mais voltam, achar a pergunta que não foi resolvida e colocar a resposta na base da IA.", tip: "Quando o mesmo cliente abre outro atendimento no mesmo dia, o assunto anterior não foi resolvido." });
  const au = (c.disparosAudiencias as Record<string, number> | undefined) || {};
  const aut = Object.keys(au).filter((k) => au[k] > 0).map((k) => `${k} ~${au[k]}`).join(" • ");
  const dp = B(c.disparosPausados);
  L.push({ id: "disparos", t: "Disparos Inteligentes (mensagens automáticas)", v: dp == null ? "não lido" : `${dp ? "PAUSADOS" : "Ativos"}${aut ? ` • públicos prontos: ${aut}` : ""}`, e: dp == null ? "y" : dp ? "y" : "g", meta: "ativos para cancelados e aniversariantes",
    acao: `Ativar para "Cancelaram recentemente" e "Aniversariantes da semana" (custo máx. ~R$ ${String(c.disparosCustoMes || 240)}/mês) e medir reservas geradas.`, tip: "Pausados = clientes que poderiam voltar não recebem convite." });
  const pv = B(c.posVendaSemPerguntas);
  L.push({ id: "posvenda", t: "Pós-venda (SAC) com perguntas", v: pv == null ? "não lido" : pv ? "Nenhuma pergunta configurada" : "Perguntas configuradas", e: pv == null ? "y" : pv ? "y" : "g", meta: "ao menos 3 perguntas",
    acao: "Criar 3 perguntas curtas (atendimento, espera, o que faltou) e ler as respostas toda semana.", tip: "Sem perguntas, a casa não ouve o cliente que cancelou ou faltou." });
  const lr = B(c.linkReservasIA);
  L.push({ id: "linkRes", t: "Link de reservas na IA", v: lr == null ? "não lido" : lr ? "Configurado" : "NÃO configurado", e: lr == null ? "y" : lr ? "g" : "r", meta: "configurado",
    acao: "Em Configuração de IA → Links externos, cadastrar o link de reservas do portal (r.odionisio.com/seu-justino).", tip: "É o link que a IA manda para o cliente reservar sozinho." });
  const tc = N(c.clientesTotal);
  const nc = N(c.clientesComNascimento);
  const np = tc != null && tc > 0 && nc != null ? Math.round((nc / tc) * 1000) / 10 : null;
  L.push({ id: "nasc", t: "Clientes com data de nascimento", v: np == null ? "não lido" : `${(nc ?? 0).toLocaleString("pt-BR")} de ${(tc ?? 0).toLocaleString("pt-BR")} (${String(np).replace(".", ",")}%)`, e: np == null ? "y" : np >= 30 ? "g" : np >= 10 ? "y" : "r", meta: "30% ou mais",
    acao: "Pedir a data de nascimento na reserva (campo obrigatório) para alimentar os disparos de aniversário.", tip: "Sem a data de nascimento, o sistema não consegue avisar os aniversariantes da semana." });
  return L;
}

export interface TarefaPlano { sem: string; t: string; ok: boolean | null; parc: boolean; detalhe: string }

export function crmPlano(L: ItemSaude[]): TarefaPlano[] {
  const por: Record<string, ItemSaude> = {};
  L.forEach((x) => { por[x.id] = x; });
  const g = (id: string) => por[id]?.e === "g";
  const y = (id: string) => por[id]?.e === "y";
  const v = (id: string) => por[id]?.v ?? "";
  return [
    { sem: "Esta semana", t: "Religar a IA do WhatsApp o dia todo e ligar o \"Chamar humano quando…\"", ok: g("ia") && g("humano"), parc: g("ia") || g("humano") || y("humano"), detalhe: `Hoje: IA ${v("ia").split(" • ")[0]}; chamar humano: ${v("humano")}` },
    { sem: "Esta semana", t: "Reescrever as regras da IA em até 1.500 caracteres e testar em \"Testes da IA\"", ok: g("regras"), parc: false, detalhe: `Hoje: ${v("regras")}` },
    { sem: "Esta semana", t: "Configurar o follow-up (ex.: 15 min, 2 h e fim do dia)", ok: g("followup"), parc: y("followup"), detalhe: `Hoje: ${v("followup")}` },
    { sem: "Esta semana", t: "Cadastrar o link de reservas na IA", ok: g("linkRes"), parc: false, detalhe: `Hoje: ${v("linkRes")}` },
    { sem: "Esta semana", t: "Aumentar o tempo limite do atendimento humano para 3–4 h e destravar os atendimentos antigos", ok: g("inatividade") && g("travados"), parc: g("inatividade") || g("travados"), detalhe: `Hoje: limite ${v("inatividade").split(" sem")[0]}; ${v("travados").split(" • ")[0]}` },
    { sem: "Próximos 15 dias", t: "Preencher a base de informações da IA (área coberta, karaokê, ml do chopp, menores, mesa com cadeira, valores por horário)", ok: null, parc: false, detalhe: "Conferir à mão em Configuração de IA → Informações (o robô ainda não confere o conteúdo)." },
    { sem: "Próximos 15 dias", t: "Criar quebra-gelos novos: aniversário, programação do fim de semana, valores e entrada, grupos e eventos", ok: null, parc: false, detalhe: "Conferir à mão em Configuração de IA → Quebra-gelos." },
    { sem: "Próximos 15 dias", t: "Ativar os Disparos Inteligentes (cancelaram recentemente e aniversariantes)", ok: g("disparos"), parc: false, detalhe: `Hoje: ${v("disparos").split(" • ")[0]}` },
    { sem: "Próximos 15 dias", t: "Configurar as perguntas do Pós-venda e ler o NPS toda semana", ok: g("posvenda"), parc: false, detalhe: `Hoje: ${v("posvenda")}` },
    { sem: "Próximos 15 dias", t: "Pedir a data de nascimento na reserva (meta: 30% da base)", ok: g("nasc"), parc: y("nasc"), detalhe: `Hoje: ${v("nasc")}` },
  ];
}
