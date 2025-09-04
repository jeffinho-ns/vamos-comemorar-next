import { useState, useCallback } from 'react';
import { getApiUrl } from '../config/api';

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
        console.log("Dados recebidos da API (bars):", data);
        
        if (Array.isArray(data)) {
          // Mapear dados da tabela bars para o formato esperado
          const mappedData: Establishment[] = data.map(bar => ({
            id: bar.id.toString(),
            name: bar.name || "Sem nome",
            email: bar.email || "Não informado",
            phone: bar.phone || "Não informado",
            logo: bar.logoUrl || bar.logo || "default-logo.png",
            address: bar.address || "Endereço não informado",
            status: bar.status || "active",
            cnpj: bar.cnpj || ""
          }));
          setEstablishments(mappedData);
          return;
        }
      }

      // Se não conseguir da tabela bars, tenta da tabela places
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
