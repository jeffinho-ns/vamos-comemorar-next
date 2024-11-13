import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Image from "next/image";
import { Place } from "../types";

interface PlaceModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  addPlace: (newPlace: Place) => void;
  place?: Place | null;
}

export default function PlaceModal({ isOpen, onRequestClose, addPlace, place }: PlaceModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(place?.name || "");
  const [email, setEmail] = useState(place?.email || "");
  const [phone, setPhone] = useState(place?.phone || "");
  const [address, setAddress] = useState(place?.address || "");
  const [number, setNumber] = useState(place?.number || "");
  const [neighborhood, setNeighborhood] = useState(place?.neighborhood || "");
  const [city, setCity] = useState(place?.city || "");
  const [state, setState] = useState(place?.state || "");
  const [zipcode, setZipcode] = useState(place?.zipcode || "");
  const [description, setDescription] = useState(place?.description || "");
  const [latitude, setLatitude] = useState(place?.latitude || "");
  const [longitude, setLongitude] = useState(place?.longitude || "");
  const [slug, setSlug] = useState(place?.slug || "");
  const [status, setStatus] = useState(place?.status || "active");
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const commoditiesOptions = [
    { name: "Pet Friendly", icon: "🐶", description: "Aceita animais de estimação" },
    { name: "Área Aberta", icon: "🌳", description: "Possui área externa" },
    { name: "Acessível", icon: "♿", description: "Acessibilidade garantida" },
    { name: "Estacionamento", icon: "🚗", description: "Possui estacionamento" },
    { name: "+18", icon: "🍺", description: "Permitido apenas para maiores de 18 anos" },
    { name: "Mesas", icon: "🪑", description: "Possui mesas para os clientes" },
  ];

  const [commodities, setCommodities] = useState(commoditiesOptions.map(option => ({ ...option, enabled: false })));
  const [photos, setPhotos] = useState<File[]>(Array(10).fill(null));
  const [previewPhotos, setPreviewPhotos] = useState<string[]>(Array(10).fill(""));
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(place?.logo || "");

  useEffect(() => {
    setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, ""));
  }, [name]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoUrl(URL.createObjectURL(file));
    }
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

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        return data.url; // Assuming the API returns the file URL in `data.url`
      } else {
        console.error("Failed to upload file:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();

    // Adiciona dados textuais
    formData.append("id", place?.id || "");
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("number", number);
    formData.append("neighborhood", neighborhood);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("zipcode", zipcode);
    formData.append("description", description);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    formData.append("slug", slug);
    formData.append("status", status);

    // Adiciona logo, se houver
    if (logo) {
        formData.append("logo", logo);
    }

    // Adiciona as comodidades
    formData.append("commodities", JSON.stringify(
        commodities.map((commodity) => ({
            name: commodity.name,
            enabled: commodity.enabled,
        }))
    ));

    // Adiciona as fotos, se houver
    photos.forEach((photo, index) => {
        if (photo) {
            formData.append(`photos`, photo);
        }
    });

    try {
        const response = await fetch(`${API_URL}/api/places`, {
            method: place ? "PUT" : "POST",
            body: formData,
        });

        if (response.ok) {
            const createdPlace = await response.json();
            addPlace(createdPlace);
            onRequestClose();
        } else {
            console.error("Failed to submit place:", response.statusText);
        }
    } catch (error) {
        console.error("Error submitting place:", error);
    }
};



  const handleCommodityChange = (index: number) => {
    const updatedCommodities = [...commodities];
    updatedCommodities[index].enabled = !updatedCommodities[index].enabled;
    setCommodities(updatedCommodities);
  };

  const renderStepOne = () => (
    <div>
      <div className="flex flex-col items-center mb-6">
        {logoUrl && (
          <Image src={logoUrl} alt="Pré-visualização da Logo" className="w-24 h-24 object-cover rounded-full mb-4 shadow-lg" width={64} height={64} />
        )}
        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 hover:bg-blue-700">
          Selecione uma Logo
          <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" required />
        <input type="text" placeholder="Slug" value={slug} readOnly className="w-full p-2 rounded-md border-gray-300 bg-gray-100 mt-2" />
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" required />
        <input type="text" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="Número" value={number} onChange={(e) => setNumber(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="Estado" value={state} onChange={(e) => setState(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
        <input type="text" placeholder="CEP" value={zipcode} onChange={(e) => setZipcode(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" />
      </div>
    </div>
  );

  const renderStepTwo = () => (
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

  const renderStepThree = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4">Adicione Fotos</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {photos.map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            {previewPhotos[index] && (
              <Image src={previewPhotos[index]} alt="Pré-visualização" className="w-24 h-24 object-cover mb-2 rounded-md shadow-md"  width={64} height={64} />
            )}
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 hover:bg-blue-700">
              Foto {index + 1}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(index, e)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add Place" ariaHideApp={false}>
      <h2 className="text-2xl font-bold mb-4">{place ? "Editar" : "Adicionar"} Local</h2>
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
      <div className="flex justify-between mt-4">
        <button onClick={() => setStep(step - 1)} className="bg-gray-300 px-4 py-2 rounded-md" disabled={step === 1}>
          Voltar
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Próximo
          </button>
        ) : (
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Enviar
          </button>
        )}
      </div>
    </Modal>
  );
}
