import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "react-modal";

interface ReservationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  eventId: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onRequestClose, eventId }) => {
  const [reservationData, setReservationData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    if (isOpen && eventId) { // Verifica se o modal está aberto e se há um eventId
      fetch(`${API_URL}/api/reservas/${eventId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Falha ao carregar os dados da reserva");
          }
          return response.json();
        })
        .then((data) => {
          setReservationData(data);
          setError(null);
        })
        .catch((error) => {
          console.error("Erro ao buscar dados da reserva:", error);
          setError("Não foi possível carregar os dados da reserva.");
        });
    }
  }, [isOpen, eventId]); // Recarrega sempre que isOpen ou eventId mudar

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Reservation Modal"
      className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
      overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
    >
      {error ? (
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      ) : reservationData ? (
        <div>
          <div className="flex items-center mb-4">
            <Image
              src={`${API_URL}/uploads/${reservationData.imagem_do_evento}`}
              alt="Imagem do evento"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div className="ml-4">
              <h2 className="text-lg font-semibold">{reservationData.casa_do_evento}</h2>
              <p className="text-gray-500">Status</p>
              <p className={`font-semibold ${reservationData.status === "Aprovada" ? "text-green-600" : "text-yellow-600"}`}>
                {reservationData.status || "Aguardando"}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-gray-500">Data</p>
            <p className="text-gray-700">{new Date(reservationData.data_do_evento).toLocaleDateString()}</p>
          </div>
          <div className="text-center">
            <button
              onClick={() => router.push("/novasReservas")}
              className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700"
            >
              Novas Reservas
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Carregando...</p>
      )}
    </Modal>
  );
};

export default ReservationModal;
