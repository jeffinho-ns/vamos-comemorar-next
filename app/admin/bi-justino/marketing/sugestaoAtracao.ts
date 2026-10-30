import { reais } from "./numeros";
import { WEEKDAY_LABEL, type Bucket, type BucketDetalhe } from "./series";

/** Sugestão de horário pra banda/DJ (renderSugestaoAtracao do painel do Renato). */

export const BANDA_DURACAO_PADRAO_H = 1.5;
export const BANDA_SUGESTOES_POR_DIA: Record<number, number> = { 5: 2, 6: 3 };

export const HORARIO_FUNCIONAMENTO: Record<number, { abre: number; fecha: number; txt: string } | null> = {
  0: { abre: 12, fecha: 21, txt: "Feijoada em buffet livre. Roda de samba 360º." },
  1: null,
  2: { abre: 18, fecha: 25, txt: "Noite. Som ambiente." },
  3: { abre: 18, fecha: 25, txt: "Noite. Música ao vivo." },
  4: { abre: 18, fecha: 25, txt: "Noite. Música ao vivo." },
  5: { abre: 18, fecha: 27, txt: "Noite longa. Casa cheia, entrada por faixa de público. Palco 360º." },
  6: { abre: 14, fecha: 29, txt: "O dia mais longo da casa. Abre à tarde e emenda na noite. Palco 360º." },
};

function minutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** offsetLocal: minutos desde 00:00 do dia do evento; madrugada seguinte passa de 1440. */
function offset(date: string, start: string) {
  const ds = start.slice(0, 10).split("-").map(Number);
  const de = date.split("-").map(Number);
  const dd = Math.round((Date.UTC(ds[0], ds[1] - 1, ds[2]) - Date.UTC(de[0], de[1] - 1, de[2])) / 864e5);
  const c = minutos(start.slice(11, 16));
  return c == null || dd < 0 ? null : c + 1440 * dd;
}

export function fmtHHMM(min: number) {
  return `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

type Raw = Record<string, Record<number, { total: number; entradas: number }>>;

function rawSeries(buckets: Bucket[], detalhe: BucketDetalhe[]): Raw {
  const out: Raw = {};
  const put = (date: string, start: string, fn: (x: { total: number; entradas: number }) => void) => {
    const off = offset(date, start);
    if (off == null) return;
    const dia = out[date] || (out[date] = {});
    const x = dia[off] || (dia[off] = { total: 0, entradas: 0 });
    fn(x);
  };
  buckets.forEach((b) => put(b.date, b.start, (x) => { x.total += b.value; }));
  detalhe.forEach((b) => put(b.date, b.start, (x) => { x.entradas += b.entradas; }));
  return out;
}

function curvaMedia(raw: Raw, wd: number, campo: "total" | "entradas") {
  const soma: Record<number, number> = {};
  const cont: Record<number, number> = {};
  const dias = new Set<string>();
  for (const d of Object.keys(raw)) {
    if (new Date(`${d}T12:00:00`).getDay() !== wd) continue;
    for (const off of Object.keys(raw[d]).map(Number)) {
      const v = raw[d][off][campo];
      if (!v) continue;
      soma[off] = (soma[off] || 0) + v;
      cont[off] = (cont[off] || 0) + 1;
      dias.add(d);
    }
  }
  const media: Record<number, number> = {};
  Object.keys(soma).map(Number).forEach((off) => { media[off] = soma[off] / cont[off]; });
  return { media, nDias: dias.size };
}

function melhoresJanelas(valores: number[], tam: number, quantidade: number) {
  const restante = [...valores];
  const janelas: { ini: number; tam: number; soma: number }[] = [];
  for (let k = 0; k < quantidade; k += 1) {
    let melhorIni = -1;
    let melhorSoma = 0;
    for (let i = 0; i + tam <= restante.length; i += 1) {
      let soma = 0;
      for (let j = 0; j < tam; j += 1) soma += restante[i + j];
      if (soma > melhorSoma) {
        melhorSoma = soma;
        melhorIni = i;
      }
    }
    if (melhorIni < 0) break;
    janelas.push({ ini: melhorIni, tam, soma: melhorSoma });
    for (let j = 0; j < tam; j += 1) restante[melhorIni + j] = 0;
  }
  return janelas.sort((a, b) => a.ini - b.ini);
}

export interface SugestaoDia { dia: string; linhas: string[]; manual: string | null; rodape: string | null }

export function sugerirHorarios(buckets: Bucket[], detalhe: BucketDetalhe[], duracaoH: number): SugestaoDia[] {
  const dur = Math.max(0.5, Math.min(4, duracaoH || BANDA_DURACAO_PADRAO_H));
  const w = Math.max(1, Math.round(dur * 2));
  const raw = rawSeries(buckets, detalhe);
  return [0, 1, 2, 3, 4, 5, 6].map((wd) => {
    const fun = HORARIO_FUNCIONAMENTO[wd];
    const dia = WEEKDAY_LABEL[wd];
    if (!fun) return { dia, linhas: ["casa fechada (Manual)."], manual: null, rodape: null };
    const { media: mediaRev, nDias } = curvaMedia(raw, wd, "total");
    const { media: mediaEnt } = curvaMedia(raw, wd, "entradas");
    const offsets: number[] = [];
    for (let o = fun.abre * 60; o < fun.fecha * 60; o += 30) offsets.push(o);
    const valores = offsets.map((o) => mediaRev[o] || 0);
    if (!offsets.length || nDias < 2 || valores.every((v) => !v)) {
      return { dia, linhas: [`histórico insuficiente ainda (menos de 2 ${dia.toLowerCase()}(s) com movimento capturado).`], manual: null, rodape: null };
    }
    const janelas = melhoresJanelas(valores, Math.min(w, offsets.length), BANDA_SUGESTOES_POR_DIA[wd] || 1);
    const manual = fun.txt ? `Hoje no Manual: ${fun.txt}` : null;
    if (!janelas.length) return { dia, linhas: [`sem janela de ${dur}h com movimento real nesse horário de funcionamento.`], manual, rodape: null };
    const linhas = janelas.map((j, i) => {
      const iniOff = offsets[j.ini];
      const fimOff = offsets[j.ini + j.tam - 1] + 30;
      const ent = offsets.slice(j.ini, j.ini + j.tam).reduce((s, o) => s + (mediaEnt[o] || 0), 0);
      const rotulo = janelas.length > 1 ? `Sugestão ${i + 1} de horário` : "Sugestão de horário";
      return `${rotulo}: ${fmtHHMM(iniOff)} – ${fmtHHMM(fimOff)} — média ${reais(j.soma / 100)} de faturamento${ent ? `, ${Math.round(ent)} entrada(s)` : ", sem entrada capturada"} na janela.`;
    });
    return { dia, linhas, manual, rodape: `baseado em ${nDias} ${dia.toLowerCase()}(s) capturado(s) • janela de ${dur}h` };
  });
}
