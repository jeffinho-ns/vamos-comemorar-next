"use client";

import { ReactNode } from "react";
import { formatDateTime } from "../../../lib/justino360/labels";
import type { IaMeta } from "./iaMeta";

/**
 * Moldura comum das seções de IA: cabeçalho, formulário, aviso de indisponível,
 * erro, estado de carregamento e área de preview. Mantém as quatro abas com o
 * mesmo comportamento sem repetir markup.
 */
export function IaPanel({
  title,
  hint,
  form,
  loading,
  loadingLabel = "Gerando com a IA…",
  error,
  feedback,
  disabledNotice,
  meta,
  children,
}: {
  title: string;
  hint: string;
  form: ReactNode;
  loading: boolean;
  loadingLabel?: string;
  error?: string | null;
  feedback?: { tone: "ok" | "error"; text: string } | null;
  disabledNotice?: string | null;
  meta?: IaMeta | null;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-4" aria-busy={loading}>
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{hint}</p>
      </header>

      {disabledNotice && (
        <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-500/30">
          {disabledNotice}
        </p>
      )}

      <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">{form}</div>

      {feedback && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.tone === "ok"
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading && (
        <p role="status" className="flex items-center gap-2 text-sm text-gray-300">
          <span
            aria-hidden="true"
            className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"
          />
          {loadingLabel}
        </p>
      )}

      {children}

      {meta && (
        <p className="text-xs text-gray-500">
          {meta.source === "ai"
            ? `Rascunho gerado por ${meta.model}`
            : "Leitura estatística (sem IA generativa)"}
          {meta.generated_at ? ` · ${formatDateTime(meta.generated_at)}` : ""} · revise antes de
          aplicar.
        </p>
      )}
    </section>
  );
}

/** Cartão de preview do rascunho, sempre acima dos botões de aplicar. */
export function IaPreview({
  heading,
  badges,
  actions,
  children,
}: {
  heading: string;
  badges?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-white">{heading}</h3>
          {badges && <div className="mt-1 flex flex-wrap gap-2">{badges}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </article>
  );
}

export function IaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-200 ring-1 ring-white/10">
      {children}
    </span>
  );
}
