"use client";

import { FormEvent } from "react";
import type { IriPlaybookChapter } from "../../lib/rhIdeia/types";
import { IRI_BTN_PRIMARY, IRI_CARD } from "./ui";

const LOCK =
  "select-none [-webkit-touch-callout:none] [-webkit-user-select:none]";

export function PlaybookReader({
  chapters,
  watermark,
  onRead,
  canMark = true,
}: {
  chapters: IriPlaybookChapter[];
  watermark: string;
  onRead: (id: number) => void;
  canMark?: boolean;
}) {
  function block(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <div className={LOCK} onCopy={block} onCut={block} onContextMenu={block}>
      <style>{`
        @media print {
          .playbook-lock { display: none !important; }
        }
      `}</style>
      <div className="playbook-lock relative space-y-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.12]"
        >
          <p className="-rotate-12 text-center text-3xl font-semibold tracking-wide text-slate-800">
            {watermark || "Uso interno"}
            <br />
            {new Date().toLocaleString("pt-BR")}
          </p>
        </div>
        {chapters.map((chapter) => (
          <article key={chapter.id} className={`relative z-0 ${IRI_CARD}`}>
            <h2 className="text-lg font-semibold text-slate-900">{chapter.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              {chapter.body.split("\n\n").map((paragraph, index) => (
                <p key={`${chapter.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
            {canMark && (
              <button
                type="button"
                disabled={chapter.read}
                onClick={() => onRead(chapter.id)}
                className={`relative z-20 mt-4 ${IRI_BTN_PRIMARY}`}
              >
                {chapter.read ? "Lido" : "Marcar como lido"}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
