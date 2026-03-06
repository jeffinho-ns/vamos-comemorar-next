import { useState, useCallback } from 'react';
import { getApiUrl } from '../config/api';

const hasReservaRooftop = (list: { name?: string }[]) =>
  list.some(
    (e) =>
      String(e.name || "").toLowerCase().includes("reserva rooftop") ||
      String(e.name || "").toLowerCase().includes("rooftop"),
  );

export interface Establishment {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  status?: string;
  cnpj?: string;
}

export interface UseEstablishmentsReturn {
  establishments: Establishment[];
  loading: boolean;
  error: string | null;
  fetchEstablishments: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useEstablishments = (): UseEstablishmentsReturn => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }

    const API_URL = getApiUrl();

    try {
      // Primeiro tenta buscar da tabela bars
      let response = await fetch(`${API_URL}/api/bars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      if (response.ok) {
        data = await response.json();
        if (Array.isArray(data)) {
          const mappedData: Establishment[] = data.map((bar: Record<string, unknown>) => ({
            id: String(bar.id ?? ""),
            name: (bar.name as string) || "Sem nome",
            email: (bar.email as string) || "Não informado",
            phone: (bar.phone as string) || "Não informado",
            logo: (bar.logoUrl as string) || (bar.logo as string) || "default-logo.png",
            address: (bar.address as string) || "Endereço não informado",
            status: (bar.status as string) || "active",
            cnpj: (bar.cnpj as string) || ""
          }));
          if (hasReservaRooftop(mappedData)) {
            setEstablishments(mappedData);
            return;
          }
        }
      }

      // Se bars não incluir Reserva Rooftop, usa places (onde está o id 9)
      response = await fetch(`${API_URL}/api/places`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      data = await response.json();
      console.log("Dados recebidos da API (places):", data);
      
      if (Array.isArray(data)) {
        // Mapear dados da tabela places para o formato esperado
        const mappedData: Establishment[] = data.map(place => ({
          id: place.id.toString(),
          name: place.name || "Sem nome",
          email: place.email || "Não informado",
          phone: place.phone || "Não informado",
          logo: place.logo || "default-logo.png",
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
          status: place.status || "active",
          cnpj: place.cnpj || ""
        }));
        setEstablishments(mappedData);
      } else if (data.data && Array.isArray(data.data)) {
        // Se os dados vêm em um objeto com propriedade data
        const mappedData: Establishment[] = data.data.map((place: any) => ({
          id: place.id.toString(),
          name: place.name || "Sem nome",
          email: place.email || "Não informado",
          phone: place.phone || "Não informado",
          logo: place.logo || "default-logo.png",
          address: place.street ? `${place.street}, ${place.number || ''}`.trim() : "Endereço não informado",
          status: place.status || "active",
          cnpj: place.cnpj || ""
        }));
        setEstablishments(mappedData);
      } else {
        throw new Error("Formato de dados inválido recebido da API.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro ao buscar estabelecimentos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchEstablishments();
  }, [fetchEstablishments]);

  return {
    establishments,
    loading,
    error,
    fetchEstablishments,
    refetch
  };
};
