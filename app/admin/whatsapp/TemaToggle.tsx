"use client";

import { MdDarkMode, MdLightMode } from "react-icons/md";
import type { TemaAtendimento } from "./tema";

export function TemaToggle({
  tema,
  onAlternar,
}: {
  tema: TemaAtendimento;
  onAlternar: () => void;
}) {
  const escuro = tema === "escuro";
  return (
    <button
      type="button"
      onClick={onAlternar}
      className="wa-tema-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-medium lg:h-auto lg:w-auto lg:gap-1.5 lg:px-3 lg:py-1.5"
      aria-pressed={escuro}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {escuro ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
      <span className="hidden lg:inline">{escuro ? "Claro" : "Escuro"}</span>
    </button>
  );
}
