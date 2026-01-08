// app/services/birthdayService.ts

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com/api';

export interface BirthdayReservation {
  id: number;
  user_id: number;
  aniversariante_nome: string;
  data_aniversario: string;
  quantidade_convidados: number;
  nomes_convidados?: string[];
  id_casa_evento: number;
  place_name?: string;
  user_name?: string;
  decoracao_tipo: string;
  painel_personalizado: boolean;
  painel_tema?: string;
  painel_frase?: string;
  painel_estoque_imagem_url?: string;
  bebida_balde_budweiser?: number;
  bebida_balde_corona?: number;
  bebida_balde_heineken?: number;
  bebida_combo_gin_142?: number;
  bebida_licor_rufus?: number;
  item_bar_bebida_1?: number;
  item_bar_bebida_2?: number;
  item_bar_bebida_3?: number;
  item_bar_bebida_4?: number;
  item_bar_bebida_5?: number;
  item_bar_bebida_6?: number;
  item_bar_bebida_7?: number;
  item_bar_bebida_8?: number;
  item_bar_bebida_9?: number;
  item_bar_bebida_10?: number;
  item_bar_comida_1?: number;
  item_bar_comida_2?: number;
  item_bar_comida_3?: number;
  item_bar_comida_4?: number;
  item_bar_comida_5?: number;
  item_bar_comida_6?: number;
  item_bar_comida_7?: number;
  item_bar_comida_8?: number;
  item_bar_comida_9?: number;
  item_bar_comida_10?: number;
  lista_presentes?: any[] | string;
  documento?: string;
  whatsapp?: string;
  email?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class BirthdayService {
  static async getAllBirthdayReservations(): Promise<BirthdayReservation[]> {
    try {
      console.log('Fazendo requisição para:', `${API_BASE_URL}/birthday-reservations`);
      
      const response = await fetch(`${API_BASE_URL}/birthday-reservations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta de erro:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar reservas de aniversário:', error);
      throw error;
    }
  }

  static async createBirthdayReservation(data: Partial<BirthdayReservation>): Promise<BirthdayReservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/birthday-reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta de erro:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      // A criação de lista de convidados e reserva de restaurante agora é feita automaticamente na API
      // Não precisa mais chamar createGuestListForBirthday aqui
      console.log('✅ Reserva de aniversário criada:', result);
      
      return result;
    } catch (error) {
      console.error('Erro ao criar reserva de aniversário:', error);
      throw error;
    }
  }

  // 🎂 MÉTODO REMOVIDO: createGuestListForBirthday
  // A criação de lista de convidados agora é feita automaticamente na API
  // quando uma reserva de aniversário é criada

  static async getBirthdayReservationById(id: number): Promise<BirthdayReservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/birthday-reservations/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar reserva de aniversário:', error);
      throw error;
    }
  }

  static async getBirthdayReservationsByEstablishment(establishmentId: number): Promise<BirthdayReservation[]> {
    try {
      console.log('Buscando reservas para estabelecimento ID:', establishmentId);
      
      const response = await fetch(`${API_BASE_URL}/birthday-reservations?establishment_id=${establishmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta de erro:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Reservas filtradas recebidas:', data);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar reservas por estabelecimento:', error);
      throw error;
    }
  }

  static async updateBirthdayReservation(id: number, data: Partial<BirthdayReservation>): Promise<BirthdayReservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/birthday-reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao atualizar reserva de aniversário:', error);
      throw error;
    }
  }

  static async deleteBirthdayReservation(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/birthday-reservations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar reserva de aniversário:', error);
      throw error;
    }
  }
} 