export function numeroDe(valor: number | string | null | undefined): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  if (!limpo) return null;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

export function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDias(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  const m = String(data.getUTCMonth() + 1).padStart(2, "0");
  const d = String(data.getUTCDate()).padStart(2, "0");
  return `${data.getUTCFullYear()}-${m}-${d}`;
}

export function diaSemanaUtc(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function segundaDe(iso: string) {
  return addDias(iso, -((diaSemanaUtc(iso) + 6) % 7));
}

export function diasNoMes(mk: string) {
  const [ano, mes] = mk.split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function ddMm(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function reais(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function inteiro(valor: number) {
  return Math.round(valor).toLocaleString("pt-BR");
}

export function pctTeto(fracao: number) {
  const n = fracao * 100;
  const inteiroPct = Math.abs(n - Math.round(n)) < 0.05;
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: inteiroPct ? 0 : 1, minimumFractionDigits: inteiroPct ? 0 : 1 })}%`;
}

function media(valores: number[]) {
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

export function regressao(valores: number[]) {
  const n = valores.length;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  valores.forEach((y, x) => {
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
  });
  const den = n * sxx - sx * sx;
  const slope = den ? (n * sxy - sx * sy) / den : 0;
  const icpt = n ? (sy - slope * sx) / n : 0;
  const med = n ? sy / n : 0;
  let ssTot = 0;
  let ssRes = 0;
  const fit = valores.map((_, x) => {
    const previsto = icpt + slope * x;
    ssTot += (valores[x] - med) ** 2;
    ssRes += (valores[x] - previsto) ** 2;
    return previsto;
  });
  return { slope, r2: ssTot ? 1 - ssRes / ssTot : 0, fit };
}

function sinal(valor: number) {
  return valor >= 0 ? "+" : "";
}

function pct1(valor: number) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

export function textoTendencia(nome: string, rotulos: string[], valores: number[], unidade: "semanas" | "pontos" = "pontos") {
  const n = valores.length;
  if (n < 4) {
    return unidade === "semanas"
      ? "Poucas semanas com dado pra tirar uma tendência confiável."
      : "Poucos pontos no gráfico pra tirar uma tendência confiável.";
  }
  const reg = regressao(valores);
  const ini = Math.max(1, reg.fit[0]);
  const fim = reg.fit[n - 1];
  const variacao = ((fim - ini) / ini) * 100;
  const direcao = Math.abs(variacao) < 3 ? "estável" : variacao > 0 ? "em alta" : "em queda";
  const marca = direcao === "estável" ? "➡️" : variacao > 0 ? "📈" : "📉";
  const k = Math.min(4, Math.floor(n / 2));
  const ultimas = media(valores.slice(-k));
  const anteriores = media(valores.slice(-2 * k, -k));
  const delta = anteriores ? ((ultimas - anteriores) / anteriores) * 100 : 0;
  let maior = 0;
  let menor = 0;
  valores.forEach((valor, indice) => {
    if (valor > valores[maior]) maior = indice;
    if (valor < valores[menor]) menor = indice;
  });
  const forca = reg.r2 >= 0.5 ? "tendência clara" : reg.r2 >= 0.2 ? "tendência moderada" : "tendência fraca (muita oscilação)";
  const passo = unidade === "semanas" ? "/semana" : " por ponto";
  const melhor = unidade === "semanas" ? `semana de ${rotulos[maior]}` : rotulos[maior];
  const pior = unidade === "semanas" ? `semana de ${rotulos[menor]}` : rotulos[menor];
  const bloco = unidade === "semanas" ? "semanas" : "pontos";
  return `${marca} ${nome} ${direcao}: a linha de tendência vai de ${reais(ini)} a ${reais(fim)} (${sinal(variacao)}${pct1(variacao)} em ${n} ${bloco}, ${sinal(reg.slope)}${reais(reg.slope)}${passo}) — ${forca} (R² ${reg.r2.toFixed(2).replace(".", ",")}). Últimas ${k} ${bloco}: média ${reais(ultimas)}, ${sinal(delta)}${pct1(delta)} vs as ${k} anteriores (${reais(anteriores)}). Melhor: ${reais(valores[maior])} (${melhor}). Pior: ${reais(valores[menor])} (${pior}).`;
}

export function textoComparado(rotulos: string[], series: { nome: string; valores: number[] }[]) {
  if (rotulos.length < 4 || series.some((serie) => serie.valores.length < 4)) {
    return "Poucos pontos no gráfico pra tirar uma tendência confiável.";
  }
  const blocos = series.map((serie) => textoTendencia(serie.nome, rotulos, serie.valores, "pontos"));
  if (series.length === 2) {
    const [a, b] = series;
    const ma = media(a.valores);
    const mb = media(b.valores);
    let sab = 0;
    let saa = 0;
    let sbb = 0;
    a.valores.forEach((x, indice) => {
      sab += (x - ma) * (b.valores[indice] - mb);
      saa += (x - ma) ** 2;
      sbb += (b.valores[indice] - mb) ** 2;
    });
    const corr = saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
    const leit = Math.abs(corr) >= 0.7 ? "andam bem juntas" : Math.abs(corr) >= 0.4 ? "têm relação moderada" : "quase não se relacionam";
    const fatia = (b.valores[b.valores.length - 1] / Math.max(1, a.valores[a.valores.length - 1])) * 100;
    blocos.push(`Relação entre as duas séries: correlação ${corr.toFixed(2).replace(".", ",")} — ${a.nome} e ${b.nome} ${leit}. No último ponto, ${b.nome} representa ${fatia.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% de ${a.nome}.`);
  }
  return blocos.join(" ");
}

export function textoBarras(nome: string, itens: { label: string; valor: number }[]) {
  const positivos = itens.filter((item) => item.valor > 0).sort((a, b) => b.valor - a.valor);
  if (positivos.length < 2) return "Dados insuficientes pra comparar os dias da semana.";
  const med = media(positivos.map((item) => item.valor));
  const melhor = positivos[0];
  const pior = positivos[positivos.length - 1];
  const gap = pior.valor ? ((melhor.valor - pior.valor) / pior.valor) * 100 : 0;
  const vs = (valor: number) => `${sinal((valor - med) / med * 100)}${((valor - med) / med * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
  return `${nome} por dia da semana. Melhor dia: ${melhor.label}, ${reais(melhor.valor)} (${vs(melhor.valor)} vs a média ${reais(med)}). Pior dia: ${pior.label}, ${reais(pior.valor)}. O melhor rende ${gap.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% a mais que o pior. Ranking: ${positivos.map((item) => `${item.label} ${reais(item.valor)}`).join(" › ")}.`;
}

export function textoHorario(rotulos: string[], valores: number[], dia: string) {
  if (rotulos.length < 4) return "Sem captura de horário suficiente.";
  let pico = 0;
  valores.forEach((valor, indice) => {
    if (valor > valores[pico]) pico = indice;
  });
  let melhorI = 0;
  let melhor = -1;
  for (let i = 0; i + 3 < valores.length; i += 1) {
    const soma = valores[i] + valores[i + 1] + valores[i + 2] + valores[i + 3];
    if (soma > melhor) {
      melhor = soma;
      melhorI = i;
    }
  }
  const total = valores.reduce((soma, valor) => soma + valor, 0) || 1;
  const faixa = (de: string, ate: string) => valores.reduce((soma, valor, indice) => (
    rotulos[indice] >= de && rotulos[indice] < ate ? soma + valor : soma
  ), 0) / total * 100;
  const pct = (valor: number) => `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
  return `Venda por horário em ${dia}. Pico: ${rotulos[pico]}, média de ${reais(valores[pico])} por bloco. Janela de 2h mais forte: ${rotulos[melhorI]} às ${rotulos[melhorI + 3] || "—"} (≈ ${pct((melhor / total) * 100)} da venda). Até 17:59 → ${pct(faixa("00:00", "18:00"))}. 18:00–21:59 → ${pct(faixa("18:00", "22:00"))}. A partir das 22:00 → ${pct(faixa("22:00", "99:99"))}.`;
}
