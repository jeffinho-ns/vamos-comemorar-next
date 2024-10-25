"use client"; // Isso transforma o componente em um Client Component

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "../components/header/header";
import Footer from "../components/footer/footer"; 
import Modal from 'react-modal';

Modal.setAppElement('#app');

// Defina o tipo dos dados de reserva
interface ReservationData {
  guests: number;
  table: string;
  date: string;
  eventName: string;
}

const Confirmation = () => {
  // Atualize o tipo de reservationData para incluir null
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const logoSrc = "/path/to/logo.png";  // Defina o caminho da logo

  useEffect(() => {
    const fetchReservationData = async () => {
      const data: ReservationData = {
        guests: 4,
        table: "Mesa 5",
        date: "25/12/2024",
        eventName: "Festa de Natal"
      };
      setReservationData(data);
    };

    fetchReservationData();
  }, []);

  const handleCancelReservation = () => {
    alert("Reserva cancelada.");
  };

  const closeImage = () => {
    setExpandedImage(null);
  };

  return (
    <div id="app" className="flex flex-col min-h-screen relative">
      <Header className="fixed top-0 left-0 w-full z-50" /> {/* Ajuste de estilo */}
      <div id="home-container" className="flex flex-col flex-grow pt-24"> {/* Ajuste de padding-top */}
        <div className="relative z-10">
          <div className="bg-white p-5 text-center rounded-t-2xl -mt-6 z-50 relative">
            <h2 className="text-2xl font-bold">Reservas</h2>
            <div className="flex justify-between items-center pb-5">
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Detalhes da reserva</h1>
                <p className="text-gray-500">
                  Sua reserva está aprovada! Basta apresentar o QR code na entrada.
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex justify-center">
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            {reservationData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Pessoas</span>
                  <span className="font-bold text-gray-700">{reservationData.guests} Pessoas</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Mesas</span>
                  <span className="font-bold text-gray-700">{reservationData.table}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Data</span>
                  <span className="font-bold text-gray-700">{reservationData.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Evento</span>
                  <span className="font-bold text-gray-700">{reservationData.eventName}</span>
                </div>

                <div className="flex justify-center my-8">
                  <Image
                    src="https://via.placeholder.com/150"
                    alt="QR Code"
                    width={150}
                    height={150}
                    onClick={() => setExpandedImage("https://via.placeholder.com/150")}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex justify-center">
                  <button 
                    className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700"
                    onClick={handleCancelReservation}
                  >
                    Cancelar Reserva
                  </button>
                </div>
              </div>
            ) : (
              <p>Carregando detalhes da reserva...</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-200 p-4 text-center">
        <Footer />
      </div>

      <Modal
        isOpen={!!expandedImage}
        onRequestClose={closeImage}
        contentLabel="Image Modal"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl p-4 bg-white rounded-md"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75"
      >
        {expandedImage && (
          <Image
            src={expandedImage}
            alt="Expanded"
            layout="fill"
            objectFit="contain"
            className="w-full h-full object-contain"
          />
        )}
      </Modal>
    </div>
  );
};

export default Confirmation;
