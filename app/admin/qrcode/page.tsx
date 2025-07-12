"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Interface para a resposta da API (mantida)
interface ApiResponseData {
  success: boolean;
  message?: string;
  nome_do_evento?: string;
  data_do_evento?: string;
  nome_do_participante?: string;
}

// NOVA INTERFACE: Para os dados dentro do QR Code
interface QrCodeData {
  reservaId: number;
  userId: number;
  eventId: number;
  nomeDoEvento: string;
  dataDoEvento: string;
  horaDoEvento: string;
  localDoEvento: string;
  casaDaReserva: string;
  quantidadePessoas: number;
  mesas: string;
  status: string;
  userName: string;
  userEmail: string;
}

export default function QRCodeScanner() {
  const [qrResult, setQrResult] = useState<string | null>(null);
  // NOVO ESTADO: Para guardar o JSON do QR Code já interpretado (parsed)
  const [parsedQrData, setParsedQrData] = useState<QrCodeData | null>(null);
  
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [apiResponseData, setApiResponseData] = useState<ApiResponseData | null>(null);
  const [deviceHasCamera, setDeviceHasCamera] = useState<boolean | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // ... (os useEffects de câmera podem ser mantidos exatamente como estão) ...
  useEffect(() => {
    const checkCameraAvailability = async () => {
      if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
        setValidationMessage("❌ Seu navegador não suporta acesso à câmera para escanear QR Codes.");
        setDeviceHasCamera(false);
        setInitialCheckDone(true);
        return;
      }
 

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoInputDevices.length > 0) {
          setDeviceHasCamera(true);
          // Limpa mensagem caso houvesse erro anterior, para permitir que startCamera prossiga
          setValidationMessage(null); 
        } else {
          setDeviceHasCamera(false);
          setValidationMessage("ℹ️ Nenhuma webcam foi detectada neste computador.");
        }
      } catch (err) {
        console.error("Erro ao verificar dispositivos de câmera:", err);
        setDeviceHasCamera(false);
        setValidationMessage("❌ Ocorreu um erro ao tentar detectar sua webcam. Verifique as permissões.");
      } finally {
        setInitialCheckDone(true);
      }
    };

    checkCameraAvailability();
  }, []);


    useEffect(() => {
    const startCamera = async () => {
      if (!deviceHasCamera) {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = requestAnimationFrame(scanQRCode);
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.setAttribute("playsinline", "true");
              await videoRef.current.play();
              if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
              animationFrameId.current = requestAnimationFrame(scanQRCode);
            }
        } catch (fallbackErr) {
            console.error("Erro ao acessar câmera (fallback):", fallbackErr);
            setValidationMessage("❌ Não foi possível acessar a câmera. Verifique as permissões e se outra aplicação a está usando.");
            setDeviceHasCamera(false);
        }
      }
    };

    if (initialCheckDone && deviceHasCamera === true) {
      startCamera();
    }
    
    // Captura o valor da ref para usar na limpeza de forma segura.
    const videoElement = videoRef.current;

    // Função de limpeza
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      // Usa a variável capturada para garantir que estamos acessando a referência correta.
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCheckDone, deviceHasCamera]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended || !deviceHasCamera) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameId.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });

    // ALTERADO: Lógica de interpretação do JSON
    if (code && code.data && code.data !== qrResult) {
      setQrResult(code.data);

      try {
        // Tenta interpretar a string como JSON
        const parsedData = JSON.parse(code.data);
        setParsedQrData(parsedData); // Armazena o objeto no novo estado
      } catch (e) {
        console.error("QR Code não continha JSON válido:", e);
        setParsedQrData(null); // Limpa se não for um JSON válido
      }

      validateQRCode(code.data);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    } else {
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    }
  };

  async function validateQRCode(qrCodeValue: string) {
    setValidationMessage("⌛ Validando QR Code...");
    try {
      const response = await fetch(`${API_URL}/qrcode/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrCodeValue }),
      });
      const data: ApiResponseData = await response.json();
      setApiResponseData(data);

      if (data.success) {
        setValidationMessage(`✅ Acesso Permitido!`); // Mensagem mais limpa
        setIsModalOpen(true);
      } else {
        setValidationMessage(`❌ Acesso Negado: ${data.message || "QR Code inválido ou já utilizado."}`);
      }
    } catch (error) {
      console.error("Erro ao validar QR Code:", error);
      setApiResponseData(null);
      setValidationMessage("❌ Erro de comunicação ao validar QR Code. Tente novamente.");
    }
  }

  // ALTERADO: Limpa o novo estado ao fechar o modal
  const closeModalAndScanAgain = () => {
    setIsModalOpen(false);
    setQrResult(null);
    setParsedQrData(null); // Limpa os dados formatados
    setValidationMessage(null);
    setApiResponseData(null);
    if (deviceHasCamera && videoRef.current?.srcObject) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    }
  };

  // Componente para renderizar os detalhes de forma bonita
  const InfoCard = ({ icon, label, value }: { icon: JSX.Element; label: string; value: string | undefined }) => (
    <div className="flex items-start text-left">
      <div className="flex-shrink-0 w-6 h-6 mr-3 text-blue-400">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-gray-400">{label}</p>
        <p className="text-md text-gray-100">{value || "Não informado"}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Escanear QR Code do Ingresso</h1>
        
        {/* ... (Toda a lógica de verificação de câmera pode ser mantida como está) ... */}
        {!initialCheckDone && (
          <div className="text-center p-4 text-lg">
            <svg aria-hidden="true" className="inline w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-500 mr-2" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            Verificando disponibilidade da câmera...
          </div>
        )}

        {initialCheckDone && deviceHasCamera === true && (
          <div className="bg-gray-800 p-1 rounded-lg shadow-2xl overflow-hidden relative">
            <video ref={videoRef} className="w-full h-auto" style={{ transform: "scaleX(-1)" }}></video>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/5 h-3/5 border-4 border-dashed border-blue-400 opacity-75 rounded-lg"></div>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {/* ALTERADO: Lógica de exibição da mensagem e dos dados */}
        {initialCheckDone && validationMessage && !isModalOpen && (
            <div
                className={`mt-6 p-4 rounded-lg shadow-md text-white font-semibold text-lg
                            ${ validationMessage.startsWith("✅") ? "bg-green-600" : 
                               validationMessage.startsWith("❌") ? "bg-red-600" : 
                               validationMessage.startsWith("ℹ️") ? "bg-blue-700" :
                               "bg-yellow-600"
                            }`}
            >
                {/* Lógica para mensagem de falta de câmera continua a mesma */}
                {validationMessage.startsWith("ℹ️ Nenhuma webcam") ? (
                  <div className="text-left">...</div>
                ) : (
                  <div className="flex items-center justify-center">
                    {/* Ícone de Erro */}
                    {validationMessage.startsWith("❌") && 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }
                    <p>{validationMessage}</p>
                  </div>
                )}
            </div>
        )}
        
        {/* NOVO: Card de informações do QR Code lido */}
        {initialCheckDone && parsedQrData && !isModalOpen && (
          <div className="mt-6 bg-gray-800 p-5 rounded-lg shadow-md border border-gray-700">
            <h3 className="text-xl font-bold text-blue-300 mb-4 border-b border-gray-700 pb-3">Informações do Ingresso</h3>
            <div className="space-y-4">
              <InfoCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                label="Participante"
                value={parsedQrData.userName}
              />
              <InfoCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 14.25h.008v.008H-7.5v-.008z" /></svg>}
                label="Evento"
                value={parsedQrData.nomeDoEvento}
              />
              <InfoCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Data e Hora"
                value={`${new Date(parsedQrData.dataDoEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${parsedQrData.horaDoEvento}`}
              />
               <InfoCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>}
                label="Local"
                value={`${parsedQrData.casaDaReserva} - ${parsedQrData.localDoEvento}`}
              />
               <InfoCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3 3 0 0110.5 9.75v-.75a3 3 0 013-3h.75a3 3 0 013 3v.75m-6 3.75a3 3 0 01-3-3V9.75a3 3 0 013-3h.75a3 3 0 013 3v.75m0 0a3 3 0 01-3 3m0 3.75a3 3 0 01-3-3V9.75a3 3 0 013-3h.75a3 3 0 013 3v.75M9 12h6M9 15h6M9 18h6m-6-4.5v.75a3 3 0 01-3 3h-.75a3 3 0 01-3-3v-.75a3 3 0 013-3h.75a3 3 0 013 3z" /></svg>}
                label="Reserva"
                value={`${parsedQrData.quantidadePessoas} pessoa(s) - ${parsedQrData.mesas}`}
              />
            </div>
          </div>
        )}

      </div>
       {/* Modal de Sucesso */}
       {isModalOpen && apiResponseData?.success && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100">
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl text-center max-w-sm w-full transform transition-all duration-300 ease-in-out scale-100 border border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 md:h-20 md:w-20 text-green-400 mx-auto mb-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-green-300">Acesso Liberado!</h2>
            <p className="text-lg text-gray-200 mb-2">O cliente pode entrar no evento.</p>
            
            {apiResponseData.nome_do_evento && (
              <p className="text-sm text-gray-400 mb-1">
                <strong>Evento:</strong> {apiResponseData.nome_do_evento}
              </p>
            )}
            {apiResponseData.data_do_evento && (
              <p className="text-sm text-gray-400 mb-1">
                <strong>Data:</strong> {new Date(apiResponseData.data_do_evento + "T00:00:00").toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </p>
            )}
             {apiResponseData?.nome_do_participante && (
              <p className="text-sm text-gray-400 mb-4">
                <strong>Participante:</strong> {apiResponseData.nome_do_participante}
              </p>
            )}

            <button
              onClick={closeModalAndScanAgain}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 mt-6"
            >
              OK (Escanear Próximo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}