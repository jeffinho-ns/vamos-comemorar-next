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
  number?: string; // Mudado para string para alinhar com o PlaceModal
  neighborhood?: string; // Adicionado campo bairro
  city?: string; // Adicionado campo cidade
  state?: string; // Adicionado campo estado
  zipcode?: string; // Adicionado campo CEP
  latitude?: string; // Mudado para string para alinhar com o PlaceModal
  longitude?: string; // Mudado para string para alinhar com o PlaceModal
  status?: "active" | "inactive";
  visible?: boolean;
}

interface EditPlaceModalProps {
  isOpen: boolean;
  currentPlace: Place | null;
  onRequestClose: () => void;
  updatePlace: (place: Place) => void;
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
  const [number, setNumber] = useState<string>(""); // Mudado para string para alinhar com o PlaceModal
  const [neighborhood, setNeighborhood] = useState<string>(""); // Adicionado campo bairro
  const [city, setCity] = useState<string>(""); // Adicionado campo cidade
  const [state, setState] = useState<string>(""); // Adicionado campo estado
  const [zipcode, setZipcode] = useState<string>(""); // Adicionado campo CEP
  const [latitude, setLatitude] = useState<string>(""); // Mudado para string para alinhar com o PlaceModal
  const [longitude, setLongitude] = useState<string>(""); // Mudado para string para alinhar com o PlaceModal
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
      setNumber(currentPlace.number?.toString() || ""); // Convertendo para string
      setNeighborhood(currentPlace.neighborhood || ""); // Adicionando campo bairro
      setCity(currentPlace.city || ""); // Adicionando campo cidade
      setState(currentPlace.state || ""); // Adicionando campo estado
      setZipcode(currentPlace.zipcode || ""); // Adicionando campo CEP
      setLatitude(currentPlace.latitude?.toString() || ""); // Convertendo para string
      setLongitude(currentPlace.longitude?.toString() || ""); // Convertendo para string
      setStatus(currentPlace.status || "active");
      setVisible(currentPlace.visible !== undefined ? currentPlace.visible : true);
    }
  }, [currentPlace]);

  useEffect(() => {
    // Atualiza a logo quando uma nova imagem é selecionada
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

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
        imageUrl = data.imageUrl;
      }

      const dataToSend: Place = {
        id: currentPlace?.id,
        slug,
        name,
        email,
        description,
        logo: imageUrl,
        street,
        number, // Incluindo número
        neighborhood, // Incluindo bairro
        city, // Incluindo cidade
        state, // Incluindo estado
        zipcode, // Incluindo CEP
        latitude,
        longitude,
        status,
        visible,
      };

      const url = `http://localhost:5000/api/places/${currentPlace?.id}`;
      const response = await fetch(url, {
        method: "PUT",
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
      updatePlace(updatedPlace);
      onRequestClose();
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
      <div className="flex flex-col items-center mb-4">
        {logo && (
          <img
          src={`http://localhost:5000/uploads/${logo}`}
            alt="Logo"
            className="w-24 h-24 object-cover mb-4 border rounded-full shadow"
          />
        )}
        <h2 className="text-xl font-semibold">Editar Local</h2>
      </div>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          Slug:
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Nome:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </label>

        <label className="block">
          E-mail:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </label>

        <label className="block">
          Descrição:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Logo:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Endereço:
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Número:
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Bairro:
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Cidade:
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Estado:
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          CEP:
          <input
            type="text"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Latitude:
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="block">
          Longitude:
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <div className="flex items-center col-span-1">
          <label className="mr-2">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="p-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div className="flex items-center col-span-1">
          <label className="mr-2">Visível:</label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        <button
          type="submit"
          className="col-span-1 mt-4 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Atualizar
        </button>
      </form>
    </Modal>
  );
};

export default EditPlaceModal;
