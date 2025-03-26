"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr"; // Não se esqueça de instalar a dependência 'jsqr'

export default function ScanQRCodePage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraPermission(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setCameraPermission(false);
      setError("Erro ao acessar a câmera. Tente novamente.");
    }
  };

  useEffect(() => {
    // Tenta iniciar a câmera assim que o componente for montado
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      startCamera();
    } else {
      setError("O navegador não suporta o acesso à câmera.");
    }
  }, []);

  const captureQR = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const code = jsQR(imageData.data, canvasRef.current.width, canvasRef.current.height);

        if (code) {
          setScanResult(code.data);
          sendQRCodeToBackend(code.data);
        }
      }
    }
  };

  const sendQRCodeToBackend = async (qrData: string) => {
    try {
      const response = await fetch("/api/validate-qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: qrData }),
      });

      if (response.ok) {
        router.push(`/reservation/${qrData}`);
      } else {
        setError("Erro ao validar o QR Code. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao enviar QR Code para o backend:", err);
      setError("Erro de comunicação com o servidor.");
    }
  };

  useEffect(() => {
    const interval = setInterval(captureQR, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStartCamera = () => {
    if (cameraPermission === null || cameraPermission === false) {
      setCameraPermission(false);
      startCamera();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h2 className="text-2xl font-semibold mb-4">Escanear QR Code</h2>

      <button
        onClick={handleStartCamera}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        Abrir Câmera
      </button>

      {cameraPermission === null ? (
        <p>Verificando permissões de câmera...</p>
      ) : !cameraPermission ? (
        <div>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600">Certifique-se de que o navegador tenha permissão para acessar a câmera.</p>
        </div>
      ) : (
        <div className="w-full max-w-md p-4 bg-white shadow-lg rounded-lg">
          <video ref={videoRef} className="w-full h-64" />
          <canvas ref={canvasRef} className="hidden" width="640" height="480"></canvas>
        </div>
      )}

      {scanResult && (
        <p className="mt-4 text-green-600 font-semibold">QR Code: {scanResult}</p>
      )}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
