"use client";

import { useId, useRef, useState } from "react";
import {
  J360_UPLOAD_ACCEPT,
  J360_UPLOAD_MAX_BYTES,
  j360Upload,
} from "../../lib/justino360/api";

/**
 * Evidência de manutenção: foto do serviço, laudo ou vídeo.
 * Sobe pela API → Firebase Storage (j360Upload) e devolve a URL final.
 */
export function EvidenceField({
  value,
  onChange,
  label = "Foto do serviço ou laudo (até 15 MB)",
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > J360_UPLOAD_MAX_BYTES) {
      setError("Arquivo maior que 15 MB. Reduza ou envie um link.");
      return;
    }
    setUploading(true);
    try {
      const res = await j360Upload(file);
      if (res.success && res.data?.url) {
        onChange(res.data.url);
      } else {
        setError(res.message || "Falha no envio do arquivo.");
      }
    } catch (err) {
      console.error("[j360] upload evidência manutenção:", err);
      setError("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-xs font-medium uppercase tracking-wide text-gray-400"
      >
        {label}
      </label>
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={J360_UPLOAD_ACCEPT}
        disabled={disabled || uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="block w-full cursor-pointer rounded-lg bg-black/30 px-3 py-2 text-sm text-gray-300 ring-1 ring-white/10 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-900 disabled:opacity-60"
      />
      {uploading && (
        <p className="text-xs text-amber-300" role="status">
          Enviando evidência…
        </p>
      )}
      {error && (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      {value && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-amber-400 hover:underline"
          >
            Conferir evidência
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 text-gray-400 hover:text-red-300"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
