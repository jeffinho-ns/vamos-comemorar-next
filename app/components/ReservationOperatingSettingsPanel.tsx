"use client";

import { useEffect, useMemo, useState } from "react";
import { MdAutoAwesome, MdDelete, MdSave } from "react-icons/md";

interface WeeklySetting {
  weekday: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  second_start_time: string | null;
  second_end_time: string | null;
  label?: string;
}

interface DateOverride {
  id: number;
  override_date: string;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  second_start_time: string | null;
  second_end_time: string | null;
  note?: string | null;
}

interface Props {
  establishmentId?: number | null;
  establishmentName?: string;
  apiUrl: string;
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const DEFAULT_OVERRIDE = {
  override_date: "",
  is_open: true,
  start_time: "12:00",
  end_time: "00:00",
  second_start_time: "",
  second_end_time: "",
  note: "",
};

export default function ReservationOperatingSettingsPanel({
  establishmentId,
  establishmentName,
  apiUrl,
}: Props) {
  const [weekly, setWeekly] = useState<WeeklySetting[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [overrideForm, setOverrideForm] = useState(DEFAULT_OVERRIDE);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const canLoad = Boolean(establishmentId && apiUrl);

  const loadSettings = async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiUrl}/api/restaurant-reservation-settings?establishment_id=${establishmentId}`,
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao carregar configurações");
      }
      setWeekly(Array.isArray(data.weekly_settings) ? data.weekly_settings : []);
      setOverrides(Array.isArray(data.date_overrides) ? data.date_overrides : []);
    } catch (error: any) {
      setMessage(error?.message || "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId]);

  const sortedWeekly = useMemo(
    () => [...weekly].sort((a, b) => a.weekday - b.weekday),
    [weekly],
  );

  const updateWeeklyField = (
    weekday: number,
    field: keyof WeeklySetting,
    value: string | boolean | null,
  ) => {
    setWeekly((prev) =>
      prev.map((row) =>
        row.weekday === weekday ? { ...row, [field]: value } : row,
      ),
    );
  };

  const saveWeekly = async () => {
    if (!canLoad) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiUrl}/api/restaurant-reservation-settings/weekly`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            establishment_id: establishmentId,
            weekly,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao salvar configuração semanal");
      }
      setMessage("Configuração semanal salva com sucesso.");
      await loadSettings();
    } catch (error: any) {
      setMessage(error?.message || "Erro ao salvar configuração semanal");
    } finally {
      setSaving(false);
    }
  };

  const createOverride = async () => {
    if (!canLoad || !overrideForm.override_date) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiUrl}/api/restaurant-reservation-settings/overrides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            establishment_id: establishmentId,
            override_date: overrideForm.override_date,
            is_open: overrideForm.is_open,
            start_time: overrideForm.start_time || null,
            end_time: overrideForm.end_time || null,
            second_start_time: overrideForm.second_start_time || null,
            second_end_time: overrideForm.second_end_time || null,
            note: overrideForm.note || null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao salvar exceção");
      }
      setOverrideForm(DEFAULT_OVERRIDE);
      setMessage("Exceção de data salva com sucesso.");
      await loadSettings();
    } catch (error: any) {
      setMessage(error?.message || "Erro ao salvar exceção");
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (id: number) => {
    if (!canLoad) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `${apiUrl}/api/restaurant-reservation-settings/overrides/${id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao remover exceção");
      }
      setMessage("Exceção removida.");
      await loadSettings();
    } catch (error: any) {
      setMessage(error?.message || "Erro ao remover exceção");
    } finally {
      setSaving(false);
    }
  };

  if (!establishmentId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        Selecione um estabelecimento para editar horários e exceções.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-lg font-semibold text-gray-900">
          Horário de funcionamento para reservas
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          Estabelecimento: <strong>{establishmentName || `ID ${establishmentId}`}</strong>
        </p>
        {loading ? (
          <p className="text-sm text-gray-500 mt-3">Carregando...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedWeekly.map((row) => (
              <div
                key={row.weekday}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border border-gray-100 rounded-lg p-3"
              >
                <div className="md:col-span-2 font-medium text-gray-800">
                  {WEEKDAY_LABELS[row.weekday]}
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.is_open}
                      onChange={(e) =>
                        updateWeeklyField(row.weekday, "is_open", e.target.checked)
                      }
                    />
                    Aberto
                  </label>
                </div>
                <input
                  type="time"
                  value={row.start_time?.slice(0, 5) || ""}
                  onChange={(e) =>
                    updateWeeklyField(row.weekday, "start_time", e.target.value || null)
                  }
                  className="md:col-span-2 border rounded px-2 py-1 text-sm"
                  disabled={!row.is_open}
                />
                <input
                  type="time"
                  value={row.end_time?.slice(0, 5) || ""}
                  onChange={(e) =>
                    updateWeeklyField(row.weekday, "end_time", e.target.value || null)
                  }
                  className="md:col-span-2 border rounded px-2 py-1 text-sm"
                  disabled={!row.is_open}
                />
                <input
                  type="time"
                  value={row.second_start_time?.slice(0, 5) || ""}
                  onChange={(e) =>
                    updateWeeklyField(
                      row.weekday,
                      "second_start_time",
                      e.target.value || null,
                    )
                  }
                  className="md:col-span-2 border rounded px-2 py-1 text-sm"
                  placeholder="2ª abertura"
                  disabled={!row.is_open}
                />
                <input
                  type="time"
                  value={row.second_end_time?.slice(0, 5) || ""}
                  onChange={(e) =>
                    updateWeeklyField(
                      row.weekday,
                      "second_end_time",
                      e.target.value || null,
                    )
                  }
                  className="md:col-span-2 border rounded px-2 py-1 text-sm"
                  placeholder="2º fechamento"
                  disabled={!row.is_open}
                />
              </div>
            ))}
            <button
              onClick={saveWeekly}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <MdSave />
              Salvar horário semanal
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-lg font-semibold text-gray-900">Exceções por data</h4>
        <p className="text-sm text-gray-600 mt-1">
          Use para feriados, eventos especiais ou ajustes pontuais sem mexer no padrão semanal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-2 mt-4">
          <input
            type="date"
            value={overrideForm.override_date}
            onChange={(e) =>
              setOverrideForm((prev) => ({ ...prev, override_date: e.target.value }))
            }
            className="md:col-span-2 border rounded px-2 py-1 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overrideForm.is_open}
              onChange={(e) =>
                setOverrideForm((prev) => ({ ...prev, is_open: e.target.checked }))
              }
            />
            Aberto
          </label>
          <input
            type="time"
            value={overrideForm.start_time}
            onChange={(e) =>
              setOverrideForm((prev) => ({ ...prev, start_time: e.target.value }))
            }
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            type="time"
            value={overrideForm.end_time}
            onChange={(e) =>
              setOverrideForm((prev) => ({ ...prev, end_time: e.target.value }))
            }
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            type="time"
            value={overrideForm.second_start_time}
            onChange={(e) =>
              setOverrideForm((prev) => ({
                ...prev,
                second_start_time: e.target.value,
              }))
            }
            className="border rounded px-2 py-1 text-sm"
            placeholder="2ª abertura"
          />
          <input
            type="time"
            value={overrideForm.second_end_time}
            onChange={(e) =>
              setOverrideForm((prev) => ({
                ...prev,
                second_end_time: e.target.value,
              }))
            }
            className="border rounded px-2 py-1 text-sm"
            placeholder="2º fechamento"
          />
          <input
            type="text"
            value={overrideForm.note}
            onChange={(e) =>
              setOverrideForm((prev) => ({ ...prev, note: e.target.value }))
            }
            className="md:col-span-5 border rounded px-2 py-1 text-sm"
            placeholder="Motivo (ex.: Segunda especial dia 20)"
          />
          <button
            onClick={createOverride}
            disabled={saving || !overrideForm.override_date}
            className="md:col-span-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Salvar exceção
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {overrides.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma exceção cadastrada.</p>
          )}
          {overrides.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100 rounded-lg p-3"
            >
              <div className="text-sm text-gray-700">
                <strong>{item.override_date}</strong> -{" "}
                {item.is_open
                  ? `${item.start_time?.slice(0, 5) || "--:--"} às ${item.end_time?.slice(0, 5) || "--:--"}`
                  : "Fechado"}
                {item.second_start_time && item.second_end_time
                  ? ` | ${item.second_start_time.slice(0, 5)} às ${item.second_end_time.slice(0, 5)}`
                  : ""}
                {item.note ? ` - ${item.note}` : ""}
              </div>
              <button
                onClick={() => deleteOverride(item.id)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
              >
                <MdDelete />
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
          <MdAutoAwesome />
          Ideias avançadas para configurar sem código
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>limite por horário (capacidade dinâmica por slot de 30 minutos);</li>
          <li>antecedência mínima e máxima de reserva por estabelecimento;</li>
          <li>tempo de giro por área (ex.: lounge 2h, quintal 3h);</li>
          <li>regras automáticas de lista de espera por período de pico;</li>
          <li>bloqueio recorrente por área/faixa (manutenção, evento privado);</li>
          <li>fechamento automático por lotação + mensagem customizada ao cliente;</li>
          <li>templates de operação (normal, feriado, evento) para aplicar em 1 clique.</li>
        </ul>
      </div>

      {message ? (
        <div className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {message}
        </div>
      ) : null}
    </div>
  );
}
