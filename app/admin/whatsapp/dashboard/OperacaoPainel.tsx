"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Donut } from "./Donut";
import { fmtInt, fmtMinutos, fmtPct, fmtSegundos } from "./format";
import { MapaCalor } from "./MapaCalor";
import type { OperacaoPontoSemana, WhatsappDashboardSummary } from "./tipos";

const CORES_ORIGEM = ["#d97706", "#0d9488", "#7c3aed", "#0284c7", "#334155", "#db2777"];
const CORES_CANCEL = ["#f97316", "#ef4444", "#f59e0b", "#64748b"];

function Kpi({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{valor}</p>
      {nota ? <p className="mt-1 text-[11px] text-slate-500 text-pretty">{nota}</p> : null}
    </div>
  );
}

function SerieSemana({
  titulo,
  nota,
  dados,
  cor,
  formatar,
}: {
  titulo: string;
  nota: string;
  dados: OperacaoPontoSemana[];
  cor: string;
  formatar: (valor: number) => string;
}) {
  const temDado = dados.some((ponto) => ponto.valor > 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 text-balance">{titulo}</h3>
      <p className="mb-3 text-[11px] text-slate-500 text-pretty">{nota}</p>
      <div className="h-48">
        {temDado ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatar(Number(v))} />
              <Tooltip formatter={(valor) => formatar(Number(valor ?? 0))} />
              <Line type="monotone" dataKey="valor" name={titulo} stroke={cor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">Ainda sem dados neste período.</p>
        )}
      </div>
    </div>
  );
}

export function OperacaoPainel({ summary }: { summary: WhatsappDashboardSummary | null }) {
  const op = summary?.operacao;
  const ia = op?.resolucaoAutomatica.ia ?? 0;
  const humano = op?.resolucaoAutomatica.humano ?? 0;
  const origem = op?.origemSessoes ?? [];
  const categorias = (op?.categorias?.length ? op.categorias : summary?.temas) ?? [];
  const maxCategoria = Math.max(1, ...categorias.map((item) => item.n));
  const cancelamentos = op?.cancelamentos ?? [];
  const totalCancel = cancelamentos.reduce((acc, item) => acc + item.n, 0);
  const pico = op?.pico;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          titulo="Taxa de resolução"
          valor={fmtPct(op?.taxaResolucaoPct)}
          nota={`${fmtInt(op?.resolvidas)} de ${fmtInt(op?.total)} conversas encerradas`}
        />
        <Kpi
          titulo="Resolução pela IA"
          valor={fmtPct(op?.taxaIaPct)}
          nota="conversas que não passaram para atendente"
        />
        <Kpi
          titulo="Tempo médio da 1ª resposta"
          valor={fmtSegundos(op?.primeiraRespostaSegundos)}
          nota={op?.primeiraRespostaMediana != null ? `mediana ${fmtSegundos(op.primeiraRespostaMediana)}` : "da 1ª mensagem do cliente até a resposta"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Resolução automática</h3>
          <p className="mb-4 text-[11px] text-slate-500">IA sozinha versus transferência para a equipe.</p>
          <Donut
            fatias={[
              { label: "Conversas da IA", n: ia, cor: "#7c3aed" },
              { label: "Transferidas para humano", n: humano, cor: "#c4b5fd" },
            ]}
            centro={
              <div>
                <p className="text-lg font-semibold tabular-nums text-slate-900">{fmtPct(op?.taxaIaPct)}</p>
                <p className="text-[10px] text-slate-500">pela IA</p>
              </div>
            }
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Origem das sessões</h3>
          <p className="mb-4 text-[11px] text-slate-500">Canal de entrada das conversas do período.</p>
          {origem.length ? (
            <Donut
              fatias={origem.map((item, i) => ({
                label: item.label,
                n: item.n,
                cor: CORES_ORIGEM[i % CORES_ORIGEM.length],
              }))}
              centro={
                <div>
                  <p className="text-lg font-semibold tabular-nums text-slate-900">{fmtInt(origem.reduce((a, x) => a + x.n, 0))}</p>
                  <p className="text-[10px] text-slate-500">sessões</p>
                </div>
              }
            />
          ) : (
            <p className="text-sm text-slate-500">Ainda sem sessões neste período.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quando seus clientes falam</h3>
            <p className="text-[11px] text-slate-500">Mensagens recebidas por dia da semana e hora.</p>
          </div>
          {pico ? (
            <p className="text-xs text-violet-700">
              Pico de conversas: {pico.dia} às {String(pico.hora).padStart(2, "0")}h · {fmtInt(pico.n)}
            </p>
          ) : null}
        </div>
        <MapaCalor heatmap={op?.heatmapConversas ?? []} unidade="mensagem(ns)" paleta="violet" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SerieSemana
          titulo="Atendimentos resolvidos por dia da semana"
          nota="Conversas encerradas, no dia em que foram resolvidas."
          dados={op?.resolvidosPorDia ?? []}
          cor="#16a34a"
          formatar={fmtInt}
        />
        <SerieSemana
          titulo="Tempo de primeira resposta por dia da semana"
          nota="Média, em segundos, até a primeira resposta da casa."
          dados={op?.primeiraRespostaPorDia ?? []}
          cor="#0ea5e9"
          formatar={fmtSegundos}
        />
      </div>

      <SerieSemana
        titulo="Tempo de atendimento por dia da semana"
        nota="Duração média da conversa, do início ao último update."
        dados={op?.tempoAtendimentoPorDia ?? []}
        cor="#ef4444"
        formatar={fmtMinutos}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Categorias de atendimento IA</h3>
        <p className="mb-3 text-[11px] text-slate-500">Intenção detectada nas mensagens recebidas.</p>
        <div className="space-y-2">
          {categorias.length ? categorias.map((item) => (
            <div key={item.tema} className="grid grid-cols-[8rem_minmax(0,1fr)_3rem] items-center gap-2">
              <p className="truncate text-xs text-slate-600">{item.tema}</p>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.max(6, (item.n / maxCategoria) * 100)}%` }}
                />
              </div>
              <p className="text-right text-xs tabular-nums text-slate-700">{fmtInt(item.n)}</p>
            </div>
          )) : (
            <p className="text-sm text-slate-500">Ainda sem categorias neste período.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Motivos de cancelamento de reserva</h3>
        <p className="mb-4 text-[11px] text-slate-500">
          Inferido do status e da origem no Agilizaiapp — cancelamento, no-show ou recusa da casa.
        </p>
        {cancelamentos.length ? (
          <Donut
            fatias={cancelamentos.map((item, i) => ({
              label: item.motivo,
              n: item.n,
              cor: CORES_CANCEL[i % CORES_CANCEL.length],
            }))}
            centro={
              <div>
                <p className="text-lg font-semibold tabular-nums text-slate-900">{fmtInt(totalCancel)}</p>
                <p className="text-[10px] text-slate-500">canceladas</p>
              </div>
            }
          />
        ) : (
          <p className="text-sm text-slate-500">Nenhum cancelamento neste período.</p>
        )}
      </div>
    </div>
  );
}
