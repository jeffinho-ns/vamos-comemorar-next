"use client";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiResponseData {
  success: boolean;
  message?: string;
  nome_do_evento?: string;
  data_do_evento?: string;
  nome_do_participante?: string; 
}

export default function QRCodeScanner() {
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [apiResponseData, setApiResponseData] = useState<ApiResponseData | null>(null);
  
  // Novos estados para detecção de câmera
  const [deviceHasCamera, setDeviceHasCamera] = useState<boolean | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // 1. useEffect para verificar a disponibilidade da câmera
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

  // Lógica de scan (mantida da sua versão anterior)
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

    if (code && code.data && code.data !== qrResult) {
      setQrResult(code.data);
      validateQRCode(code.data);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    } else if (!code) {
      if(qrResult && !isModalOpen && validationMessage && !validationMessage.startsWith("❌")) {
        // Considerar se qrResult deve ser limpo aqui ou não
      }
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    } else { // code existe, mas é o mesmo qrResult ou não é válido para nova tentativa
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    }
  };
  
  // 2. useEffect para iniciar a câmera e o scanner (condicional)
  useEffect(() => {
    const startCamera = async () => {
      if (!deviceHasCamera) { // Checagem extra
        if(initialCheckDone && !validationMessage?.startsWith("❌ Nenhuma webcam")){ // Se não tiver a msg especifica, define
            // setValidationMessage("ℹ️ Câmera não disponível ou não permitida.");
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Tenta a câmera traseira primeiro
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
        // Tenta com a câmera frontal como fallback (comum em desktops)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // Padrão (geralmente frontal)
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
            setDeviceHasCamera(false); // Atualiza o estado se falhar em iniciar
        }
      }
    };

    if (initialCheckDone && deviceHasCamera === true) {
      startCamera();
    }

    // Função de limpeza
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCheckDone, deviceHasCamera]); // Adicionado scanQRCode como dependência se ele for definido com useCallback e tiver dependências externas. Se não, pode omitir.

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
        setValidationMessage(
          `✅ Acesso Permitido! Evento: ${data.nome_do_evento || 'N/I'}.`
        );
        setIsModalOpen(true);
      } else {
        setValidationMessage(`❌ Acesso Negado: ${data.message || "QR Code inválido ou já utilizado."}`);
        // Reinicia o scan após erro para permitir nova tentativa
        if (!isModalOpen && deviceHasCamera && videoRef.current?.srcObject) {
           setTimeout(() => { // Pequeno delay para o usuário ler a mensagem
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = requestAnimationFrame(scanQRCode);
           }, 1500);
         }
      }
    } catch (error) {
      console.error("Erro ao validar QR Code:", error);
      setApiResponseData(null);
      setValidationMessage("❌ Erro de comunicação ao validar QR Code. Tente novamente.");
      if (!isModalOpen && deviceHasCamera && videoRef.current?.srcObject) {
        setTimeout(() => { // Pequeno delay
         if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = requestAnimationFrame(scanQRCode);
        }, 1500);
      }
    }
  }

  const closeModalAndScanAgain = () => {
    setIsModalOpen(false);
    setQrResult(null); // Limpa o resultado para permitir escanear o mesmo código novamente se necessário
    setValidationMessage(null);
    setApiResponseData(null);
    if (deviceHasCamera && videoRef.current && videoRef.current.srcObject && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(scanQRCode);
    } else if (deviceHasCamera === false && initialCheckDone) {
        // Se não tinha câmera, a mensagem informativa já deve estar visível
        setValidationMessage("ℹ️ Nenhuma webcam foi detectada neste computador.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Escanear QR Code do Ingresso</h1>

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
          <>
            <div className="bg-gray-800 p-1 rounded-lg shadow-2xl overflow-hidden relative">
              <video
                ref={videoRef}
                className="border-2 border-gray-700 rounded w-full h-auto"
                style={{ transform: "scaleX(-1)" }} // Espelha o vídeo para uma experiência "selfie" mais natural
              ></video>
               {/* Overlay com um "alvo" para o QR Code - Opcional */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 h-3/5 border-4 border-dashed border-blue-400 opacity-75 rounded-lg"></div>
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          </>
        )}
        
        {initialCheckDone && validationMessage && !isModalOpen && (
            <div
                className={`mt-6 p-4 rounded-md shadow-md text-white text-center font-semibold text-lg
                            ${ validationMessage.startsWith("✅") ? "bg-green-600" : 
                               validationMessage.startsWith("❌") ? "bg-red-600" : 
                               validationMessage.startsWith("ℹ️") ? "bg-blue-700" : // Mensagem de info
                               "bg-yellow-600" // Para "⌛ Validando..."
                            }`}
            >
                {validationMessage.startsWith("ℹ️ Nenhuma webcam") ? (
                <div className="text-left">
                    <p className="font-bold text-xl mb-3">ℹ️ Nenhuma webcam detectada!</p>
                    <p className="mb-2">Para escanear o QR Code utilizando este computador, uma webcam é necessária. Você pode:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-gray-200">
                    <li>Acessar esta página diretamente no seu smartphone ou tablet (que possuem câmera).</li>
                    <li>Conectar uma webcam externa ao seu computador e <button onClick={() => window.location.reload()} className="underline font-semibold text-blue-300 hover:text-blue-200 focus:outline-none">atualizar esta página</button>.</li>
                    <li>Utilizar um software que transforma seu celular em uma webcam para o computador (ex: DroidCam, Camo). Se já usa, verifique se está ativo e <button onClick={() => window.location.reload()} className="underline font-semibold text-blue-300 hover:text-blue-200 focus:outline-none">recarregue a página</button>.</li>
                    </ul>
                </div>
                ) : (
                validationMessage
                )}
            </div>
        )}

        {initialCheckDone && deviceHasCamera === true && qrResult && !isModalOpen && (
          <div className="mt-6 bg-gray-700 p-4 rounded-md shadow-md">
            <p className="text-lg font-semibold text-blue-300">Último QR Code escaneado:</p>
            <p className="text-gray-300 break-all">{qrResult}</p>
          </div>
        )}

      </div>

      {/* Modal de Sucesso (mantido da sua versão anterior) */}
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