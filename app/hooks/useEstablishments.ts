import { useCallback } from "react";
import { useAppContext } from "../context/AppContext";

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
  const {
    establishments: contextEstablishments,
    isLoading,
    error,
    refetchAll,
  } = useAppContext();

  const fetchEstablishments = useCallback(async (): Promise<void> => {
    await refetchAll();
  }, [refetchAll]);

  const refetch = useCallback(async () => {
    await fetchEstablishments();
  }, [fetchEstablishments]);

  return {
    establishments: contextEstablishments as Establishment[],
    loading: isLoading,
    error,
    fetchEstablishments,
    refetch
  };
};
