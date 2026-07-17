"use client";

import { useCallback, useEffect, useState } from "react";
import { MdEventSeat, MdMeetingRoom, MdRefresh } from "react-icons/md";
import {
  RestaurantAreaDTO,
  RestaurantTableDTO,
  getAuthHeaders,
} from "./types";

interface Props {
  apiUrl: string;
  establishmentId?: number | null;
  establishmentName?: string;
  /** Compacto para caber em barras laterais (ex.: inbox do WhatsApp). */
  compact?: boolean;
}

interface AreaSummary extends RestaurantAreaDTO {
  tableCount: number;
  seatCount: number;
}

/**
 * Resumo (somente leitura) de áreas, mesas e lugares por estabelecimento.
 * Ajuda o atendimento (WhatsApp) a entender a estrutura física da casa.
 */
export default function AreasOverviewPanel({
  apiUrl,
  establishmentId,
  establishmentName,
  compact = false,
}: Props) {
  const [summaries, setSummaries] = useState<AreaSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!establishmentId) {
      setSummaries([]);
      return;
    }
    setLoading(true);
    try {
      const [areasRes, tablesRes] = await Promise.all([
        fetch(
          `${apiUrl}/api/restaurant-areas?establishment_id=${establishmentId}`,
          { headers: getAuthHeaders() },
        ),
        fetch(
          `${apiUrl}/api/restaurant-tables?establishment_id=${establishmentId}`,
          { headers: getAuthHeaders() },
        ),
      ]);

      const areasData = areasRes.ok ? await areasRes.json() : { areas: [] };
      const tablesData = tablesRes.ok ? await tablesRes.json() : { tables: [] };
      const areas: RestaurantAreaDTO[] = Array.isArray(areasData.areas)
        ? areasData.areas
        : [];
      const tables: RestaurantTableDTO[] = Array.isArray(tablesData.tables)
        ? tablesData.tables
        : [];

      const byArea = new Map<number, { count: number; seats: number }>();
      tables.forEach((t) => {
        const cur = byArea.get(Number(t.area_id)) || { count: 0, seats: 0 };
        cur.count += 1;
        cur.seats += Number(t.capacity) || 0;
        byArea.set(Number(t.area_id), cur);
      });

      setSummaries(
        areas.map((a) => {
          const agg = byArea.get(Number(a.id)) || { count: 0, seats: 0 };
          return { ...a, tableCount: agg.count, seatCount: agg.seats };
        }),
      );
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, establishmentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!establishmentId) return null;

  const totalTables = summaries.reduce((s, a) => s + a.tableCount, 0);
  const totalSeats = summaries.reduce((s, a) => s + a.seatCount, 0);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <MdMeetingRoom className="h-4 w-4 text-gray-500" />
          Áreas & Mesas
          {establishmentName && (
            <span className="font-normal text-gray-400">
              · {establishmentName}
            </span>
          )}
        </h4>
        <button
          type="button"
          onClick={load}
          className="text-gray-400 hover:text-gray-600"
          title="Atualizar"
        >
          <MdRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-2 flex gap-4 text-xs text-gray-500">
        <span>
          <strong className="text-gray-800">{summaries.length}</strong> áreas
        </span>
        <span>
          <strong className="text-gray-800">{totalTables}</strong> mesas
        </span>
        <span>
          <strong className="text-gray-800">{totalSeats}</strong> lugares
        </span>
      </div>

      <div className="space-y-1.5">
        {summaries.map((area) => (
          <div
            key={area.id}
            className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-gray-800">{area.name}</span>
            <span className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MdEventSeat className="h-3.5 w-3.5" />
                {area.tableCount} mesas · {area.seatCount} lugares
              </span>
            </span>
          </div>
        ))}
        {summaries.length === 0 && !loading && (
          <p className="text-xs italic text-gray-400">
            Nenhuma área cadastrada para este estabelecimento.
          </p>
        )}
      </div>
    </div>
  );
}
