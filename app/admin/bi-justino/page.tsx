"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import { useBiLive, type BiMapItem } from "./useBiLive";

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-white">
        {value == null ? "—" : <AnimatedNumber value={value} />}
      </p>
      {hint ? <p className="mt-2 text-xs text-white/50">{hint}</p> : null}
    </article>
  );
}

function MapList({ title, items }: { title: string; items: BiMapItem[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
        {title} · {items.length}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.action}
            className="rounded-xl bg-black/20 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10"
          >
            <span className="text-white/45">{item.area}</span>
            <span className="mx-2 text-white/25">·</span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function BiJustinoPage() {
  const { data, error, loading, connected, freshIds, reload } = useBiLive();
  const nossos = data?.mapa.filter((item) => item.origem === "nosso_banco") ?? [];
  const espera = data?.mapa.filter((item) => item.origem === "aguarda_variaveis") ?? [];
  const hora = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="mx-auto max-w-6xl text-white">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Seu Justino · hoje em São Paulo</p>
          <h1 className="text-2xl font-semibold">O que já está no nosso banco</h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/70">
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-300"}`} />
          {connected ? "Ao vivo" : "Atualiza a cada poucos segundos"}
          {hora ? <span className="text-white/40">· {hora}</span> : null}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-3 text-red-100" role="alert">
          <p>{error}</p>
          <button type="button" onClick={reload} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-sm">
            Tentar de novo
          </button>
        </div>
      ) : null}

      {loading && !data ? <p className="text-white/70">Lendo as reservas de hoje…</p> : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card label="Reservas hoje" value={data.hoje.reservas} hint="Fora as canceladas" />
            <Card label="Pessoas hoje" value={data.hoje.pessoas} />
            <Card label="Check-ins de reserva" value={data.hoje.checkins} />
            <Card label="Check-ins de convidados" value={data.hoje.convidados} />
            <Card label="Agenda em 30 dias" value={data.agenda.reservas} hint="Reservas de hoje em diante" />
            <Card label="Pessoas na agenda" value={data.agenda.pessoas} />
          </div>
          {data.ultimoDia && data.hoje.reservas === 0 ? (
            <p className="mt-4 text-sm text-white/60">
              Hoje ainda não entrou reserva. O último dia no banco foi{" "}
              {new Date(`${data.ultimoDia.data}T12:00:00`).toLocaleDateString("pt-BR")}
              , com {data.ultimoDia.reservas.toLocaleString("pt-BR")} reservas e{" "}
              {data.ultimoDia.pessoas.toLocaleString("pt-BR")} pessoas.
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">Por status</h2>
              <ul className="space-y-2">
                {data.porStatus.length === 0 ? (
                  <li className="text-sm text-white/50">Nenhuma reserva hoje.</li>
                ) : (
                  data.porStatus.map((row) => (
                    <li key={row.status} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
                      <span>{row.status}</span>
                      <span className="tabular-nums text-white/80">
                        <AnimatedNumber value={row.reservas} /> reservas · <AnimatedNumber value={row.pessoas} /> pessoas
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
                {data.recentesEm === "hoje"
                  ? "Movimento de hoje"
                  : `Último movimento · ${new Date(`${data.recentesEm}T12:00:00`).toLocaleDateString("pt-BR")}`}
              </h2>
              <ul className="space-y-2">
                {data.recentes.map((row) => (
                  <li
                    key={row.id}
                    className={`rounded-xl px-3 py-2 ring-1 transition ${
                      freshIds.includes(row.id) ? "bg-cyan-400/20 ring-cyan-300" : "bg-white/10 ring-white/10"
                    }`}
                  >
                    <p className="font-medium">{row.nome}</p>
                    <p className="text-sm text-white/60">
                      {row.hora || "sem hora"} · {row.pessoas} pessoas · {row.status}
                      {row.checkedIn ? " · check-in feito" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <MapList title="Já rodando daqui" items={nossos} />
            <MapList title="Espera as variáveis do Renato" items={espera} />
          </div>
        </>
      ) : null}
    </div>
  );
}
