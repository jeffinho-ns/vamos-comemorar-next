"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Reserva {
  id: number;
  casa_do_evento: string;
  data_do_evento: string;
  imagem_do_evento: string;
  nome_do_evento: string;
  status: string;
  user_id: number;
  quantidade_pessoas: number;
  qrcode: string | null; // A string base64 do QR code
}

export default function Confirmation() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [bannerSrc, setBannerSrc] = useState<string | null>(null); // Para armazenar o banner
  const [showPopup, setShowPopup] = useState<boolean>(false); // Para controlar a exibição do popup
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null); // Para armazenar o QR code a ser exibido
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const router = useRouter();

  useEffect(() => {
    const storedBanner = localStorage.getItem("lastPageBanner");
    if (storedBanner) {
      setBannerSrc(storedBanner);
    }

    const fetchReservas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reservas`);
        if (response.ok) {
          const data = await response.json();

          const userId = localStorage.getItem("userId");

          const reservasDoUsuario = data
            .filter((reserva: Reserva) => reserva.user_id === Number(userId))
            .map((reserva: Reserva) => ({
              ...reserva,
              imagem_do_evento: reserva.imagem_do_evento
                ? `${API_URL}/uploads/events/${reserva.imagem_do_evento}`
                : bannerSrc,
            }));

          setReservas(reservasDoUsuario);
        } else {
          console.error("Erro ao buscar reservas:", response.statusText);
        }
      } catch (error) {
        console.error("Erro ao buscar reservas:", error);
      }
    };

    fetchReservas();
  }, []);

  const handleQRCodeClick = (qrcode: string) => {
    setCurrentQRCode(qrcode); // Definindo o QR code a ser exibido no popup
    setShowPopup(true); // Exibindo o popup
  };

  const handleClosePopup = () => {
    setShowPopup(false); // Fechando o popup
    setCurrentQRCode(null); // Limpando o QR code atual
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Detalhes da Reserva</h2>
        {reservas.length > 0 ? (
          reservas.map((reserva) => (
            <div key={reserva.id} className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col items-center">
              <div className="mb-6">
                {reserva.imagem_do_evento ? (
                  <Image
                    src={reserva.imagem_do_evento} // URL da imagem do evento
                    alt="Banner do Evento"
                    width={90} // Tamanho ajustado
                    height={90} // Tamanho ajustado
                    className="w-full h-auto object-cover rounded-full" // Imagem arredondada
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600">Sem Imagem</span>
                  </div>
                )}
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-semibold text-gray-800">{reserva.nome_do_evento}</h3>
                <p className="text-gray-600"><strong>Casa da Reserva:</strong> {reserva.casa_do_evento || "Não especificado"}</p>
                <p className="text-gray-600"><strong>Data do Evento:</strong> {new Date(reserva.data_do_evento).toLocaleDateString()}</p>
                <p className="text-gray-600"><strong>Quantidade de Pessoas:</strong> {reserva.quantidade_pessoas || "Não especificado"}</p>

                {/* Exibindo o QR Code a partir da string base64 */}
                {reserva.qrcode ? (
                  <div className="mt-4 cursor-pointer">
                    <h4 className="text-lg font-semibold text-gray-800">QR Code da Reserva</h4>
                    <img
                      src={reserva.qrcode} // A string base64 diretamente no src
                      alt="QR Code da Reserva"
                      className="mx-auto"
                      style={{ width: 200, height: 200 }} // Ajuste do tamanho
                      onClick={() => handleQRCodeClick(reserva.qrcode)} // Abre o popup ao clicar
                    />
                  </div>
                ) : (
                  <p className="text-gray-600">QR Code não disponível.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-gray-500">Carregando detalhes das reservas...</p>
        )}
      </div>

      {/* Popup para exibir o QR Code em tamanho maior */}
      {showPopup && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
          onClick={handleClosePopup} // Fecha o popup ao clicar fora da imagem
        >
          <div className="relative bg-white p-4 rounded-md" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-white bg-red-500 rounded-full p-2"
              onClick={handleClosePopup}
            >
              X
            </button>
            <img
              src={currentQRCode || ""}
              alt="QR Code Ampliado"
              style={{ width: "600px", height: "600px" }} // Garantindo que a imagem tenha 1000px por 1000px
            />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
