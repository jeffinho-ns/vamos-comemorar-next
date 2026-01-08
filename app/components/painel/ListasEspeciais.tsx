"use client";

import { useState, useEffect, useCallback } from "react";
import { MdStar, MdPeople, MdEvent, MdAdd, MdEdit, MdDelete, MdCake, MdLocalBar, MdRestaurant, MdCardGiftcard, MdVisibility, MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { BirthdayService, BirthdayReservation } from "../../services/birthdayService";
import BirthdayDetailsModal from "./BirthdayDetailsModal";

interface Establishment {
  id: number;
  name: string;
  logo: string;
  address: string;
}

interface ListasEspeciaisProps {
  establishment: Establishment;
}

export default function ListasEspeciais({ establishment }: ListasEspeciaisProps) {
  const [birthdayReservations, setBirthdayReservations] = useState<BirthdayReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<BirthdayReservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBirthdayReservations = useCallback(async () => {
    console.log("Iniciando busca de reservas para estabelecimento:", establishment.id);
    setLoading(true);
    setError(null);
    try {
      console.log("Chamando BirthdayService.getBirthdayReservationsByEstablishment...");
      const reservations = await BirthdayService.getBirthdayReservationsByEstablishment(establishment.id);
      console.log("Reservas recebidas:", reservations);
      setBirthdayReservations(reservations);
    } catch (err) {
      console.error("Erro ao carregar reservas de aniversário:", err);
      setError(`Erro ao carregar as reservas de aniversário: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [establishment.id]);

  useEffect(() => {
    fetchBirthdayReservations();
  }, [fetchBirthdayReservations]);

  const handleViewDetails = (reservation: BirthdayReservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalItems = (reservation: BirthdayReservation) => {
    let total = 0;
    
    // Bebidas especiais
    if (reservation.bebida_balde_budweiser) total += reservation.bebida_balde_budweiser;
    if (reservation.bebida_balde_corona) total += reservation.bebida_balde_corona;
    if (reservation.bebida_balde_heineken) total += reservation.bebida_balde_heineken;
    if (reservation.bebida_combo_gin_142) total += reservation.bebida_combo_gin_142;
    if (reservation.bebida_licor_rufus) total += reservation.bebida_licor_rufus;
    
    // Itens do bar
    for (let i = 1; i <= 10; i++) {
      const bebida = reservation[`item_bar_bebida_${i}` as keyof BirthdayReservation] as number;
      const comida = reservation[`item_bar_comida_${i}` as keyof BirthdayReservation] as number;
      if (bebida) total += bebida;
      if (comida) total += comida;
    }
    
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchBirthdayReservations}
          className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Aniversariantes - {establishment.name}</h3>
          <p className="text-gray-600 text-sm">Lista de todos os aniversariantes e suas reservas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchBirthdayReservations}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <MdEvent />
            Atualizar
          </button>
        </div>
      </div>

      {birthdayReservations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎂</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum aniversariante encontrado</h3>
          <p className="text-gray-500">
            Não há reservas de aniversário para este estabelecimento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {birthdayReservations.map((reservation) => (
            <div key={reservation.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-yellow-300">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <MdCake className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {reservation.aniversariante_nome}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(reservation.data_aniversario)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </span>
              </div>

              {/* Informações Principais */}
              <div className="space-y-3 mb-4">
                {reservation.place_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdLocationOn className="text-orange-500" />
                    <span className="font-semibold">{reservation.place_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <MdPeople className="text-blue-500" />
                  <span>{reservation.quantidade_convidados} convidados</span>
                </div>
                
                {reservation.decoracao_tipo && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdStar className="text-purple-500" />
                    <span>{reservation.decoracao_tipo}</span>
                  </div>
                )}

                {reservation.painel_personalizado && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdStar className="text-yellow-500" />
                    <span>Painel Personalizado</span>
                  </div>
                )}

                {getTotalItems(reservation) > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdLocalBar className="text-green-500" />
                    <span>{getTotalItems(reservation)} itens do bar</span>
                  </div>
                )}

                {(() => {
                  try {
                    const presentes = typeof reservation.lista_presentes === 'string' 
                      ? JSON.parse(reservation.lista_presentes) 
                      : reservation.lista_presentes;
                    
                    if (Array.isArray(presentes) && presentes.length > 0) {
                      return (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MdCardGiftcard className="text-pink-500" />
                          <span>{presentes.length} presentes</span>
                        </div>
                      );
                    }
                    return null;
                  } catch (error) {
                    return null;
                  }
                })()}
              </div>

              {/* Contato */}
              {(reservation.whatsapp || reservation.email) && (
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="space-y-1">
                    {reservation.whatsapp && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdPhone className="text-green-500" />
                        <span>{reservation.whatsapp}</span>
                      </div>
                    )}
                    {reservation.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdEmail className="text-blue-500" />
                        <span>{reservation.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(reservation)}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MdVisibility />
                  Ver Detalhes
                </button>
              </div>

              {/* Data de Criação */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Criado em: {formatDate(reservation.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <BirthdayDetailsModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
} 