"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function QRCodeScanner() {
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null); // Novo estado para armazenar a imagem base64 do QR Code
  const videoRef = useRef<HTMLVideoElement | null>(null); // Referência para o vídeo
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Referência para o canvas

  useEffect(() => {
    // Função para acessar a câmera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Usar a câmera traseira, se disponível
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // Requerido para iPhones
          videoRef.current.play();
        }

        requestAnimationFrame(scanQRCode);
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        setValidationMessage("❌ Não foi possível acessar a câmera");
      }
    };

    // Função para escanear o QR Code
    const scanQRCode = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            setQrResult(code.data);
            validateQRCode(code.data);
          } else {
            requestAnimationFrame(scanQRCode); // Continuar tentando se não encontrar o QR code
          }
        }
      }
    };

    // Iniciar a câmera assim que o componente for montado
    startCamera();

    // Limpar a câmera quando o componente for desmontado
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  async function validateQRCode(qrCode: string) {
    try {
      const response = await fetch(`${API_URL}/qrcode/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();

      if (data.success) {
        setQrImage(data.qrcode_base64); // Exibe a imagem do QR Code gerado
        setValidationMessage(`✅ QR Code válido! Evento: ${data.nome_do_evento}, Data: ${data.data_do_evento}`);
      } else {
        setValidationMessage(`❌ QR Code inválido: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao validar QR Code:", error);
      setValidationMessage("❌ Erro ao validar QR Code");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Escanear QR Code</h1>

      <video
        ref={videoRef}
        style={{ width: "100%", maxWidth: "500px" }}
        className="border-2 border-gray-300"
      ></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      {qrResult && (
        <div className="mt-4 bg-white p-4 rounded-md shadow-md">
          <p className="text-lg font-semibold">QR Code escaneado:</p>
          <p className="text-gray-700">{qrResult}</p>
        </div>
      )}

      {qrImage && (
        <div className="mt-4 bg-white p-4 rounded-md shadow-md">
          <p className="text-lg font-semibold">QR Code gerado:</p>
          <img src={`data:image/png;base64,${qrImage}`} alt="QR Code" />
        </div>
      )}

      {validationMessage && (
        <div
          className="mt-4 p-4 rounded-md shadow-md text-white text-center"
          style={{ backgroundColor: validationMessage.startsWith("✅") ? "green" : "red" }}
        >
          {validationMessage}
        </div>
      )}
    </div>
  );
}
