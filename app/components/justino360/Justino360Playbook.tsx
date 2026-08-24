"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Justino360Shell } from "./Justino360Shell";

type Mode = "admin" | "staff";

const MODULES: { m: string; s: string; a: string }[] = [
  { m: "Checklists", s: "Executar e fotografar", a: "Montar templates" },
  { m: "Ocorrências", s: "Abrir com foto", a: "Acompanhar e fechar" },
  { m: "Tarefas", s: "Minhas tarefas", a: "Board + responsável" },
  { m: "Documentos / POPs", s: "Consultar", a: "Versionar e publicar" },
  { m: "Treinamentos", s: "Fazer o curso", a: "Atribuir e validade" },
  { m: "Comunicados", s: "Ler e dar ciência", a: "Publicar" },
  { m: "Agenda", s: "Briefing do setor", a: "Calendário ops + marketing" },
  { m: "Reuniões", s: "—", a: "Ata → decisões → tarefas" },
  { m: "Manutenção", s: "Evidência ao concluir", a: "Ativos e fila" },
  { m: "IA", s: "—", a: "Rascunhos de checklist, POP e resumos" },
];

export function Justino360Playbook({ mode }: { mode: Mode }) {
  return (
    <Justino360Shell mode={mode} title="Como usar o Justino360">
      <article className="space-y-10">
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-500/20 via-white/5 to-transparent p-8 ring-1 ring-amber-400/30 md:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-amber-300">
            Playbook interno · Seu Justino
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            Um guia para quem faz a casa acontecer todos os dias.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
            Operação completa, evidência no celular, gestão com clareza. Abaixo
            está o caminho, passo a passo, do jeito que o sistema já está no ar.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <PortalCard
            kicker="Equipe"
            title="Área operacional"
            href="/justino360"
            points={[
              "Início do dia, checklists e fotos",
              "Minhas tarefas (só o que é meu)",
              "Ocorrências, comunicados, treinos, agenda",
            ]}
          />
          <PortalCard
            kicker="Gestão"
            title="Painel da gestão"
            href="/admin/justino360"
            points={[
              "Dashboard, board de tarefas, templates",
              "Documentos, treinamentos, comunicados",
              "Calendário, reuniões, manutenção e IA",
            ]}
          />
        </section>

        <Section n="01" title="O ciclo que importa">
          <ol className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { t: "Checklist", d: "Abrir o turno e marcar item a item." },
              { t: "Foto", d: "NÃO OK exige evidência no celular." },
              { t: "Ocorrência", d: "O problema vira registro, não conversa solta." },
              { t: "Tarefa", d: "Alguém assume, executa e a gestão valida." },
            ].map((item) => (
              <li
                key={item.t}
                className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10"
              >
                <p className="text-sm font-semibold text-amber-300">{item.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section n="02" title="Como a equipe envia foto">
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300">
            A foto sobe pela área da equipe, no celular, no salão — não pelo
            menu pesado do admin.
          </p>
          <ol className="mt-5 space-y-4">
            <How
              n="1"
              title="Abra /justino360 e entre em Checklists"
              href="/justino360/checklists"
            >
              Escolha o checklist do turno (abertura, fechamento, inspeção).
            </How>
            <How n="2" title="No item, toque em NÃO OK">
              Descreva o que está errado. Se o item pedir evidência, o sistema
              exige foto ou vídeo.
            </How>
            <How n="3" title="Toque em “Foto ou vídeo da evidência”">
              Câmera ou galeria. Foto (JPG, PNG, WEBP, HEIC), vídeo curto ou
              PDF — até 15 MB.
            </How>
            <How n="4" title="Registre">
              A evidência fica ligada ao item. A gestão vê em Ocorrências.
            </How>
          </ol>
          <aside className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100 ring-1 ring-amber-400/25">
            Também dá para anexar foto ao abrir uma ocorrência em{" "}
            <Link
              className="underline decoration-amber-300/60"
              href="/justino360/ocorrencias"
            >
              /justino360/ocorrencias
            </Link>
            . Em manutenção, a evidência é obrigatória para concluir o chamado.
          </aside>
        </Section>

        <Section n="03" title="Como a gestão cria uma tarefa que a equipe vê">
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300">
            O board da gestão mostra todas as tarefas. A tela{" "}
            <strong className="font-medium text-white">Minhas tarefas</strong>{" "}
            mostra só o que tem responsável. Sem dono, a equipe não vê — e isso
            é de propósito.
          </p>
          <ol className="mt-5 space-y-4">
            <How
              n="1"
              title="Abra o board em /admin/justino360/tarefas"
              href="/admin/justino360/tarefas"
            >
              Título, prioridade, setor e prazo.
            </How>
            <How n="2" title="Escolha o responsável">
              Esse campo faz a tarefa aparecer no celular da pessoa, em
              /justino360/tarefas.
            </How>
            <How n="3" title="Peça para ela abrir Minhas tarefas">
              Status: aberta → em andamento → concluída. A gestão valida no
              board.
            </How>
          </ol>
        </Section>

        <Section n="04" title="O mapa completo — o que já está no ar">
          <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Módulo</th>
                  <th className="px-4 py-3 font-medium">Equipe</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    Gestão
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {MODULES.map((row) => (
                  <tr key={row.m} className="bg-black/20">
                    <td className="px-4 py-3 font-medium text-white">{row.m}</td>
                    <td className="px-4 py-3">{row.s}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n="05" title="Um dia típico">
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DayCard
              who="Para a equipe"
              items={[
                "Abrir /justino360 — ver o dia",
                "Rodar o checklist do turno, com foto no NÃO OK",
                "Executar Minhas tarefas",
                "Ler comunicados e conferir a agenda do setor",
              ]}
            />
            <DayCard
              who="Para a gestão"
              items={[
                "Abrir o dashboard — atrasos e NÃO OKs",
                "Atribuir responsáveis no board",
                "Validar tarefas concluídas",
                "Publicar comunicado, POP ou treino quando precisar",
              ]}
            />
          </div>
        </Section>

        <footer className="rounded-[28px] bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-400">
            Feito para o Seu Justino
          </p>
          <p className="mt-3 text-xl font-medium">
            Tudo da operação. Em um só lugar.
          </p>
          <p className="mt-2 text-sm text-gray-500">Justino360 · concepção Isa</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/justino360"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-amber-400"
            >
              Abrir área da equipe
            </Link>
            <Link
              href="/admin/justino360"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Abrir painel da gestão
            </Link>
          </div>
        </footer>
      </article>
    </Justino360Shell>
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
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-amber-400">{n}</span>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      </div>
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
      className="group rounded-[24px] bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:ring-amber-400/30"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-amber-400">{kicker}</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-gray-400">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-amber-300 group-hover:underline">{href}</p>
    </Link>
  );
}

function How({
  n,
  title,
  href,
  children,
}: {
  n: string;
  title: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-gray-900">
        {n}
      </span>
      <div>
        {href ? (
          <Link href={href} className="font-medium text-white hover:text-amber-300">
            {title}
          </Link>
        ) : (
          <p className="font-medium text-white">{title}</p>
        )}
        <p className="mt-1 text-sm leading-relaxed text-gray-400">{children}</p>
      </div>
    </li>
  );
}

function DayCard({ who, items }: { who: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-black/30 p-5 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-amber-300">{who}</p>
      <ol className="mt-3 space-y-2 text-sm text-gray-300">
        {items.map((item, i) => (
          <li key={item} className="flex gap-2">
            <span className="text-gray-500">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
