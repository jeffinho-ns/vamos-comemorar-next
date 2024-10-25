import React, { useState, useEffect } from "react";
import Modal from "react-modal";

interface Place {
  id?: string;
  slug?: string;
  name: string;
  email: string;
  description?: string;
  logo?: string;
  street?: string;
  number?: number;
  latitude?: number;
  longitude?: number;
  status?: "active" | "inactive";
  visible?: boolean;
}

interface EditPlaceModalProps {
  isOpen: boolean; // Propriedade para controlar se o modal está aberto
  currentPlace: Place | null;
  onRequestClose: () => void;
  updatePlace: (place: Place) => void; // Função para atualizar o lugar
}

const EditPlaceModal: React.FC<EditPlaceModalProps> = ({
  isOpen,
  currentPlace,
  onRequestClose,
  updatePlace,
}) => {
  const [slug, setSlug] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [number, setNumber] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [visible, setVisible] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (currentPlace) {
      setSlug(currentPlace.slug || "");
      setName(currentPlace.name);
      setEmail(currentPlace.email);
      setDescription(currentPlace.description || "");
      setLogo(currentPlace.logo || "");
      setStreet(currentPlace.street || "");
      setNumber(currentPlace.number || 0);
      setLatitude(currentPlace.latitude || 0);
      setLongitude(currentPlace.longitude || 0);
      setStatus(currentPlace.status || "active");
      setVisible(currentPlace.visible !== undefined ? currentPlace.visible : true);
    }
  }, [currentPlace]);

  const validateForm = () => {
    if (!name || !email) {
      setErrorMessage("Nome e e-mail são obrigatórios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("Token não encontrado. Faça login novamente.");
      return;
    }

    try {
      let imageUrl = logo;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const response = await fetch("http://localhost:5000/api/uploads", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar a imagem");
        }

        const data = await response.json();
        imageUrl = data.imageUrl; // Supondo que o servidor retorne a URL da imagem
      }

      const dataToSend: Place = {
        id: currentPlace?.id, // Incluindo o ID do lugar atual
        slug,
        name,
        email,
        description,
        logo: imageUrl,
        street,
        number,
        latitude,
        longitude,
        status,
        visible,
      };

      const url = `http://localhost:5000/api/places/${currentPlace?.id}`;
      const response = await fetch(url, {
        method: "PUT", // Sempre usando PUT para atualizar
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar o local");
      }

      const updatedPlace = await response.json();
      updatePlace(updatedPlace); // Chama a função para atualizar o lugar na lista
      onRequestClose(); // Fecha o modal após a atualização
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      setErrorMessage("Ocorreu um erro ao atualizar o local. Tente novamente.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Place Modal"
      className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto p-6"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-xl font-semibold mb-4">Editar Local</h2>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Slug:
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Nome:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          E-mail:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Descrição:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Logo:
          <input
            type="text"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Rua:
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Número:
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Latitude:
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Longitude:
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <label className="block">
          Status:
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
        <label className="block">
          Visível:
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="ml-2"
          />
        </label>
        <label className="block">
          Upload de Imagem:
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </label>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white font-semibold py-2 px-4 rounded"
        >
          Salvar
        </button>
      </form>
    </Modal>
  );
};

export default EditPlaceModal;
