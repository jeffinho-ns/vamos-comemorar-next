"use client";

import { useState } from "react";

interface AreaOption {
  id: number;
  name: string;
}

interface ReservationBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentId: number | null | undefined;
  areas: AreaOption[];
  initialDate?: Date | null;
  apiUrl: string;
  onBlockCreated?: () => void;
}

export default function ReservationBlockModal({
  isOpen,
  onClose,
  establishmentId,
  areas,
  initialDate,
  apiUrl,
  onBlockCreated,
}: ReservationBlockModalProps) {
  const [areaId, setAreaId] = useState<number | "all">("all");
  const [startDate, setStartDate] = useState<string>(
    initialDate ? initialDate.toISOString().slice(0, 10) : "",
  );
  const [endDate, setEndDate] = useState<string>(
    initialDate ? initialDate.toISOString().slice(0, 10) : "",
  );
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");
  const [reason, setReason] = useState<string>("Evento privado");
  const [recurrenceType, setRecurrenceType] = useState<"none" | "weekly">(
    "none",
  );
  const [recurrenceWeekday, setRecurrenceWeekday] = useState<number | null>(
    null,
  );
  const [maxPeopleCapacity, setMaxPeopleCapacity] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!establishmentId) {
      setError("Selecione um estabelecimento antes de bloquear a agenda.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Selecione a data de início e fim.");
      return;
    }

    const startDatetime = `${startDate}T${startTime}:00`;
    const endDatetime = `${endDate}T${endTime}:00`;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const body: any = {
        establishment_id: establishmentId,
        area_id: areaId === "all" ? null : areaId,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        reason,
        recurrence_type: recurrenceType,
        recurrence_weekday:
          recurrenceType === "weekly" ? recurrenceWeekday : null,
      };

      if (maxPeopleCapacity !== "") {
        body.max_people_capacity = Number(maxPeopleCapacity);
      }

      const response = await fetch(`${apiUrl}/api/restaurant-reservation-blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao criar bloqueio de agenda");
      }

      if (onBlockCreated) onBlockCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar bloqueio de agenda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Bloquear Agenda</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data início
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data fim
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora início
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora fim
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={areaId}
              onChange={(e) =>
                setAreaId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
            >
              <option value="all">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Evento privado, manutenção, equipe reduzida..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recorrência
            </label>
            <div className="flex gap-3 items-center">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={recurrenceType}
                onChange={(e) =>
                  setRecurrenceType(e.target.value as "none" | "weekly")
                }
              >
                <option value="none">Sem recorrência</option>
                <option value="weekly">Semanal</option>
              </select>

              {recurrenceType === "weekly" && (
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={recurrenceWeekday ?? ""}
                  onChange={(e) =>
                    setRecurrenceWeekday(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                >
                  <option value="">Dia da semana</option>
                  <option value={0}>Domingo</option>
                  <option value={1}>Segunda</option>
                  <option value={2}>Terça</option>
                  <option value={3}>Quarta</option>
                  <option value={4}>Quinta</option>
                  <option value={5}>Sexta</option>
                  <option value={6}>Sábado</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidade máxima de pessoas (opcional)
            </label>
            <input
              type="number"
              min={0}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={maxPeopleCapacity}
              onChange={(e) =>
                setMaxPeopleCapacity(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="Ex: 20 (para staff reduzida)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para bloquear completamente o período.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Confirmar bloqueio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

