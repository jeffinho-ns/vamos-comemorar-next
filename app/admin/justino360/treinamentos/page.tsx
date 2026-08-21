"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

type Training = {
  id: number;
  title: string;
  description?: string;
  role_key?: string;
  assigned_count?: number;
  completed_count?: number;
};

export default function AdminTreinamentosPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<Training[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roleKey, setRoleKey] = useState("");

  const load = useCallback(() => {
    j360Fetch<Training[]>("/trainings").then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await j360Fetch("/trainings", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: description || undefined,
        role_key: roleKey || undefined,
      }),
    });
    if (res.success) {
      setTitle("");
      setDescription("");
      setRoleKey("");
      load();
    }
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Treinamentos">
        <form
          onSubmit={onCreate}
          className="mb-8 space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
          <h2 className="font-medium">Novo treinamento</h2>
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Função (role_key), ex: garcom, barman"
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
          />
          <p className="text-xs text-gray-400">
            Após criar, atribua o treinamento às pessoas via API{" "}
            <code className="text-amber-300/80">POST /trainings/:id/assign</code>{" "}
            com <code className="text-amber-300/80">user_ids</code>.
          </p>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Criar
          </button>
        </form>
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm text-gray-400">{t.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {t.role_key || "Todas as funções"} · {t.completed_count ?? 0}/
                {t.assigned_count ?? 0} concluídos
              </p>
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum treinamento cadastrado.</p>
          )}
        </ul>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
