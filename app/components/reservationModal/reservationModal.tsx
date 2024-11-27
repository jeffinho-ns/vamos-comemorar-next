import { useState, useEffect } from "react";
import Modal from "react-modal";
import Image from "next/image";
import icon1 from "../../assets/icones/area.png";
import icon2 from "../../assets/icones/acessivel.png";
import icon3 from "../../assets/icones/estacionamento.png";
import icon4 from "../../assets/icones/18.png";
import icon5 from "../../assets/icones/mesa.png";



interface ReservationModalProps {
  eventData: any;
  userId: number | null;
  API_URL: string;
  onClose: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  eventData,
  userId,
  API_URL,
  onClose,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(true);
  const [quantidadePessoas, setQuantidadePessoas] = useState(1);
  const [mesas, setMesas] = useState("1 Mesa / 6 cadeiras");
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [comboImage, setComboImage] = useState<string | null>(null);
  const [observacao, setObservacao] = useState<string>("");

  useEffect(() => {
    const storedLogo = localStorage.getItem("lastPageLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo);
    } else if (eventData?.casa_do_evento) {
      const casaToIdMap: Record<string, number> = {
        "Oh Freguês": 4,
        "Seu Justino": 1,
        "Pracinha do Seu Justino": 8,
        "High Line": 7,
      };

      const casaId = casaToIdMap[eventData.casa_do_evento];

      if (casaId) {
        fetch(`${API_URL}/api/places/${casaId}`)
          .then((res) => res.json())
          .then((data) => {
            setLogoSrc(data?.logo ? `${API_URL}/uploads/${data.logo}` : null);
          })
          .catch(() => setLogoSrc(null));
      }
    }

    if (eventData) {
      setComboImage(eventData.imagem_do_combo);
      setObservacao(eventData.observacao || "Sem observação.");
    }
  }, [eventData, API_URL]);

  const closeModal = () => {
    setModalIsOpen(false);
    onClose();
  };

  const handleSubmitReservation = async () => {
    if (!eventData || !userId) {
      alert("Dados do evento ou do usuário estão ausentes.");
      return;
    }

    const reservationData = {
      userId,
      eventId: eventData.id,
      quantidade_pessoas: quantidadePessoas,
      mesas,
      data_da_reserva: new Date().toISOString().split("T")[0],
      casa_da_reserva: eventData.casa_do_evento,
    };

    try {
      const response = await fetch(`${API_URL}/api/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        alert("Reserva confirmada!");
        closeModal();
      } else {
        alert("Erro ao criar a reserva.");
      }
    } catch (error) {
      console.error("Erro ao enviar reserva:", error);
      alert("Erro ao criar a reserva.");
    }
  };

  return (
<Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  contentLabel="Confirmação de Reserva"
  ariaHideApp={false}
  className="bg-white p-6 rounded-lg w-11/12 max-w-3xl mx-auto max-h-[75vh] overflow-auto"
  overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
>
  <div className="flex flex-col gap-4">
    <div className="flex gap-4">
      <div className="relative w-2/5 h-36">
        <Image
          src={`${API_URL}/uploads/events/${eventData.imagem_do_evento}`}
          alt={eventData.nome_do_evento}
          fill
          objectFit="cover"
          className="rounded-lg"
          unoptimized
        />
      </div>
      <div className="flex flex-col justify-between items-center w-3/5 text-center">
        <h2 className="text-lg font-bold">{eventData.nome_do_evento}</h2>
        <div className="flex justify-around gap-2 mt-2">
          {[icon1, icon2, icon3, icon4, icon5].map((icon, index) => (
            <div className="flex flex-col items-center text-center" key={index}>
              <Image src={icon} alt={`Ícone ${index + 1}`} width={32} height={32} />
              <p className="text-xs mt-1">{["Área", "Acessível", "Estacionamento", "18+", "Mesa"][index]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <span>Data:</span>
        <span>{new Date(eventData.data_do_evento).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="flex justify-between">
        <span>Hora:</span>
        <span>{eventData.hora_do_evento}</span>
      </div>
      <div className="flex justify-between">
        <span>Local:</span>
        <span>{eventData.local_do_evento}</span>
      </div>
      <div className="flex justify-between">
        <span>Casa da Reserva:</span>
        <span>{eventData.casa_do_evento}</span>
      </div>
      <div className="flex justify-between">
        <span>Valor da Entrada:</span>
        <span>R$ {Number(eventData.valor_da_entrada).toFixed(2)}</span>
      </div>
    </div>

    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[30%]">
        <label htmlFor="quantidadePessoas" className="text-sm font-medium">
          Quantidade de Pessoas:
        </label>
        <select
          id="quantidadePessoas"
          value={quantidadePessoas}
          onChange={(e) => {
            const newQuantidadePessoas = Number(e.target.value);
            setQuantidadePessoas(newQuantidadePessoas);
            setMesas(
              `${Math.ceil(newQuantidadePessoas / 6)} Mesa${
                Math.ceil(newQuantidadePessoas / 6) > 1 ? "s" : ""
              } / 6 cadeiras`
            );
          }}
          className="border rounded px-2 py-1 w-full"
        >
          {[...Array(20)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[30%]">
        <label className="text-sm font-medium">Número de Mesas:</label>
        <input
          type="text"
          value={mesas}
          readOnly
          className="border rounded px-2 py-1 w-full bg-gray-100"
        />
      </div>
    </div>

    {comboImage && (
      <div className="flex flex-col items-center mt-4">
        <div className="w-48 h-48 mb-2 rounded-lg overflow-hidden">
          <Image
            src={`${API_URL}/uploads/events/${eventData.imagem_do_combo}`}
            alt="Imagem do Combo"
            layout="responsive"
            width={192}
            height={192}
            objectFit="cover"
          />
        </div>
        {observacao && (
          <p className="text-center text-sm font-medium text-gray-700">{observacao}</p>
        )}
      </div>
    )}

    <div className="flex gap-4">
      <button
        onClick={handleSubmitReservation}
        className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Confirmar Reserva
      </button>
      <button
        onClick={closeModal}
        className="flex-1 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
      >
        Fechar
      </button>
    </div>
  </div>
</Modal>


  );
};

export default ReservationModal;
