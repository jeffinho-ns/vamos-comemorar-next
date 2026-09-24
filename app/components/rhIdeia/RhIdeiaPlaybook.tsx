"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { IriHouseIllustration, IriNotebookIllustration } from "./RhIdeiaIllustrations";
import { RhIdeiaShell } from "./RhIdeiaShell";
import { IRI_CARD, IRI_MUTED, IRI_SOFT } from "./ui";

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
        <header className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-8 shadow-sm md:p-12">
          <div className="absolute right-4 top-4 opacity-90 md:right-8 md:top-8">
            <IriNotebookIllustration className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
            Playbook interno · Grupo Ideia Um
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl">
            RH centralizado, colaboradores em todas as casas.
          </h2>
          <p className={`mt-5 max-w-2xl text-base leading-relaxed ${IRI_SOFT} md:text-lg`}>
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
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start">
            <p className={`max-w-3xl text-sm leading-relaxed ${IRI_SOFT}`}>
              O RH no escritório publica para <strong className="text-slate-800">todas as casas</strong>{" "}
              de uma vez. Colaboradores de Seu Justino, Highline, Pracinha, Reserva Pinheiros e Apê
              consomem no portal <code className="rounded bg-teal-50 px-1.5 py-0.5 text-teal-800">/rh-ideia</code>.
            </p>
            <IriHouseIllustration className="mx-auto h-20 w-20 shrink-0 md:mx-0" />
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Publicar", d: "RH cria comunicado ou política com escopo organização." },
              { t: "Consumir", d: "Colaborador lê, faz treinamento e dá ciência." },
              { t: "Medir", d: "Dashboard mostra % de ciência por unidade." },
            ].map((item) => (
              <li key={item.t} className={IRI_CARD}>
                <p className="text-sm font-semibold text-teal-700">{item.t}</p>
                <p className={`mt-2 text-sm leading-relaxed ${IRI_MUTED}`}>{item.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section n="02" title="Módulos disponíveis">
          <div className={`mt-4 overflow-x-auto ${IRI_CARD} !p-0`}>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Módulo</th>
                  <th className="px-4 py-2.5">Colaborador</th>
                  <th className="px-4 py-2.5">RH / gestão</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((row) => (
                  <tr key={row.m} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.m}</td>
                    <td className={`px-4 py-3 ${IRI_MUTED}`}>{row.s}</td>
                    <td className={`px-4 py-3 ${IRI_MUTED}`}>{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n="03" title="Conteúdo sugerido para o dia 1">
          <ul className={`mt-4 space-y-2 text-sm ${IRI_SOFT}`}>
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{n}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
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
      className={`group ${IRI_CARD} transition hover:border-teal-300 hover:shadow-md`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{kicker}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-teal-700">{title}</h3>
      <ul className={`mt-3 space-y-1.5 text-sm ${IRI_MUTED}`}>
        {points.map((p) => (
          <li key={p}>· {p}</li>
        ))}
      </ul>
    </Link>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className={IRI_CARD}>
      <dt className="font-medium text-slate-900">{q}</dt>
      <dd className={`mt-1 text-sm ${IRI_MUTED}`}>{a}</dd>
    </div>
  );
}
