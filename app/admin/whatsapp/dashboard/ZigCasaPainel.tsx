import { fmtInt, fmtReais } from "./format";
import type { ZigCasaSummary } from "./tipos";

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
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{valor}</p>
      {nota ? <p className="mt-1 text-[11px] text-slate-500 text-pretty">{nota}</p> : null}
    </div>
  );
}

export function ZigCasaPainel({ zig }: { zig: ZigCasaSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 text-balance">Resultado na casa (ZigPay)</h3>
          <p className="text-[11px] text-slate-500 text-pretty">
            Faturamento da casa na Zig no mesmo período — não é o gasto de cada cliente da conversa.
          </p>
        </div>
        <p className="text-xs text-slate-500">{zig.casa} · {zig.fonte}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          titulo="Faturamento da casa na Zig"
          valor={fmtReais(zig.faturamento)}
          nota={`${fmtInt(zig.diasComFaturamento)} dia(s) com movimento`}
        />
        <Kpi
          titulo="Ticket médio Zig"
          valor={fmtReais(zig.ticketMedio)}
          nota={`${fmtInt(zig.publico)} pessoas no público Zig`}
        />
        <Kpi
          titulo="Receita estimada das reservas"
          valor={fmtReais(zig.receitaEstimadaReservas)}
          nota={`estimativa = ${fmtInt(zig.pessoasCompareceram)} pax × ticket`}
        />
        <Kpi
          titulo="Fatia WhatsApp (estimativa)"
          valor={fmtReais(zig.receitaEstimadaWhatsapp)}
          nota={`estimativa = ${fmtInt(zig.pessoasWhatsapp)} pax WhatsApp × ticket`}
        />
      </div>
    </div>
  );
}
