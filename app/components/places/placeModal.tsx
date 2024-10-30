import React, { useState, useEffect } from "react";
import Modal from "react-modal";
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

  const commoditiesOptions = [
    { name: "Pet Friendly", icon: "🐶", description: "Aceita animais de estimação", color: "bg-green-500" },
    { name: "Área Aberta", icon: "🌳", description: "Possui área externa", color: "bg-blue-500" },
    { name: "Acessível", icon: "♿", description: "Acessibilidade garantida", color: "bg-yellow-500" },
    { name: "Estacionamento", icon: "🚗", description: "Possui estacionamento", color: "bg-red-500" },
    { name: "+18", icon: "🍺", description: "Permitido apenas para maiores de 18 anos", color: "bg-purple-500" },
    { name: "Mesas", icon: "🪑", description: "Possui mesas para os clientes", color: "bg-orange-500" },
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
      const response = await fetch("http://localhost:5000/uploads", {
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
    let logoUploadUrl = logoUrl;

    // Upload logo if present
    if (logo) {
        const uploadedLogoUrl = await uploadFile(logo);
        if (uploadedLogoUrl) logoUploadUrl = uploadedLogoUrl;
    }

    // Upload each photo if present
    const uploadedPhotoUrls = await Promise.all(
        photos.map(async (photo) => (photo ? await uploadFile(photo) : null))
    );

    const newPlace: Place = {
        id: place?.id || null,
        name,
        email,
        phone,
        address,
        number,
        neighborhood,
        city,
        state,
        zipcode,
        description,
        latitude,
        longitude,
        slug,
        status,
        logo: logoUploadUrl || "",
        commodities: commodities.map(commodity => ({ name: commodity.name, enabled: commodity.enabled })),
        photos: uploadedPhotoUrls.filter((url): url is string => !!url), // Only include valid URLs
    };

    try {
        const response = await fetch("http://localhost:5000/api/places", {  // URL ajustada para a API de locais
            method: place ? "PUT" : "POST", // Usa POST se for um novo local, PUT se for um existente
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newPlace),
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
          <img src={logoUrl} alt="Pré-visualização da Logo" className="w-24 h-24 object-cover rounded-full mb-4 shadow-lg" />
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
        <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-500" rows={4} />
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
      <div className="grid grid-cols-2 gap-4">
        {commodities.map((commodity, index) => (
          <div key={index} className={`p-4 rounded-md ${commodity.enabled ? "bg-green-200" : "bg-gray-200"} transition-all duration-200`} onClick={() => handleCommodityChange(index)}>
            <span className="text-2xl">{commodity.icon}</span>
            <h3 className="font-semibold">{commodity.name}</h3>
            <p>{commodity.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Fotos</h2>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="relative">
            {previewPhotos[index] && (
              <img src={previewPhotos[index]} alt={`Foto pré-visualização ${index + 1}`} className="w-full h-40 object-cover rounded-md shadow-md mb-2" />
            )}
            <label className="block cursor-pointer bg-blue-600 text-white text-center py-2 rounded-md transition duration-300 hover:bg-blue-700">
              Selecionar Foto {index + 1}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(index, e)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add Place" ariaHideApp={false}>
      <h2 className="text-2xl font-bold mb-4">{place ? "Editar" : "Adicionar"} Local</h2>
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
      <div className="flex justify-between mt-4">
        <button onClick={handlePrev} className="bg-gray-300 px-4 py-2 rounded-md" disabled={step === 1}>
          Voltar
        </button>
        {step < 3 ? (
          <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded-md">
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
