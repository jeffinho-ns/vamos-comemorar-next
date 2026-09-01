"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { RhIdeiaShell } from "./RhIdeiaShell";

type Mode = "admin" | "staff";

const MODULES: { m: string; s: string; a: string }[] = [
  { m: "Comunicados", s: "Ler e dar ciência", a: "Publicar para o grupo" },
  { m: "Documentos", s: "Consultar políticas", a: "Versionar e publicar" },
  { m: "Treinamentos", s: "Fazer cursos obrigatórios", a: "Criar, atribuir e acompanhar" },
  { m: "Dashboard", s: "—", a: "KPIs de ciência por unidade" },
];

export function RhIdeiaPlaybook({ mode }: { mode: Mode }) {
  return (
    <RhIdeiaShell mode={mode} title="Como usar o Ideia RH">
      <article className="space-y-10">
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-500/20 via-indigo-500/10 to-transparent p-8 ring-1 ring-teal-400/30 md:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-teal-300">
            Playbook interno · Grupo Ideia Um
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            RH centralizado, colaboradores em todas as casas.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Comunicados, políticas e treinamentos de grupo — sem planilha, sem
            WhatsApp disperso. Abaixo está o caminho para staff e para o time de RH.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <PortalCard
            kicker="Colaborador"
            title="Área do colaborador"
            href="/rh-ideia"
            points={[
              "Pendências: comunicados e treinamentos",
              "Ler políticas vigentes (regulamento, LGPD…)",
              "Confirmar ciência com um toque",
            ]}
          />
          <PortalCard
            kicker="RH"
            title="Painel de gestão RH"
            href="/admin/rh-ideia"
            points={[
              "Dashboard com % de ciência por unidade",
              "Publicar comunicados scope=grupo",
              "Documentos versionados e treinamentos",
            ]}
          />
        </section>

        <Section n="01" title="Piloto global (Fase 1)">
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            O RH no escritório publica para <strong className="text-slate-200">todas as casas</strong>{" "}
            de uma vez. Colaboradores de Seu Justino, Highline, Pracinha, Reserva Pinheiros e Apê
            consomem no portal <code className="text-teal-300">/rh-ideia</code>.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Publicar", d: "RH cria comunicado ou política com escopo organização." },
              { t: "Consumir", d: "Colaborador lê, faz treinamento e dá ciência." },
              { t: "Medir", d: "Dashboard mostra % de ciência por unidade." },
            ].map((item) => (
              <li
                key={item.t}
                className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10"
              >
                <p className="text-sm font-semibold text-teal-300">{item.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section n="02" title="Módulos disponíveis">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Módulo</th>
                  <th className="py-2 pr-4">Colaborador</th>
                  <th className="py-2">RH / gestão</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((row) => (
                  <tr key={row.m} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium text-slate-200">{row.m}</td>
                    <td className="py-3 pr-4 text-slate-400">{row.s}</td>
                    <td className="py-3 text-slate-400">{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n="03" title="Conteúdo sugerido para o dia 1">
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>1. Comunicado de boas-vindas ao Ideia RH</li>
            <li>2. Regulamento interno / código de conduta (PDF)</li>
            <li>3. Treinamento &quot;Integração Grupo Ideia&quot; (obrigatório, 90 dias)</li>
            <li>4. Treinamento LGPD / privacidade (obrigatório)</li>
          </ul>
        </Section>

        <Section n="04" title="Dúvidas frequentes">
          <dl className="mt-4 space-y-4">
            <Faq
              q="Ideia RH substitui o Justino360?"
              a="Não. Justino360 é operação de loja (checklists, ocorrências). Ideia RH é people ops (políticas, treinamentos, comunicados de grupo)."
            />
            <Faq
              q="Gestor de unidade publica comunicados?"
              a="No v1, apenas o RH central publica conteúdo de grupo. Gestores validam etapas locais na Fase 2+."
            />
            <Faq
              q="Não consigo acessar"
              a="Peça ao RH ou account admin para habilitar o módulo rh_ideia no seu perfil."
            />
          </dl>
        </Section>
      </article>
    </RhIdeiaShell>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">{n}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-100">{title}</h3>
      {children}
    </section>
  );
}

function PortalCard({
  kicker,
  title,
  href,
  points,
}: {
  kicker: string;
  title: string;
  href: string;
  points: string[];
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-teal-400/40"
    >
      <p className="text-xs uppercase tracking-wide text-teal-400">{kicker}</p>
      <h3 className="mt-2 text-lg font-semibold group-hover:text-teal-200">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
        {points.map((p) => (
          <li key={p}>· {p}</li>
        ))}
      </ul>
    </Link>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
      <dt className="font-medium text-slate-200">{q}</dt>
      <dd className="mt-1 text-sm text-slate-400">{a}</dd>
    </div>
  );
}
