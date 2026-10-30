"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 900;

function formatValue(value: number, kind: "int" | "money" | "pct") {
  if (kind === "money") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }
  if (kind === "pct") {
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString("pt-BR");
}

/** Desliza do número anterior até o novo, desacelerando no final. */
export function AnimatedNumber({
  value,
  kind = "int",
}: {
  value: number;
  kind?: "int" | "money" | "pct";
}) {
  const [shown, setShown] = useState(value);
  const [geracao, setGeracao] = useState(0);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const to = Number.isFinite(value) ? value : 0;
    if (from === to) return;
    const start = performance.now();
    let frame = 0;
    setGeracao((atual) => atual + 1);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        shownRef.current = to;
        setShown(to);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span key={geracao} className={`sjNum${geracao ? " is-moving" : ""}`}>{formatValue(shown, kind)}</span>
  );
}
