"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { MdDownload, MdPrint, MdContentCopy, MdArrowBack } from "react-icons/md";

/** Link público absoluto do cardápio Galpão (QR code e cópia). */
const GALPAO_CARDAPIO_ABSOLUTE_URL =
  "https://www.agilizaiapp.com.br/cardapio/galpao";

const CARDAPIO_PATH = "/cardapio/galpao";
const QR_SIZE = 280;

export default function GalpaoQrCodePage() {
  const [targetUrl, setTargetUrl] = useState(GALPAO_CARDAPIO_ABSOLUTE_URL);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = useCallback(() => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode-cardapio-galpao.png";
    a.rel = "noopener";
    a.click();
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyUrl = useCallback(async () => {
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [targetUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-10 px-4 print:bg-white print:py-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link
            href={CARDAPIO_PATH}
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 text-sm font-medium"
          >
            <MdArrowBack className="w-5 h-5" />
            Voltar ao cardápio
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100 print:shadow-none print:border-0">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
            QR Code — Cardápio Galpão
          </h1>
          <p className="text-center text-slate-600 text-sm mb-6 print:text-base">
            Escaneie para abrir o cardápio no celular. Use os botões abaixo para
            salvar em PNG ou imprimir.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div
              ref={wrapRef}
              className="rounded-xl bg-white p-4 shadow-inner border border-slate-100 print:border print:p-6"
            >
              {targetUrl ? (
                <QRCodeCanvas
                  value={targetUrl}
                  size={QR_SIZE}
                  level="H"
                  includeMargin
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-slate-100 text-slate-500 text-sm"
                  style={{ width: QR_SIZE, height: QR_SIZE }}
                >
                  Carregando…
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center max-w-full break-all px-1 print:text-sm print:text-black">
              {targetUrl || "—"}
            </p>

            <div className="w-full space-y-3 print:hidden">
              <label className="block text-left w-full">
                <span className="text-xs font-medium text-slate-600 mb-1 block">
                  Ajustar URL do QR (opcional)
                </span>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder={GALPAO_CARDAPIO_ABSOLUTE_URL}
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value.trim())}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  O padrão é o link oficial acima; altere só se precisar de outro destino.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!targetUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdDownload className="w-5 h-5" />
                  Baixar PNG
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!targetUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  <MdPrint className="w-5 h-5" />
                  Imprimir
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyUrl}
                disabled={!targetUrl}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <MdContentCopy className="w-4 h-4" />
                {copied ? "Link copiado!" : "Copiar link"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
