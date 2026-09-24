"use client";

import { useCallback, useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";
import { IRI_BTN_PRIMARY, IRI_CARD, IRI_MUTED, IRI_SOFT } from "./ui";

type Item = { id: number; label: string };
type Checklist = {
  id: number;
  title: string;
  items: Item[];
  today?: { id: number; status: string } | null;
};

export function PlaybookChecklist() {
  const [data, setData] = useState<Checklist | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await iriFetch<Checklist | null>("/playbook/checklists");
    if (res.success) setData(res.data || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    const res = await iriFetch("/playbook/checklists/today", {
      method: "POST",
      body: JSON.stringify({ item_ids: picked }),
    });
    setMessage(res.success ? "Checklist entregue ao líder." : res.message || "Não foi possível entregar.");
    load();
  }

  if (!data) return null;

  return (
    <section className={IRI_CARD}>
      <h2 className="text-lg font-semibold text-slate-900">{data.title}</h2>
      <p className={`mt-1 text-xs ${IRI_MUTED}`}>Preencha no sistema. Não há folha para imprimir.</p>
      <ul className="mt-3 space-y-2">
        {data.items.map((item) => (
          <li key={item.id}>
            <label className={`flex items-start gap-2 text-sm ${IRI_SOFT}`}>
              <input
                type="checkbox"
                className="mt-1 accent-teal-600"
                checked={picked.includes(item.id)}
                onChange={() =>
                  setPicked((current) =>
                    current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
                  )
                }
              />
              {item.label}
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={submit}
        disabled={data.today?.status === "conferido"}
        className={`mt-4 ${IRI_BTN_PRIMARY}`}
      >
        {data.today?.status === "conferido" ? "Conferido pelo líder" : "Entregar checklist de hoje"}
      </button>
      {message && <p className={`mt-2 text-sm ${IRI_SOFT}`}>{message}</p>}
    </section>
  );
}
