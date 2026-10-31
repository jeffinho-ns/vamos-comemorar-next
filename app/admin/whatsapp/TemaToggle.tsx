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
      className="wa-tema-btn inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
      aria-pressed={escuro}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {escuro ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
      <span className="hidden sm:inline">{escuro ? "Claro" : "Escuro"}</span>
    </button>
  );
}
