"use client";

import { useId, useRef, useState } from "react";
import {
  J360_UPLOAD_ACCEPT,
  J360_UPLOAD_MAX_BYTES,
  j360Upload,
} from "../../lib/justino360/api";

type UploadResult = { success: boolean; data?: { url: string }; message?: string };
type UploadFn = (file: File) => Promise<UploadResult>;

/**
 * Campo de arquivo do documento: envia via API → Firebase Storage (j360Upload)
 * e devolve a URL final. Também aceita URL colada à mão (Drive, etc.).
 */
export function DocumentFileField({
  value,
  onChange,
  disabled,
  label = "Arquivo (PDF, imagem ou vídeo — até 15 MB)",
  uploadFn = j360Upload,
  uploadAccept = J360_UPLOAD_ACCEPT,
  uploadMaxBytes = J360_UPLOAD_MAX_BYTES,
  tone = "dark",
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  /** Sobrescreve o rótulo quando o campo não é um documento (ex.: material de apoio). */
  label?: string;
  uploadFn?: UploadFn;
  uploadAccept?: string;
  uploadMaxBytes?: number;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > uploadMaxBytes) {
      setError("Arquivo maior que 15 MB. Reduza ou envie um link.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadFn(file);
      if (res.success && res.data?.url) {
        onChange(res.data.url);
        setFileName(file.name);
      } else {
        setError(res.message || "Falha no envio do arquivo.");
      }
    } catch (err) {
      console.error("[j360] upload documento:", err);
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
        className={`block text-xs font-medium uppercase tracking-wide ${light ? "text-slate-500" : "text-gray-400"}`}
      >
        {label}
      </label>
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={uploadAccept}
        disabled={disabled || uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className={
          light
            ? "block w-full cursor-pointer rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:opacity-60"
            : "block w-full cursor-pointer rounded-lg bg-black/30 px-3 py-2 text-sm text-gray-300 ring-1 ring-white/10 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-900 disabled:opacity-60"
        }
      />
      {uploading && (
        <p className={`text-xs ${light ? "text-teal-700" : "text-amber-300"}`} role="status">
          Enviando arquivo…
        </p>
      )}
      {error && (
        <p className={`text-xs ${light ? "text-rose-600" : "text-red-300"}`} role="alert">
          {error}
        </p>
      )}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="ou cole aqui a URL do arquivo"
        aria-label="URL do arquivo"
        className={
          light
            ? "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
            : "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60 disabled:opacity-60"
        }
      />
      {value && (
        <div className={`flex items-center gap-2 text-xs ${light ? "text-slate-500" : "text-gray-400"}`}>
          <span className="truncate">{fileName || value}</span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 hover:underline ${light ? "text-teal-700" : "text-amber-400"}`}
          >
            Conferir
          </a>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFileName(null);
            }}
            className={`shrink-0 ${light ? "text-slate-500 hover:text-rose-600" : "text-gray-400 hover:text-red-300"}`}
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
