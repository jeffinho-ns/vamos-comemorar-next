"use client";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [qrResult, setQrResult] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (isScanning) {
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        const scanner = new Html5QrcodeScanner("reader", {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
         
        }, false);

        scanner.render(
          async (decodedText) => {
            setQrResult(decodedText);
            scanner.clear();
            setIsScanning(false);
            await validateQRCode(decodedText);
          },
          (errorMessage) => console.log(errorMessage)
        );
      });
    }
  }, [isScanning]);

  async function validateQRCode(qrCode: string) {
    try {
      const response = await fetch(`${API_URL}/api/reservas/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationMessage(`✅ Entrada aprovada para ${data.nome_do_evento} em ${data.data_do_evento}`);
      } else {
        setValidationMessage(`❌ QR Code inválido: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao validar QR Code:", error);
      setValidationMessage("❌ Erro ao conectar à API.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Escanear QR Code</h1>

      {!isScanning && (
        <button
          onClick={() => setIsScanning(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md"
        >
          Abrir Câmera
        </button>
      )}

      <div id="reader" className="mt-4"></div>

      {qrResult && (
        <div className="mt-4 bg-white p-4 rounded-md shadow-md">
          <p className="text-lg font-semibold">QR Code:</p>
          <p className="text-gray-700">{qrResult}</p>
        </div>
      )}

      {validationMessage && (
        <div className={`mt-4 p-4 rounded-md ${validationMessage.includes("✅") ? "bg-green-200" : "bg-red-200"}`}>
          <p className="text-lg font-semibold">{validationMessage}</p>
        </div>
      )}
    </div>
  );
}
