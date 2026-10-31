import { fmtInt } from "./format";
import type { FunilPasso } from "./tipos";

export function FunilBarras({ passos }: { passos: FunilPasso[] }) {
  const max = Math.max(1, ...passos.map((p) => p.valor));
  return (
    <div className="space-y-3">
      {passos.map((passo) => {
        const largura = Math.max(4, Math.round((passo.valor / max) * 100));
        return (
          <div key={passo.id} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">{passo.label}</p>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${largura}%` }}
                />
              </div>
            </div>
            <p className="text-sm font-semibold tabular-nums text-slate-900 text-right">{fmtInt(passo.valor)}</p>
          </div>
        );
      })}
    </div>
  );
}
