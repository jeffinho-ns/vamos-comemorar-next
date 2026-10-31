import type { WhatsappDashboardSummary } from "./tipos";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

function tom(n: number, max: number) {
  if (!n || !max) return "bg-slate-100";
  const t = n / max;
  if (t > 0.75) return "bg-amber-700";
  if (t > 0.5) return "bg-amber-500";
  if (t > 0.25) return "bg-amber-300";
  return "bg-amber-200";
}

export function MapaCalor({ heatmap }: { heatmap: NonNullable<WhatsappDashboardSummary["heatmap"]> }) {
  const max = Math.max(1, ...heatmap.map((c) => c.n));
  const mapa = new Map(heatmap.map((c) => [`${c.dow}-${c.hora}`, c.n]));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `2.2rem repeat(24, minmax(0, 1fr))` }}>
          <span />
          {HORAS.map((h) => (
            <span key={h} className="text-[9px] text-slate-400 text-center">
              {h % 3 === 0 ? `${String(h).padStart(2, "0")}h` : ""}
            </span>
          ))}
          {DIAS.map((nome, indice) => {
            const dow = (indice + 1) % 7;
            return (
              <div key={nome} className="contents">
                <span className="text-[11px] text-slate-500 self-center">{nome}</span>
                {HORAS.map((hora) => {
                  const n = mapa.get(`${dow}-${hora}`) || 0;
                  return (
                    <span
                      key={`${dow}-${hora}`}
                      title={`${nome} ${hora}h · ${n} reserva(s)`}
                      className={`h-4 rounded-sm ${tom(n, max)}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
