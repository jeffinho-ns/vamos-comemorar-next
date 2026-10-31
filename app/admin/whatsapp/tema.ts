"use client";

import { useEffect, useState } from "react";

export type TemaAtendimento = "claro" | "escuro";

const CHAVE = "wa-tema";

function lerInicial(): TemaAtendimento {
  if (typeof window === "undefined") return "claro";
  const salvo = window.localStorage.getItem(CHAVE);
  if (salvo === "claro" || salvo === "escuro") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function useTemaAtendimento() {
  const [tema, setTema] = useState<TemaAtendimento>("claro");

  useEffect(() => {
    setTema(lerInicial());
  }, []);

  const escolher = (proximo: TemaAtendimento) => {
    setTema(proximo);
    window.localStorage.setItem(CHAVE, proximo);
  };

  const alternar = () => escolher(tema === "escuro" ? "claro" : "escuro");

  return { tema, escolher, alternar };
}
