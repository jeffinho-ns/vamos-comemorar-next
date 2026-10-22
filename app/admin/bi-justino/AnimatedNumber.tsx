"use client";

import { useEffect, useRef, useState } from "react";

/** Conta do valor anterior até o novo em menos de meio segundo. */
export function AnimatedNumber({
  value,
  kind = "int",
}: {
  value: number;
  kind?: "int" | "money" | "pct";
}) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const to = Number.isFinite(value) ? value : 0;
    if (from === to) return;
    const start = performance.now();
    const duration = 420;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const next = Math.round(from + (to - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const text =
    kind === "money"
      ? shown.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : kind === "pct"
        ? `${shown.toLocaleString("pt-BR")}%`
        : shown.toLocaleString("pt-BR");
  return <span>{text}</span>;
}
