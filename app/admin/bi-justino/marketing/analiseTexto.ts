import { reais, regressao } from "./numeros";

/** Mesmos textos do botão "📊 Análise do gráfico" do painel do Renato (analiseLinhas / analiseBarras / analisePadraoSemana / analiseHorario). */

export const NOTA_ANALISE = "Leitura automática dos números do gráfico (regressão linear e médias). Indica o rumo dos dados, não é previsão.";

export interface SerieAnalise { name: string; values: number[]; dash?: boolean }

function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0;
}

export function pct(valor: number) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

export function comSinal(valor: number) {
  return `${valor >= 0 ? "+" : ""}${pct(valor)}`;
}

export function analiseLinhas(labels: string[], series: SerieAnalise[]): string[] {
  const ss = series.filter((serie) => !serie.dash && serie.values.length >= 2);
  const n = labels.length;
  if (!ss.length || n < 4) return ["Poucos pontos no gráfico pra tirar uma tendência confiável."];
  const blocos = ss.map((serie) => {
    const vals = serie.values.map((valor) => Number(valor) || 0);
    const reg = regressao(vals);
    const ini = reg.fit[0];
    const fim = reg.fit[n - 1];
    const varPct = ((fim - ini) / Math.max(1, Math.abs(ini))) * 100;
    const dir = Math.abs(varPct) < 3 ? "estável" : varPct > 0 ? "em alta" : "em queda";
    const emoji = dir === "estável" ? "➡️" : varPct > 0 ? "📈" : "📉";
    const k = n >= 21 ? 7 : Math.min(4, Math.floor(n / 2));
    const ult = media(vals.slice(-k));
    const ant = media(vals.slice(-2 * k, -k));
    const dUlt = ant ? ((ult - ant) / ant) * 100 : 0;
    const mean = media(vals);
    const sd = Math.sqrt(media(vals.map((valor) => (valor - mean) ** 2)));
    const cv = mean ? (sd / Math.abs(mean)) * 100 : 0;
    const oscil = cv < 10 ? "baixa" : cv < 25 ? "moderada" : "alta";
    let iMax = 0;
    let iMin = 0;
    vals.forEach((valor, indice) => {
      if (valor > vals[iMax]) iMax = indice;
      if (valor < vals[iMin]) iMin = indice;
    });
    const last = vals[n - 1];
    const vsMed = mean ? ((last - mean) / Math.abs(mean)) * 100 : 0;
    const forca = reg.r2 >= 0.5 ? "tendência clara" : reg.r2 >= 0.2 ? "tendência moderada" : "tendência fraca";
    return `${emoji} ${serie.name} — ${dir} (${forca}, R² ${reg.r2.toFixed(2)}). Linha de tendência: de ${reais(ini)} a ${reais(fim)} (${comSinal(varPct)} no período, ${reg.slope >= 0 ? "+" : ""}${reais(reg.slope)} por ponto). Últimos ${k} pontos: média ${reais(ult)} (${comSinal(dUlt)} vs os ${k} anteriores, média ${reais(ant)}). Maior: ${reais(vals[iMax])} (${labels[iMax]}) • Menor: ${reais(vals[iMin])} (${labels[iMin]}) • Média: ${reais(mean)}. Último valor ${reais(last)} está ${comSinal(vsMed)} da média. Oscilação ${oscil} (variação de ${cv.toFixed(0)}% em torno da média).`;
  });
  if (ss.length === 2) {
    const a = ss[0].values.map(Number);
    const b = ss[1].values.map(Number);
    const ma = media(a);
    const mb = media(b);
    let sab = 0;
    let saa = 0;
    let sbb = 0;
    a.forEach((x, indice) => {
      sab += (x - ma) * (b[indice] - mb);
      saa += (x - ma) ** 2;
      sbb += (b[indice] - mb) ** 2;
    });
    const corr = saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
    const leit = Math.abs(corr) >= 0.7 ? "andam bem juntas" : Math.abs(corr) >= 0.4 ? "têm relação moderada" : "quase não se relacionam";
    blocos.push(`🔗 Relação entre as duas séries: correlação ${corr.toFixed(2)} — ${ss[0].name} e ${ss[1].name} ${leit}${ma ? `; no último ponto, ${ss[1].name} representa ${pct((b[n - 1] / Math.max(1, a[n - 1])) * 100)} de ${ss[0].name}.` : "."}`);
  }
  return blocos;
}

export function analiseBarras(items: { label: string; value: number }[]): string[] {
  const it = items.filter((item) => Number(item.value) > 0).sort((a, b) => b.value - a.value);
  if (!it.length) return ["Sem valores no gráfico ainda."];
  const total = it.reduce((soma, item) => soma + item.value, 0);
  const sh = (item: { value: number }) => (item.value / total) * 100;
  const top3 = (it.slice(0, 3).reduce((soma, item) => soma + item.value, 0) / total) * 100;
  const conc = sh(it[0]) >= 50 ? "muito concentrado numa só categoria" : top3 >= 80 ? "concentrado nas 3 maiores" : "razoavelmente distribuído";
  const linhas = [
    `📊 Total: ${reais(total)} em ${it.length} itens — ${conc}.`,
    `Maior: ${it[0].label} — ${reais(it[0].value)} (${pct(sh(it[0]))} do total).`,
  ];
  if (it[1]) linhas.push(`2º: ${it[1].label} — ${reais(it[1].value)} (${pct(sh(it[1]))}).`);
  linhas.push(`As 3 maiores somam ${pct(top3)} do total.`);
  linhas.push(`Menor: ${it[it.length - 1].label} — ${reais(it[it.length - 1].value)} (${pct(sh(it[it.length - 1]))}).`);
  return linhas;
}

export function analisePadraoSemana(linhas: { label: string; valor: number }[], nome: string): string[] {
  const it = linhas.filter((item) => item.valor > 0);
  if (it.length < 2) return ["Dados insuficientes pra comparar os dias da semana."];
  const s = [...it].sort((a, b) => b.valor - a.valor);
  const m = media(it.map((item) => item.valor));
  const pior = s[s.length - 1];
  const gap = ((s[0].valor - pior.valor) / pior.valor) * 100;
  return [
    `📊 ${nome} por dia da semana`,
    `Melhor dia: ${s[0].label} — ${reais(s[0].valor)} (${comSinal(((s[0].valor - m) / m) * 100)} vs a média dos dias, ${reais(m)}).`,
    `Pior dia: ${pior.label} — ${reais(pior.valor)} (${comSinal(((pior.valor - m) / m) * 100)}). O melhor dia rende ${pct(gap)} a mais que o pior.`,
    `Ranking: ${s.map((item) => `${item.label} ${reais(item.valor)}`).join(" › ")}.`,
  ];
}

export function analiseHorario(clocks: string[], series: { key: string; label: string; valores: number[] }[]): string[] {
  if (clocks.length < 4) return ["Sem captura de horário suficiente."];
  const g = series.find((serie) => serie.key === "geral");
  if (!g) return ["Sem série geral."];
  const v = g.valores;
  const total = v.reduce((soma, valor) => soma + valor, 0) || 1;
  let iPico = 0;
  v.forEach((valor, indice) => {
    if (valor > v[iPico]) iPico = indice;
  });
  let bestI = 0;
  let best = -1;
  for (let i = 0; i + 3 < v.length; i += 1) {
    const s2 = v[i] + v[i + 1] + v[i + 2] + v[i + 3];
    if (s2 > best) {
      best = s2;
      bestI = i;
    }
  }
  const faixa = (a: string, b: string) => (v.reduce((soma, valor, indice) => soma + (clocks[indice] >= a && clocks[indice] < b ? valor : 0), 0) / total) * 100;
  const dias = series.filter((serie) => serie.key !== "geral").map((serie) => ({ label: serie.label, t: serie.valores.reduce((soma, valor) => soma + valor, 0) })).filter((item) => item.t > 0).sort((a, b) => b.t - a.t);
  const linhas = [
    "🕒 Venda por horário (média dos dias abertos)",
    `Pico: ${clocks[iPico]} — média de ${reais(v[iPico])} por bloco de 30 min.`,
    `Janela de 2h mais forte: ${clocks[bestI]} às ${clocks[bestI + 3] ?? "—"} (≈ ${pct((best / total) * 100)} da venda do dia).`,
    `Distribuição: até 17:59 → ${pct(faixa("00:00", "18:00"))} • 18:00–21:59 → ${pct(faixa("18:00", "22:00"))} • a partir das 22:00 → ${pct(faixa("22:00", "99:99"))}.`,
  ];
  if (dias.length) linhas.push(`Dia com maior volume no horário: ${dias[0].label}${dias[1] ? `, depois ${dias[1].label}` : ""}; o mais fraco é ${dias[dias.length - 1].label}.`);
  return linhas;
}
