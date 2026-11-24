'use client';

import { useRef } from 'react';
import { MdDelete, MdImage, MdSave, MdSwapHoriz, MdUpload } from 'react-icons/md';
import { INPUT_CLASS, Toggle } from './shared';
import {
  ASSET_KINDS,
  EVENT_BADGE,
  EVENTS,
  eventLabel,
  type AssetKind,
  type Flyer,
  type TriggerEvent,
} from './flyerTypes';

type Props = {
  kind: AssetKind;
  flyers: Flyer[];
  busy: boolean;
  onUpload: (files: FileList) => void;
  onPatch: (id: number, patch: Partial<Flyer>) => void;
  onSave: (flyer: Flyer) => void;
  onDelete: (id: number) => void;
  onReplace: (id: number, file: File) => void;
};

export default function FlyerKindPanel({
  kind,
  flyers,
  busy,
  onUpload,
  onPatch,
  onSave,
  onDelete,
  onReplace,
}: Props) {
  const meta = ASSET_KINDS.find((item) => item.id === kind);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetRef = useRef<number | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-4">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const target = replaceTargetRef.current;
          if (file && target != null) onReplace(target, file);
          if (replaceInputRef.current) replaceInputRef.current.value = '';
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(e.target.files);
          if (uploadInputRef.current) uploadInputRef.current.value = '';
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-gray-500">{meta?.hint}</p>
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <MdUpload size={16} />
          Subir imagens
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Pode selecionar várias de uma vez. Depois de subir, escreva em cada foto o que ela é e quando a
        Sol deve enviar.
      </p>

      {flyers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
          Nenhuma arte neste tipo. Clique em &quot;Subir imagens&quot; para adicionar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {flyers.map((flyer) => (
            <div key={flyer.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="shrink-0">
                {flyer.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flyer.media_url}
                    alt={flyer.title || flyer.usage_hint || 'Arte'}
                    className="h-28 w-28 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <MdImage size={28} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    replaceTargetRef.current = flyer.id;
                    replaceInputRef.current?.click();
                  }}
                  className="mt-2 inline-flex w-28 items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                >
                  <MdSwapHoriz size={14} />
                  Trocar
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${EVENT_BADGE[flyer.trigger_event] || EVENT_BADGE.sob_demanda}`}
                  >
                    {eventLabel(flyer.trigger_event)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={flyer.is_active}
                      onChange={(value) => onPatch(flyer.id, { is_active: value })}
                    />
                    <button
                      type="button"
                      onClick={() => onDelete(flyer.id)}
                      className="rounded p-1 text-red-500 hover:text-red-600"
                      aria-label="Remover arte"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={flyer.title}
                  onChange={(e) => onPatch(flyer.id, { title: e.target.value })}
                  placeholder="Título interno (opcional)"
                  className={INPUT_CLASS}
                />

                <textarea
                  value={flyer.usage_hint}
                  onChange={(e) => onPatch(flyer.id, { usage_hint: e.target.value })}
                  rows={3}
                  placeholder={meta?.usagePlaceholder}
                  className={INPUT_CLASS}
                />
                <p className="text-[11px] text-gray-400">
                  Para a Sol: o que é esta imagem e quando ela deve ir para o cliente.
                </p>

                <textarea
                  value={flyer.caption}
                  onChange={(e) => onPatch(flyer.id, { caption: e.target.value })}
                  rows={2}
                  placeholder="Legenda no WhatsApp (opcional, vai junto da foto)"
                  className={INPUT_CLASS}
                />

                {kind === 'informacao' && (
                  <>
                    <select
                      value={flyer.trigger_event}
                      onChange={(e) =>
                        onPatch(flyer.id, { trigger_event: e.target.value as TriggerEvent })
                      }
                      className={INPUT_CLASS}
                    >
                      {EVENTS.map((event) => (
                        <option key={event.value} value={event.value}>
                          {event.label}
                        </option>
                      ))}
                    </select>
                    {flyer.trigger_event === 'pos_visita' && (
                      <div>
                        <label className="mb-1 block text-[11px] text-gray-500">
                          Horas após a reserva
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={flyer.delay_hours}
                          onChange={(e) =>
                            onPatch(flyer.id, {
                              delay_hours: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSave(flyer)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <MdSave size={14} />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
