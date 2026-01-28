"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vamos-comemorar-api.onrender.com";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://vamos-comemorar-api.onrender.com";

interface CheckinResponse {
  message: string;
  convidado: string;
}

interface BrindeAlert {
  brindeId: number;
  descricao: string;
  mensagem: string;
}

export default function QRCodeScanner() {
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [apiResponseData, setApiResponseData] = useState<CheckinResponse | null>(null);
  const [deviceHasCamera, setDeviceHasCamera] = useState<boolean | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [brindeAlert, setBrindeAlert] = useState<BrindeAlert | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  async function validateQRCode(qrCodeValue: string) {
    setValidationMessage("⌛ Validando QR Code...");
    try {
      const response = await fetch(`${API_URL}/api/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeData: qrCodeValue }),
      });
      const data = await response.json();
      if (response.ok) {
        setValidationMessage(`✅ Acesso Permitido!`);
        setApiResponseData(data as CheckinResponse);
        setIsModalOpen(true);
      } else {
        const msg = response.status === 409 && (data as { checkin_time_formatted?: string }).checkin_time_formatted
          ? `ALERTA: Este cliente já entrou às ${(data as { checkin_time_formatted: string }).checkin_time_formatted}.`
          : (data as { message?: string }).message || 'Erro desconhecido';
        setValidationMessage(`${response.status === 409 ? '⚠️ ' : '❌ '}${msg}`);
      }
    } catch (error) {
      setValidationMessage("❌ Erro de comunicação com o servidor.");
    }
  }

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code && code.data && code.data !== qrResult) {
        setQrResult(code.data);
        validateQRCode(code.data);
      } else {
        animationFrameId.current = requestAnimationFrame(scanQRCode);
      }
    }
  }, [qrResult]);

  // ===================================================================
  // SUA LÓGICA DE CÂMERA ORIGINAL (CORRETA E RESTAURADA)
  // ===================================================================
  useEffect(() => {
    const checkCameraAvailability = async () => {
      if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
        setValidationMessage("❌ Seu navegador não suporta acesso à câmera.");
        setDeviceHasCamera(false);
        setInitialCheckDone(true);
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoInputDevices.length > 0) {
          setDeviceHasCamera(true);
          setValidationMessage(null); 
        } else {
          setDeviceHasCamera(false);
          setValidationMessage("ℹ️ Nenhuma webcam foi detectada.");
        }
      } catch (err) {
        setDeviceHasCamera(false);
        setValidationMessage("❌ Ocorreu um erro ao detectar sua webcam.");
      } finally {
        setInitialCheckDone(true);
      }
    };
    checkCameraAvailability();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      if (!deviceHasCamera || !videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(scanQRCode);
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        setValidationMessage("❌ Não foi possível acessar a câmera. Verifique as permissões.");
        setDeviceHasCamera(false);
      }
    };

    if (initialCheckDone && deviceHasCamera) {
      startCamera();
    }
    
    const videoElement = videoRef.current;
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initialCheckDone, deviceHasCamera, scanQRCode]);

  // ===================================================================
  // NOSSA NOVA LÓGICA DE SOCKET.IO
  // ===================================================================
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current.on("connect", () => console.log("Socket.IO Conectado!"));
    socketRef.current.on("brinde_liberado", (data: BrindeAlert) => setBrindeAlert(data));
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const closeModalAndScanAgain = () => {
    setIsModalOpen(false);
    setQrResult(null);
    setValidationMessage(null);
    setApiResponseData(null);
    if (deviceHasCamera) {
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Scanner QR Code</h1>
          <p className="text-gray-400 text-lg">Escanear QR Code do Ingresso</p>
        </div>
      
        {brindeAlert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 p-6 rounded-2xl shadow-2xl animate-pulse w-11/12 max-w-lg border border-yellow-300">
            <h3 className="text-xl font-bold text-center">🎉 ALERTA DE BRINDE! 🎉</h3>
            <p className="text-center mt-2 font-semibold">{brindeAlert.mensagem}</p>
            <button onClick={() => setBrindeAlert(null)} className="absolute top-2 right-3 text-gray-900 font-bold text-lg hover:text-gray-700 transition-colors">✖️</button>
          </div>
        )}

        <div className="w-full max-w-md mx-auto">
          {initialCheckDone && deviceHasCamera && (
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200/20">
              <video ref={videoRef} className="w-full h-auto rounded-xl" style={{ transform: "scaleX(-1)" }}></video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 h-3/5 border-4 border-dashed border-yellow-400 opacity-75 rounded-xl"></div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

          {validationMessage && !isModalOpen && (
            <div className={`mt-6 p-6 rounded-2xl text-white font-semibold text-lg text-center shadow-lg border ${
              validationMessage.startsWith("✅") ? "bg-gradient-to-r from-green-500 to-green-600 border-green-400" : 
              validationMessage.startsWith("❌") ? "bg-gradient-to-r from-red-500 to-red-600 border-red-400" : 
              validationMessage.startsWith("⚠️") ? "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400" :
              "bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-400"
            }`}>
              <p>{validationMessage}</p>
            </div>
          )}
        </div>
       
        {isModalOpen && apiResponseData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-gray-200/20">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Acesso Liberado!</h2>
              <p className="text-lg text-gray-600 mb-6">
                Participante: <span className="font-bold text-gray-800">{apiResponseData.convidado}</span>
              </p>
              <button
                onClick={closeModalAndScanAgain}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
              >
                OK (Escanear Próximo)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}