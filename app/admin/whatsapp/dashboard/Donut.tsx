import type { ReactNode } from "react";
import { fmtInt, fmtPct } from "./format";

export type FatiaDonut = {
  label: string;
  n: number;
  cor: string;
};

export function Donut({
  fatias,
  centro,
}: {
  fatias: FatiaDonut[];
  centro?: ReactNode;
}) {
  const total = fatias.reduce((acc, item) => acc + item.n, 0);
  let acc = 0;
  const stops = total
    ? fatias.map((item) => {
        const inicio = acc;
        acc += (item.n / total) * 100;
        return `${item.cor} ${inicio}% ${acc}%`;
      })
    : ["#e2e8f0 0% 100%"];

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        aria-hidden
      >
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white text-center">
          {centro ?? (
            <p className="text-lg font-semibold tabular-nums text-slate-900">{fmtInt(total)}</p>
          )}
        </div>
      </div>
      <ul className="min-w-[10rem] space-y-1.5 text-xs text-slate-600">
        {fatias.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: item.cor }} />
              {item.label}
            </span>
            <span className="tabular-nums text-slate-700">
              {fmtInt(item.n)} · {fmtPct(total ? (item.n / total) * 100 : 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
