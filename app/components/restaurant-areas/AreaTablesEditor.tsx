"use client";

import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEventSeat, MdSave } from "react-icons/md";
import {
  RestaurantTableDTO,
  getAuthHeaders,
} from "./types";

interface Props {
  apiUrl: string;
  areaId: number;
  establishmentId: number;
  /** Somente leitura para áreas legadas/compartilhadas. */
  readOnly?: boolean;
  onChanged?: () => void;
}

interface TableDraft {
  table_number: string;
  capacity: number;
  table_type: string;
}

const EMPTY_DRAFT: TableDraft = {
  table_number: "",
  capacity: 4,
  table_type: "",
};

export default function AreaTablesEditor({
  apiUrl,
  areaId,
  establishmentId,
  readOnly = false,
  onChanged,
}: Props) {
  const [tables, setTables] = useState<RestaurantTableDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [draft, setDraft] = useState<TableDraft>(EMPTY_DRAFT);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/restaurant-tables?area_id=${areaId}&establishment_id=${establishmentId}`,
        { headers: getAuthHeaders() },
      );
      if (res.ok) {
        const data = await res.json();
        setTables(Array.isArray(data.tables) ? data.tables : []);
      } else {
        setTables([]);
      }
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, areaId, establishmentId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleAdd = async () => {
    if (!draft.table_number.trim()) {
      setMessage("Informe o número/identificação da mesa.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${apiUrl}/api/restaurant-tables`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          area_id: areaId,
          establishment_id: establishmentId,
          table_number: draft.table_number.trim(),
          capacity: Number(draft.capacity) || 1,
          table_type: draft.table_type.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDraft(EMPTY_DRAFT);
        await loadTables();
        onChanged?.();
      } else {
        setMessage(data.error || "Erro ao criar mesa.");
      }
    } catch {
      setMessage("Erro de conexão ao criar mesa.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCapacity = async (table: RestaurantTableDTO, capacity: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/restaurant-tables/${table.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ capacity: Number(capacity) || 1 }),
      });
      if (res.ok) {
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, capacity } : t)),
        );
        onChanged?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Erro ao atualizar mesa.");
      }
    } catch {
      setMessage("Erro de conexão ao atualizar mesa.");
    }
  };

  const handleDelete = async (table: RestaurantTableDTO) => {
    if (!confirm(`Excluir a mesa "${table.table_number}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/restaurant-tables/${table.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadTables();
        onChanged?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Erro ao excluir mesa.");
      }
    } catch {
      setMessage("Erro de conexão ao excluir mesa.");
    }
  };

  const totalSeats = tables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h6 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <MdEventSeat className="h-4 w-4 text-gray-500" />
          Mesas ({tables.length}) · {totalSeats} lugares
        </h6>
        {loading && <span className="text-xs text-gray-400">Carregando…</span>}
      </div>

      {message && (
        <p className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
          {message}
        </p>
      )}

      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <span className="min-w-[64px] text-sm font-medium text-gray-800">
              Mesa {table.table_number}
            </span>
            <label className="flex items-center gap-1 text-xs text-gray-500">
              Lugares
              <input
                type="number"
                min={1}
                defaultValue={table.capacity}
                disabled={readOnly || table.establishment_id == null}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (val && val !== table.capacity) {
                    handleUpdateCapacity(table, val);
                  }
                }}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </label>
            {table.establishment_id == null ? (
              <span className="ml-auto rounded bg-gray-200 px-2 py-0.5 text-[10px] uppercase text-gray-500">
                Padrão do sistema
              </span>
            ) : (
              !readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(table)}
                  className="ml-auto text-red-500 hover:text-red-700"
                  title="Excluir mesa"
                >
                  <MdDelete className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        ))}
        {tables.length === 0 && !loading && (
          <p className="text-xs italic text-gray-400">
            Nenhuma mesa cadastrada nesta área.
          </p>
        )}
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
          <label className="text-xs text-gray-500">
            Nº da mesa
            <input
              type="text"
              value={draft.table_number}
              onChange={(e) =>
                setDraft((d) => ({ ...d, table_number: e.target.value }))
              }
              placeholder="Ex.: 12"
              className="mt-0.5 block w-24 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            Lugares
            <input
              type="number"
              min={1}
              value={draft.capacity}
              onChange={(e) =>
                setDraft((d) => ({ ...d, capacity: Number(e.target.value) }))
              }
              className="mt-0.5 block w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            Tipo (opcional)
            <input
              type="text"
              value={draft.table_type}
              onChange={(e) =>
                setDraft((d) => ({ ...d, table_type: e.target.value }))
              }
              placeholder="bistrô, alta…"
              className="mt-0.5 block w-32 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <MdSave className="h-4 w-4" /> : <MdAdd className="h-4 w-4" />}
            Adicionar mesa
          </button>
        </div>
      )}
    </div>
  );
}
