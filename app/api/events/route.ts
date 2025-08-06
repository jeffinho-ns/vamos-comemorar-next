import { NextRequest, NextResponse } from 'next/server';

// GET - Listar eventos disponíveis
export async function GET(request: NextRequest) {
  try {
    // Aqui você faria a chamada para sua API backend
    // Por enquanto, retornando dados mockados baseados na estrutura do banco
    const mockEvents = [
      // High Line (ID: 7)
      {
        id: 7,
        nome_do_evento: "Sunset Party 2024",
        casa_do_evento: "Highline Bar SP",
        data_do_evento: "2024-02-15",
        hora_do_evento: "22:00:00"
      },
      {
        id: 17,
        nome_do_evento: "Réveillon Highline 2023",
        casa_do_evento: "Highline Bar SP",
        data_do_evento: "2023-12-31",
        hora_do_evento: "21:00:00"
      },
      {
        id: 27,
        nome_do_evento: "VIP Night",
        casa_do_evento: "Highline Bar SP",
        data_do_evento: "2024-03-01",
        hora_do_evento: "23:00:00"
      },
      
      // Seu Justino (ID: 1)
      {
        id: 1,
        nome_do_evento: "Festa de Lançamento",
        casa_do_evento: "Seu Justino",
        data_do_evento: "2024-01-20",
        hora_do_evento: "20:00:00"
      },
      {
        id: 11,
        nome_do_evento: "20 Anos",
        casa_do_evento: "Seu Justino",
        data_do_evento: "2024-11-23",
        hora_do_evento: "20:00:00"
      },
      {
        id: 21,
        nome_do_evento: "Samba na Madrugada",
        casa_do_evento: "Seu Justino",
        data_do_evento: "2024-02-10",
        hora_do_evento: "21:00:00"
      },
      
      // Oh Freguês (ID: 4)
      {
        id: 4,
        nome_do_evento: "Festa Familiar",
        casa_do_evento: "Oh Freguês",
        data_do_evento: "2024-02-20",
        hora_do_evento: "19:00:00"
      },
      {
        id: 14,
        nome_do_evento: "Happy Hour Especial",
        casa_do_evento: "Oh Freguês",
        data_do_evento: "2024-02-25",
        hora_do_evento: "18:00:00"
      },
      
      // Pracinha do Seu Justino (ID: 8)
      {
        id: 8,
        nome_do_evento: "Feijoada ao Ar Livre",
        casa_do_evento: "Pracinha do Seu Justino",
        data_do_evento: "2024-02-18",
        hora_do_evento: "12:00:00"
      },
      {
        id: 18,
        nome_do_evento: "Samba na Pracinha",
        casa_do_evento: "Pracinha do Seu Justino",
        data_do_evento: "2024-02-28",
        hora_do_evento: "16:00:00"
      }
    ];

    return NextResponse.json(mockEvents);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
} 