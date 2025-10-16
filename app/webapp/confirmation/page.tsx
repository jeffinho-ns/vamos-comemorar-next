"use client";

import React, { useState, useEffect, Suspense } from "react";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import { useSearchParams } from "next/navigation";
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
  qrcode: string | null;
}

function ReservationDetails() {
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [bannerSrc, setBannerSrc] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
  const searchParams = useSearchParams();
  const reservaId = searchParams?.get("id");

  useEffect(() => {
    const storedBanner = localStorage.getItem("lastPageBanner");
    const userId = localStorage.getItem("userId");

    if (storedBanner) {
      setBannerSrc(storedBanner);
    }

    if (!reservaId || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchReserva = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reservas/${reservaId}`);
        if (response.ok) {
          const data: Reserva = await response.json();
          if (data.user_id === Number(userId)) {
            setReserva({
              ...data,
              imagem_do_evento: data.imagem_do_evento
                ? `${BASE_IMAGE_URL}${data.imagem_do_evento}`
                : storedBanner || "",
            });
          } else {
            console.error("Reserva não pertence ao usuário logado.");
          }
        } else {
          console.error("Erro ao buscar reserva:", response.statusText);
        }
      } catch (error) {
        console.error("Erro ao buscar reserva:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReserva();
  }, [reservaId, API_URL]);

  const handleQRCodeClick = (qrcode: string) => {
    setCurrentQRCode(qrcode);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setCurrentQRCode(null);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Detalhes da Reserva
        </h2>
        {isLoading ? (
          <p className="text-center text-lg text-gray-500">
            Carregando detalhes da reserva...
          </p>
        ) : reserva ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col items-center">
            <div className="mb-6">
              {reserva.imagem_do_evento ? (
                <Image
                  src={reserva.imagem_do_evento}
                  alt="Banner do Evento"
                  width={90}
                  height={90}
                  className="w-full h-auto object-cover rounded-full"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600">Sem Imagem</span>
                </div>
              )}
            </div>
            <div className="space-y-4 text-center">
              <h3 className="text-2xl font-semibold text-gray-800">
                {reserva.nome_do_evento}
              </h3>
              <p className="text-gray-600">
                <strong>Casa da Reserva:</strong>{" "}
                {reserva.casa_do_evento || "Não especificado"}
              </p>
              <p className="text-gray-600">
                <strong>Data do Evento:</strong>{" "}
                {new Date(reserva.data_do_evento).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <strong>Quantidade de Pessoas:</strong>{" "}
                {reserva.quantidade_pessoas || "Não especificado"}
              </p>

              {reserva.qrcode ? (
                <div className="mt-4 cursor-pointer">
                  <h4 className="text-lg font-semibold text-gray-800">
                    QR Code da Reserva
                  </h4>
                  <div className="mx-auto w-52 h-52 bg-white p-4 shadow-lg rounded-xl transform transition-transform duration-300 hover:scale-105">
                    <Image
                      src={reserva.qrcode}
                      alt="QR Code da Reserva"
                      width={200}
                      height={200}
                      className="mx-auto rounded-md"
                      onClick={() => handleQRCodeClick(reserva.qrcode!)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">QR Code não disponível.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-lg text-gray-500">
            Não foi possível carregar os detalhes da reserva.
          </p>
        )}
      </div>

      {showPopup && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
          onClick={handleClosePopup}
        >
          <div
            className="relative bg-white bg-opacity-70 p-6 rounded-3xl shadow-2xl backdrop-blur-md border border-gray-200 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-600 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full p-2 transition"
              onClick={handleClosePopup}
            >
              X
            </button>
            <Image
              src={currentQRCode || ""}
              alt="QR Code Ampliado"
              width={300}
              height={300}
              className="rounded-lg border border-gray-300 shadow-lg"
            />
            <p className="text-lg text-gray-700 mt-4">
              QR Code da sua Reserva
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function Confirmation() {
  return (
    <Suspense fallback={<div>Carregando página...</div>}>
      <ReservationDetails />
    </Suspense>
  );
}
