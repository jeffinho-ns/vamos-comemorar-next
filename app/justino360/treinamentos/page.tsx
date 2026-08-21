"use client";

import { useCallback, useEffect, useState } from "react";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

type MyTraining = {
  id: number;
  training_id: number;
  title: string;
  description?: string;
  status: string;
  due_at?: string;
  content_url?: string;
};

export default function StaffTreinamentosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<MyTraining[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    j360Fetch<MyTraining[]>("/my-trainings").then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function complete(trainingId: number) {
    const res = await j360Fetch(`/trainings/${trainingId}/complete`, {
      method: "POST",
      body: JSON.stringify({ result: "concluido" }),
    });
    if (!res.success) setMsg(res.message || "Falha ao concluir");
    else {
      setMsg("Treinamento concluído.");
      load();
    }
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Meus treinamentos">
      {msg && <p className="mb-4 text-sm text-amber-300">{msg}</p>}
      <ul className="space-y-3">
        {items.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm text-gray-400">{t.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{t.status}</p>
              {t.content_url && (
                <a
                  href={t.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-amber-400 hover:underline"
                >
                  Material
                </a>
              )}
            </div>
            {t.status !== "concluido" && (
              <button
                type="button"
                onClick={() => complete(t.training_id)}
                className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-900"
              >
                Concluir
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum treinamento atribuído.</p>
        )}
      </ul>
    </Justino360Shell>
  );
}
