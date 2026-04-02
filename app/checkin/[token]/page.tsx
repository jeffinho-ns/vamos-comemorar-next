"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'https://api.agilizaiapp.com.br';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  permissionGranted: boolean;
}

export default function SelfCheckInPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    permissionGranted: false,
  });
  const [guestIdentifier, setGuestIdentifier] = useState("");
  const [guestListInfo, setGuestListInfo] = useState<{
    ownerName: string;
    reservationDate: string;
  } | null>(null);

  // Solicitar permissão de localização ao carregar a página
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Carregar informações da lista
    const loadGuestListInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/api/guest-list/${token}`);
        if (res.ok) {
          const data = await res.json();
          setGuestListInfo({
            ownerName: data.guestList?.owner_name || "",
            reservationDate: data.guestList?.reservation_date || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar informações da lista:", error);
      }
    };

    loadGuestListInfo();

    // Solicitar localização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
            permissionGranted: true,
          });
          setLoading(false);
        },
        (error) => {
          let errorMessage = "Erro ao obter localização.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permissão de localização negada. É necessário permitir o acesso à localização para fazer o check-in.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Localização indisponível.";
              break;
            case error.TIMEOUT:
              errorMessage = "Tempo esgotado ao obter localização.";
              break;
          }
          setLocationState({
            latitude: null,
            longitude: null,
            error: errorMessage,
            permissionGranted: false,
          });
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationState({
        latitude: null,
        longitude: null,
        error: "Geolocalização não é suportada pelo seu navegador.",
        permissionGranted: false,
      });
      setLoading(false);
    }
  }, [token]);

  const handleSelfCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestIdentifier.trim()) {
      toast.error("Por favor, informe seu nome ou e-mail.");
      return;
    }

    if (!locationState.latitude || !locationState.longitude) {
      toast.error("Não foi possível obter sua localização. Verifique as permissões do navegador.");
      return;
    }

    setValidating(true);

    try {
      const res = await fetch(`${API_URL}/api/checkins/self-validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: guestIdentifier.trim(),
          latitude: locationState.latitude,
          longitude: locationState.longitude,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Check-in realizado com sucesso! 🎉");
        setTimeout(() => {
          router.push(`/lista/${token}`);
        }, 2000);
      } else {
        toast.error(data.error || "Erro ao realizar check-in. Verifique se você está no local e dentro do horário do evento.");
      }
    } catch (error) {
      console.error("Erro ao validar check-in:", error);
      toast.error("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!locationState.permissionGranted) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow border border-gray-100 p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Localização Necessária
            </h1>
            <p className="text-gray-600 text-sm">
              {locationState.error || "É necessário permitir o acesso à localização para fazer o check-in."}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Como permitir:</strong>
              <br />
              1. Clique no ícone de cadeado ou informações na barra de endereço
              <br />
              2. Procure por "Localização" ou "Location"
              <br />
              3. Selecione "Permitir" ou "Allow"
              <br />
              4. Recarregue esta página
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow border border-gray-100 p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Auto Check-in
          </h1>
          {guestListInfo && (
            <p className="text-gray-600 text-sm">
              Lista de: <strong>{guestListInfo.ownerName}</strong>
              {guestListInfo.reservationDate && (
                <>
                  <br />
                  Data: {new Date(guestListInfo.reservationDate + "T12:00:00").toLocaleDateString("pt-BR")}
                </>
              )}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Validação de Segurança:</strong>
            <br />
            • Você precisa estar no local do evento (raio de 30m)
            <br />
            • O check-in só é válido dentro do horário do evento
            <br />
            • Informe seu nome completo exatamente como está na lista
          </p>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>📍 Localização capturada:</strong>
            <br />
            Lat: {locationState.latitude?.toFixed(6)}, Long: {locationState.longitude?.toFixed(6)}
          </p>
        </div>

        <form onSubmit={handleSelfCheckIn} className="space-y-4">
          <div>
            <label htmlFor="guestIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              id="guestIdentifier"
              type="text"
              placeholder="Digite seu nome completo (exatamente como está na lista)"
              value={guestIdentifier}
              onChange={(e) => setGuestIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              disabled={validating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Informe seu nome completo exatamente como aparece na lista de convidados
            </p>
          </div>

          <button
            type="submit"
            disabled={validating || !guestIdentifier.trim()}
            className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {validating ? "Validando Presença..." : "Validar Presença"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/lista/${token}`)}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Voltar para a lista
          </button>
        </div>
      </div>
    </div>
  );
}

