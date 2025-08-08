"use client";

import React from 'react';
import Image from 'next/image';
import { MdClose, MdCake, MdPeople, MdEvent, MdLocalBar, MdRestaurant, MdCardGiftcard, MdContactPhone, MdEmail, MdDescription, MdImage, MdPalette } from "react-icons/md";
import { BirthdayReservation } from "../../services/birthdayService";

interface BirthdayDetailsModalProps {
  reservation: BirthdayReservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BirthdayDetailsModal({ reservation, isOpen, onClose }: BirthdayDetailsModalProps) {
  if (!isOpen || !reservation) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const parseListaPresentes = (listaPresentes: any): any[] => {
    try {
      if (typeof listaPresentes === 'string') {
        return JSON.parse(listaPresentes);
      }
      if (Array.isArray(listaPresentes)) {
        return listaPresentes;
      }
      return [];
    } catch (error) {
      console.error('Erro ao processar lista de presentes:', error);
      return [];
    }
  };

  const getBebidasItems = () => {
    const items = [];
    if (reservation.bebida_balde_budweiser && reservation.bebida_balde_budweiser > 0) {
      items.push({ nome: 'Balde Budweiser', quantidade: reservation.bebida_balde_budweiser });
    }
    if (reservation.bebida_balde_corona && reservation.bebida_balde_corona > 0) {
      items.push({ nome: 'Balde Corona', quantidade: reservation.bebida_balde_corona });
    }
    if (reservation.bebida_balde_heineken && reservation.bebida_balde_heineken > 0) {
      items.push({ nome: 'Balde Heineken', quantidade: reservation.bebida_balde_heineken });
    }
    if (reservation.bebida_combo_gin_142 && reservation.bebida_combo_gin_142 > 0) {
      items.push({ nome: 'Combo Gin 142', quantidade: reservation.bebida_combo_gin_142 });
    }
    if (reservation.bebida_licor_rufus && reservation.bebida_licor_rufus > 0) {
      items.push({ nome: 'Licor Rufus', quantidade: reservation.bebida_licor_rufus });
    }
    return items;
  };

  const getBarItems = () => {
    const bebidas = [];
    const comidas = [];
    
    // Bebidas do bar
    for (let i = 1; i <= 10; i++) {
      const quantidade = reservation[`item_bar_bebida_${i}` as keyof BirthdayReservation] as number;
      if (quantidade && quantidade > 0) {
        bebidas.push({ nome: `Bebida ${i}`, quantidade });
      }
    }
    
    // Comidas do bar
    for (let i = 1; i <= 10; i++) {
      const quantidade = reservation[`item_bar_comida_${i}` as keyof BirthdayReservation] as number;
      if (quantidade && quantidade > 0) {
        comidas.push({ nome: `Comida ${i}`, quantidade });
      }
    }
    
    return { bebidas, comidas };
  };

  const barItems = getBarItems();
  const bebidasItems = getBebidasItems();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MdCake className="text-3xl" />
              <div>
                <h2 className="text-2xl font-bold">Detalhes do Aniversariante</h2>
                <p className="text-yellow-100">{reservation.place_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdCake className="text-yellow-500" />
                Informações do Aniversariante
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Nome:</span> {reservation.aniversariante_nome}</p>
                <p><span className="font-medium">Data do Aniversário:</span> {formatDate(reservation.data_aniversario)}</p>
                <p><span className="font-medium">Quantidade de Convidados:</span> {reservation.quantidade_convidados}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    reservation.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reservation.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdContactPhone className="text-blue-500" />
                Contato
              </h3>
              <div className="space-y-2">
                {reservation.documento && <p><span className="font-medium">Documento:</span> {reservation.documento}</p>}
                {reservation.whatsapp && <p><span className="font-medium">WhatsApp:</span> {reservation.whatsapp}</p>}
                {reservation.email && <p><span className="font-medium">Email:</span> {reservation.email}</p>}
                {reservation.user_name && <p><span className="font-medium">Cliente:</span> {reservation.user_name}</p>}
              </div>
            </div>
          </div>

          {/* Decoração */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdPalette className="text-purple-500" />
              Decoração
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Tipo de Decoração:</span> {reservation.decoracao_tipo || 'Não especificado'}</p>
                <p><span className="font-medium">Painel Personalizado:</span> {reservation.painel_personalizado ? 'Sim' : 'Não'}</p>
                {reservation.painel_tema && <p><span className="font-medium">Tema do Painel:</span> {reservation.painel_tema}</p>}
                {reservation.painel_frase && <p><span className="font-medium">Frase do Painel:</span> {reservation.painel_frase}</p>}
              </div>
              {reservation.painel_estoque_imagem_url && (
                <div>
                  <p className="font-medium mb-2">Imagem do Painel:</p>
                  <Image 
                    src={reservation.painel_estoque_imagem_url} 
                    alt="Painel personalizado"
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bebidas Especiais */}
          {bebidasItems.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdLocalBar className="text-blue-500" />
                Bebidas Especiais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bebidasItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-gray-600">Quantidade: {item.quantidade}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens do Bar */}
          {(barItems.bebidas.length > 0 || barItems.comidas.length > 0) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdRestaurant className="text-green-500" />
                Itens do Bar
              </h3>
              
              {barItems.bebidas.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Bebidas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {barItems.bebidas.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-gray-600">Quantidade: {item.quantidade}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {barItems.comidas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Comidas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {barItems.comidas.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-gray-600">Quantidade: {item.quantidade}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Presentes */}
          {(() => {
            const presentes = parseListaPresentes(reservation.lista_presentes);
            if (presentes.length > 0) {
              return (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MdCardGiftcard className="text-pink-500" />
                    Lista de Presentes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {presentes.map((presente, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <p className="font-medium">{typeof presente === 'string' ? presente : (presente.name || presente.nome)}</p>
                        {typeof presente === 'object' && presente.price && <p className="text-gray-600">R$ {presente.price}</p>}
                        {typeof presente === 'object' && presente.category && <p className="text-gray-500 text-sm">{presente.category}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Informações Adicionais */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MdEvent className="text-orange-500" />
              Informações do Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Data de Criação:</span> {formatDate(reservation.created_at)}</p>
                <p><span className="font-medium">Última Atualização:</span> {formatDate(reservation.updated_at)}</p>
              </div>
              <div>
                <p><span className="font-medium">ID da Reserva:</span> #{reservation.id}</p>
                <p><span className="font-medium">ID do Usuário:</span> {reservation.user_id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 