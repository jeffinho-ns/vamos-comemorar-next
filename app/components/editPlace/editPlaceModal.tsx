import Image from "next/image";
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
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  status?: "active" | "inactive";
  visible?: boolean;
  commodities?: Array<{ name: string; enabled: boolean }>;
  photos?: string[];
}

interface EditPlaceModalProps {
  isOpen: boolean;
  currentPlace: Place | null;
  onRequestClose: () => void;
  updatePlace: (place: Place) => void;
}

const commoditiesOptions = [
  { name: "Pet Friendly", icon: "🐶", description: "Aceita animais de estimação" },
  { name: "Área Aberta", icon: "🌳", description: "Possui área externa" },
  { name: "Acessível", icon: "♿", description: "Acessibilidade garantida" },
  { name: "Estacionamento", icon: "🚗", description: "Possui estacionamento" },
  { name: "+18", icon: "🍺", description: "Permitido apenas para maiores de 18 anos" },
  { name: "Mesas", icon: "🪑", description: "Possui mesas para os clientes" },
];

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
  const [number, setNumber] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zipcode, setZipcode] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [visible, setVisible] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // States for commodities and photos
  const [commodities, setCommodities] = useState(commoditiesOptions.map(option => ({ ...option, enabled: false })));
  const [photos, setPhotos] = useState<File[]>(Array(10).fill(null));
  const [previewPhotos, setPreviewPhotos] = useState<string[]>(Array(10).fill(""));
  const [logoUrl, setLogoUrl] = useState<string | null>(currentPlace?.logo || "");

  useEffect(() => {
    if (currentPlace) {
      setSlug(currentPlace.slug || "");
      setName(currentPlace.name);
      setEmail(currentPlace.email);
      setDescription(currentPlace.description || "");
      setLogo(currentPlace.logo || "");
      setStreet(currentPlace.street || "");
      setNumber(currentPlace.number?.toString() || "");
      setNeighborhood(currentPlace.neighborhood || "");
      setCity(currentPlace.city || "");
      setState(currentPlace.state || "");
      setZipcode(currentPlace.zipcode || "");
      setLatitude(currentPlace.latitude?.toString() || "");
      setLongitude(currentPlace.longitude?.toString() || "");
      setStatus(currentPlace.status || "active");
      setVisible(currentPlace.visible !== undefined ? currentPlace.visible : true);
      setCommodities(currentPlace.commodities || commoditiesOptions.map(option => ({ ...option, enabled: false })));
      setPreviewPhotos(currentPlace.photos || Array(10).fill("")); // Preencher com fotos existentes
    }
  }, [currentPlace]);

  useEffect(() => {
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

  const handleCommodityChange = (index: number) => {
    const updatedCommodities = [...commodities];
    updatedCommodities[index].enabled = !updatedCommodities[index].enabled;
    setCommodities(updatedCommodities);
  };

  const handlePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const updatedPhotos = [...photos];
      updatedPhotos[index] = file;
      setPhotos(updatedPhotos);

      const updatedPreviews = [...previewPhotos];
      updatedPreviews[index] = URL.createObjectURL(file);
      setPreviewPhotos(updatedPreviews);
    }
  };

  useEffect(() => {
    setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, ""));
  }, [name]);

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
        number,
        neighborhood,
        city,
        state,
        zipcode,
        latitude,
        longitude,
        status,
        visible,
        commodities,
        photos: previewPhotos.filter(photo => photo !== ""), // Filtrar fotos não selecionadas
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

  const renderCommoditiesSection = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4">Selecione as Commodities</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {commodities.map((commodity, index) => (
          <label key={index} className={`cursor-pointer flex items-center p-2 border rounded-md ${commodity.enabled ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
            <input type="checkbox" checked={commodity.enabled} onChange={() => handleCommodityChange(index)} className="hidden" />
            <span className="mr-2">{commodity.icon}</span>
            {commodity.name}
          </label>
        ))}
      </div>
    </div>
  );

  const renderPhotosSection = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4">Adicione Fotos</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {photos.map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            {previewPhotos[index] && (
              <Image src={previewPhotos[index]} alt={`Preview ${index + 1}`} className="w-20 h-20 mb-2" />
            )}
            <input type="file" onChange={(e) => handlePhotoChange(index, e)} accept="image/*" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Edit Place">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Editar Local</h2>
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        
        <div>
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Endereço</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Rua"
          />
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Número"
          />
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Bairro"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Cidade"
          />
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Estado"
          />
          <input
            type="text"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="CEP"
          />
        </div>
        <div>
          <label className="block mb-1">Latitude</label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Longitude</label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Logo</label>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
            accept="image/*"
          />
          {logoUrl && <Image src={`http://localhost:5000/uploads/${logoUrl}`} alt="Logo" className="w-20 h-20 mt-2" />}
        </div>
        
        {renderCommoditiesSection()}
        {renderPhotosSection()}

        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded mt-4">
          Atualizar Local
        </button>
      </form>
    </Modal>
  );
};

export default EditPlaceModal;