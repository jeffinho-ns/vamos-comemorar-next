"use client";

import { FormEvent, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

export default function AdminIaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [checklistInstruction, setChecklistInstruction] = useState("");
  const [checklistSector, setChecklistSector] = useState("operação");
  const [popInstruction, setPopInstruction] = useState("");
  const [popRole, setPopRole] = useState("equipe");
  const [summarizeText, setSummarizeText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showResult(data: unknown) {
    setResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }

  async function runGenerateChecklist(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await j360Fetch("/ai/generate-checklist", {
      method: "POST",
      body: JSON.stringify({
        instruction: checklistInstruction,
        sector: checklistSector,
      }),
    });
    setLoading(false);
    if (!res.success) setError(res.message || "Falha ao gerar checklist");
    else showResult(res.data);
  }

  async function runGeneratePop(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await j360Fetch("/ai/generate-pop", {
      method: "POST",
      body: JSON.stringify({
        instruction: popInstruction,
        role_key: popRole,
      }),
    });
    setLoading(false);
    if (!res.success) setError(res.message || "Falha ao gerar POP");
    else showResult(res.data);
  }

  async function runSummarize(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await j360Fetch("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text: summarizeText, kind: "ata" }),
    });
    setLoading(false);
    if (!res.success) setError(res.message || "Falha ao resumir");
    else showResult(res.data);
  }

  async function runRecurringInsights() {
    setLoading(true);
    setError(null);
    const res = await j360Fetch("/ai/recurring-insights");
    setLoading(false);
    if (!res.success) setError(res.message || "Falha ao analisar");
    else showResult(res.data);
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="IA operacional">
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={runGenerateChecklist}
            className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h2 className="font-medium">Gerar checklist</h2>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Setor"
              value={checklistSector}
              onChange={(e) => setChecklistSector(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Instrução (ex: checklist de abertura do bar)"
              value={checklistInstruction}
              onChange={(e) => setChecklistInstruction(e.target.value)}
              rows={3}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Gerar
            </button>
          </form>

          <form
            onSubmit={runGeneratePop}
            className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h2 className="font-medium">Gerar POP</h2>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Função (role_key)"
              value={popRole}
              onChange={(e) => setPopRole(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Instrução do procedimento"
              value={popInstruction}
              onChange={(e) => setPopInstruction(e.target.value)}
              rows={3}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Gerar
            </button>
          </form>

          <form
            onSubmit={runSummarize}
            className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <h2 className="font-medium">Resumir texto / ata</h2>
            <textarea
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              placeholder="Cole a ata ou texto operacional"
              value={summarizeText}
              onChange={(e) => setSummarizeText(e.target.value)}
              rows={4}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Resumir
            </button>
          </form>

          <div className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <h2 className="font-medium">Insights de recorrência</h2>
            <p className="text-sm text-gray-400">
              Analisa ocorrências repetidas nos últimos 60 dias e sugere ações.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={runRecurringInsights}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
            >
              Analisar recorrências
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200">{error}</p>
        )}
        {loading && <p className="mb-4 text-sm text-gray-400">Processando…</p>}
        {result && (
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-gray-200 ring-1 ring-white/10">
            {result}
          </pre>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
