/** Gráficos SVG leves para dashboards do Ideia RH (sem libs externas). */

import Link from "next/link";

type Tone = "teal" | "indigo" | "amber" | "rose";

const TONE: Record<Tone, { stroke: string; fill: string; text: string }> = {
  teal: { stroke: "#0d9488", fill: "#ccfbf1", text: "text-teal-700" },
  indigo: { stroke: "#4f46e5", fill: "#e0e7ff", text: "text-indigo-700" },
  amber: { stroke: "#d97706", fill: "#fef3c7", text: "text-amber-700" },
  rose: { stroke: "#e11d48", fill: "#ffe4e6", text: "text-rose-700" },
};

/** Anel de progresso (0–100%). */
export function IriRingChart({
  value,
  label,
  hint,
  tone = "teal",
  size = 112,
}: {
  value: number;
  label: string;
  hint?: string;
  tone?: Tone;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const colors = TONE[tone];
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0"
        role="img"
        aria-label={`${label}: ${pct}%`}
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          className="fill-slate-800"
          style={{ fontSize: "18px", fontWeight: 650 }}
        >
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

/** Barra horizontal simples com valor absoluto. */
export function IriBarMeter({
  label,
  value,
  max,
  tone = "teal",
  href,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: Tone;
  href?: string;
}) {
  const ceiling = Math.max(max ?? value, 1);
  const pct = Math.min(100, Math.round((value / ceiling) * 100));
  const colors = TONE[tone];
  const alert = tone === "rose" || tone === "amber";

  const body = (
    <>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className={`text-2xl font-semibold tabular-nums ${alert && value > 0 ? colors.text : "text-slate-800"}`}>
          {value}
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value === 0 ? 0 : Math.max(pct, 8)}%`,
            backgroundColor: value === 0 ? "#a8a29e" : colors.stroke,
          }}
        />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">{body}</div>
  );
}

/** Barras verticais comparando poucos indicadores. */
export function IriBarChart({
  items,
}: {
  items: { label: string; value: number; tone?: Tone }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex h-36 items-end justify-around gap-3 px-2" role="img" aria-label="Comparativo">
      {items.map((item) => {
        const colors = TONE[item.tone || "teal"];
        const height = Math.max(8, Math.round((item.value / max) * 100));
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-slate-800">{item.value}</span>
            <div className="flex h-24 w-full max-w-[48px] items-end justify-center rounded-t-md bg-stone-100">
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${height}%`, backgroundColor: colors.stroke }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="text-center text-[11px] leading-tight text-slate-500">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
