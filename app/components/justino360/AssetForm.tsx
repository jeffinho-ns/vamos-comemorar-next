"use client";

import { FormEvent, useState } from "react";
import type { J360Sector } from "../../lib/justino360/types";

export type AssetFormValues = {
  name: string;
  sector_id?: number;
  code?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
  next_maintenance_at?: string;
};

const FIELD_CLASS =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400";

/** Cadastro de equipamento: freezer, chopeira, câmara fria, ar-condicionado… */
export function AssetForm({
  sectors,
  busy,
  onSubmit,
}: {
  sectors: J360Sector[];
  busy?: boolean;
  onSubmit: (values: AssetFormValues) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [nextMaintenance, setNextMaintenance] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({
      name: name.trim(),
      sector_id: sectorId ? Number(sectorId) : undefined,
      code: code.trim() || undefined,
      location: location.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      notes: notes.trim() || undefined,
      next_maintenance_at: nextMaintenance || undefined,
    });
    if (!ok) return;
    setName("");
    setSectorId("");
    setCode("");
    setLocation("");
    setManufacturer("");
    setNextMaintenance("");
    setNotes("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <h2 className="font-medium">Novo equipamento</h2>
      <input
        className={FIELD_CLASS}
        placeholder="Nome (ex: chopeira do bar)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={200}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="asset-sector" className="mb-1 block text-xs text-gray-400">
            Setor
          </label>
          <select
            id="asset-sector"
            className={FIELD_CLASS}
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
          >
            <option value="">Geral</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="asset-code" className="mb-1 block text-xs text-gray-400">
            Código / patrimônio
          </label>
          <input
            id="asset-code"
            className={FIELD_CLASS}
            placeholder="CH-01"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="asset-location" className="mb-1 block text-xs text-gray-400">
            Localização
          </label>
          <input
            id="asset-location"
            className={FIELD_CLASS}
            placeholder="Bar — balcão principal"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="asset-manufacturer" className="mb-1 block text-xs text-gray-400">
            Fabricante
          </label>
          <input
            id="asset-manufacturer"
            className={FIELD_CLASS}
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>
      <div>
        <label htmlFor="asset-next" className="mb-1 block text-xs text-gray-400">
          Próxima preventiva
        </label>
        <input
          id="asset-next"
          type="date"
          className={FIELD_CLASS}
          value={nextMaintenance}
          onChange={(e) => setNextMaintenance(e.target.value)}
        />
      </div>
      <textarea
        className={FIELD_CLASS}
        placeholder="Observações (rotina de limpeza, cuidados…)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
      >
        Cadastrar equipamento
      </button>
    </form>
  );
}
