"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vamos-comemorar-api.onrender.com/api";
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
  }, [initialCheckDone, deviceHasCamera]);

  // ===================================================================
  // NOSSA NOVA LÓGICA DE SOCKET.IO
  // ===================================================================
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current.on("connect", () => console.log("Socket.IO Conectado!"));
    socketRef.current.on("brinde_liberado", (data: BrindeAlert) => setBrindeAlert(data));
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const scanQRCode = () => {
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
  };

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
        setValidationMessage(`${response.status === 409 ? '⚠️' : '❌'} ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      setValidationMessage("❌ Erro de comunicação com o servidor.");
    }
  }

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      
      {brindeAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-black p-4 rounded-lg shadow-lg animate-pulse w-11/12 max-w-lg">
          <h3 className="text-xl font-bold text-center">🎉 ALERTA DE BRINDE! 🎉</h3>
          <p className="text-center mt-2">{brindeAlert.mensagem}</p>
          <button onClick={() => setBrindeAlert(null)} className="absolute top-1 right-1 text-black font-bold">✖️</button>
        </div>
      )}

      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Escanear QR Code do Ingresso</h1>
        
        {initialCheckDone && deviceHasCamera && (
          <div className="bg-gray-800 p-1 rounded-lg shadow-2xl overflow-hidden relative">
            <video ref={videoRef} className="w-full h-auto" style={{ transform: "scaleX(-1)" }}></video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/5 h-3/5 border-4 border-dashed border-blue-400 opacity-75 rounded-lg"></div>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {validationMessage && !isModalOpen && (
            <div className={`mt-6 p-4 rounded-lg text-white font-semibold text-lg text-center ${
                validationMessage.startsWith("✅") ? "bg-green-600" : 
                validationMessage.startsWith("❌") ? "bg-red-600" : 
                validationMessage.startsWith("⚠️") ? "bg-orange-500" :
                "bg-yellow-600"
            }`}>
                <p>{validationMessage}</p>
            </div>
        )}
      </div>
       
       {isModalOpen && apiResponseData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-sm w-full border border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-400 mx-auto mb-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-3 text-green-300">Acesso Liberado!</h2>
            <p className="text-lg text-gray-200 mb-4">
              Participante: <span className="font-bold">{apiResponseData.convidado}</span>
            </p>
            <button
              onClick={closeModalAndScanAgain}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg text-lg"
            >
              OK (Escanear Próximo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}