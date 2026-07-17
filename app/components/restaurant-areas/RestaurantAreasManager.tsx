"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MdAdd,
  MdAutoAwesome,
  MdDelete,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdLock,
  MdSave,
} from "react-icons/md";
import AreaTablesEditor from "./AreaTablesEditor";
import {
  RestaurantAreaDTO,
  getAuthHeaders,
  isLegacyArea,
  isOwnedArea,
} from "./types";

interface Props {
  apiUrl: string;
  establishmentId?: number | null;
  establishmentName?: string;
  /** Highline/Seu Justino: áreas fixas do sistema (somente leitura). */
  frozen?: boolean;
  /** Chamado quando áreas mudam, para o pai recarregar seu estado (ex.: modais). */
  onAreasChanged?: () => void;
}

interface AreaDraft {
  name: string;
  capacity_lunch: number;
  capacity_dinner: number;
}

const EMPTY_DRAFT: AreaDraft = {
  name: "",
  capacity_lunch: 0,
  capacity_dinner: 0,
};

export default function RestaurantAreasManager({
  apiUrl,
  establishmentId,
  establishmentName,
  frozen = false,
  onAreasChanged,
}: Props) {
  const [areas, setAreas] = useState<RestaurantAreaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AreaDraft>(EMPTY_DRAFT);

  const hasOwned = areas.some((a) => isOwnedArea(a, establishmentId));
  const needsAdoption = !frozen && areas.length > 0 && !hasOwned;

  const handleAdopt = async () => {
    if (!establishmentId) return;
    if (
      !confirm(
        "Isso vai criar uma cópia editável das áreas e mesas atuais para este estabelecimento. Depois você poderá editar/excluir livremente. Continuar?",
      )
    ) {
      return;
    }
    setAdopting(true);
    setMessage("");
    try {
      const res = await fetch(`${apiUrl}/api/restaurant-areas/adopt`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ establishment_id: establishmentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadAreas();
        onAreasChanged?.();
      } else {
        setMessage(data.error || "Erro ao personalizar áreas.");
      }
    } catch {
      setMessage("Erro de conexão ao personalizar áreas.");
    } finally {
      setAdopting(false);
    }
  };

  const loadAreas = useCallback(async () => {
    if (!establishmentId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/restaurant-areas?establishment_id=${establishmentId}`,
        { headers: getAuthHeaders() },
      );
      if (res.ok) {
        const data = await res.json();
        setAreas(Array.isArray(data.areas) ? data.areas : []);
      } else {
        setAreas([]);
      }
    } catch {
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, establishmentId]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (area: RestaurantAreaDTO) => {
    setDraft({
      name: area.name,
      capacity_lunch: Number(area.capacity_lunch) || 0,
      capacity_dinner: Number(area.capacity_dinner) || 0,
    });
    setEditingId(area.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!establishmentId) return;
    if (!draft.name.trim()) {
      setMessage("Informe o nome da área.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const isEdit = editingId != null;
      const url = isEdit
        ? `${apiUrl}/api/restaurant-areas/${editingId}`
        : `${apiUrl}/api/restaurant-areas`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: draft.name.trim(),
          capacity_lunch: Number(draft.capacity_lunch) || 0,
          capacity_dinner: Number(draft.capacity_dinner) || 0,
          establishment_id: establishmentId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        resetForm();
        await loadAreas();
        onAreasChanged?.();
      } else {
        setMessage(data.error || "Erro ao salvar área.");
      }
    } catch {
      setMessage("Erro de conexão ao salvar área.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (area: RestaurantAreaDTO) => {
    if (!establishmentId) return;
    if (
      !confirm(
        `Excluir a área "${area.name}"?\n\nReservas/passantes ativos impedem a exclusão.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `${apiUrl}/api/restaurant-areas/${area.id}?establishment_id=${establishmentId}`,
        { method: "DELETE", headers: getAuthHeaders() },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadAreas();
        onAreasChanged?.();
      } else {
        setMessage(data.error || "Erro ao excluir área.");
      }
    } catch {
      setMessage("Erro de conexão ao excluir área.");
    }
  };

  if (!establishmentId) {
    return (
      <div className="rounded-lg bg-gray-50 p-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Áreas do Restaurante
        </h4>
        <p className="mt-2 text-sm text-gray-500">
          Selecione um estabelecimento para gerenciar as áreas e mesas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800">
            Áreas do Restaurante
          </h4>
          <p className="text-sm text-gray-500">
            Ajuste as áreas, mesas e lugares de{" "}
            <strong>{establishmentName || "seu estabelecimento"}</strong> de
            acordo com o layout operacional.
          </p>
        </div>
        {!frozen && (
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <MdAdd className="h-4 w-4" />
            Nova Área
          </button>
        )}
      </div>

      {frozen && (
        <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Este estabelecimento usa áreas fixas do sistema (layout operacional
          específico) e não pode ser editado por aqui.
        </p>
      )}

      {needsAdoption && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-800">
            As áreas exibidas são o <strong>catálogo padrão</strong> do sistema
            (compartilhado). Para poder <strong>editar e excluir</strong> as
            áreas deste estabelecimento, personalize-as primeiro.
          </p>
          <button
            type="button"
            onClick={handleAdopt}
            disabled={adopting}
            className="flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <MdAutoAwesome className="h-4 w-4" />
            {adopting ? "Personalizando…" : "Personalizar áreas"}
          </button>
        </div>
      )}

      {message && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {message}
        </p>
      )}

      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-white p-4">
          <h5 className="mb-3 font-semibold text-gray-800">
            {editingId != null ? "Editar área" : "Nova área"}
          </h5>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs text-gray-500 sm:col-span-3">
              Nome da área
              <input
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="Ex.: Salão Interno, Deck, Varanda…"
                className="mt-0.5 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              Capacidade (almoço)
              <input
                type="number"
                min={0}
                value={draft.capacity_lunch}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    capacity_lunch: Number(e.target.value),
                  }))
                }
                className="mt-0.5 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              Capacidade (jantar)
              <input
                type="number"
                min={0}
                value={draft.capacity_dinner}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    capacity_dinner: Number(e.target.value),
                  }))
                }
                className="mt-0.5 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <MdSave className="h-4 w-4" />
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {areas.map((area) => {
          const owned = isOwnedArea(area, establishmentId);
          const legacy = isLegacyArea(area);
          const isOpen = expanded === area.id;
          return (
            <div
              key={area.id}
              className="rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-gray-800">{area.name}</h5>
                  {legacy && (
                    <span className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-[10px] uppercase text-gray-500">
                      <MdLock className="h-3 w-3" /> Padrão do sistema
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {owned && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(area)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Editar área"
                      >
                        <MdEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Excluir área"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : area.id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Gerenciar mesas"
                  >
                    {isOpen ? (
                      <MdExpandLess className="h-5 w-5" />
                    ) : (
                      <MdExpandMore className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="px-4 pb-1 text-sm text-gray-500">
                Capacidade: {area.capacity_dinner} (jantar) ·{" "}
                {area.capacity_lunch} (almoço)
              </div>
              {isOpen && (
                <div className="px-4 pb-4">
                  <AreaTablesEditor
                    apiUrl={apiUrl}
                    areaId={area.id}
                    establishmentId={establishmentId}
                    readOnly={!owned}
                    onChanged={onAreasChanged}
                  />
                  {legacy && (
                    <p className="mt-2 text-xs italic text-gray-400">
                      Esta é uma área padrão compartilhada do sistema. Para
                      personalizar áreas e mesas, crie uma nova área própria do
                      estabelecimento.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {areas.length === 0 && !loading && (
          <p className="text-sm italic text-gray-500">
            Nenhuma área encontrada. Clique em “Nova Área” para começar.
          </p>
        )}
      </div>
    </div>
  );
}
