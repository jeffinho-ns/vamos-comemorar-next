import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar produtos/listas do evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    
    // Dados mockados específicos por estabelecimento
    const establishmentProducts: Record<number, any[]> = {
      7: [ // High Line
        {
          id: 1,
          eventId: parseInt(eventId),
          name: "Lista VIP High Line",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$80 seco ou R$200 consome\nApós às 00:30 - R$100 seco ou R$250 consome",
          value: 80,
          consumption: 200,
          capacity: 1500,
          insertedCount: 45,
          confirmedCount: 32,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 2,
          eventId: parseInt(eventId),
          name: "Lista Premium",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$120 seco ou R$300 consome\nApós às 00:30 - R$150 seco ou R$350 consome",
          value: 120,
          consumption: 300,
          capacity: 800,
          insertedCount: 28,
          confirmedCount: 25,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 3,
          eventId: parseInt(eventId),
          name: "Lista Standard",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$60 seco ou R$150 consome\nApós às 00:30 - R$80 seco ou R$180 consome",
          value: 60,
          consumption: 150,
          capacity: 2000,
          insertedCount: 156,
          confirmedCount: 142,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        }
      ],
      1: [ // Seu Justino
        {
          id: 4,
          eventId: parseInt(eventId),
          name: "Lista Deroma",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$40 seco ou R$120 consome\nApós às 00:30 - R$50 seco ou R$150 consome",
          value: 40,
          consumption: 120,
          capacity: 1000,
          insertedCount: 89,
          confirmedCount: 67,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 5,
          eventId: parseInt(eventId),
          name: "Lista Felipe Lima",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$40 seco ou R$120 consome\nApós às 00:30 - R$50 seco ou R$150 consome",
          value: 40,
          consumption: 120,
          capacity: 1000,
          insertedCount: 67,
          confirmedCount: 54,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 6,
          eventId: parseInt(eventId),
          name: "Lista Gui Paiola",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$40 seco ou R$120 consome\nApós às 00:30 - R$50 seco ou R$150 consome",
          value: 40,
          consumption: 120,
          capacity: 1000,
          insertedCount: 34,
          confirmedCount: 28,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 7,
          eventId: parseInt(eventId),
          name: "Lista Pantaleão",
          description: "Até às 22H - VIP\n22:00 - 00:30 - R$40 seco ou R$120 consome\nApós às 00:30 - R$50 seco ou R$150 consome",
          value: 40,
          consumption: 120,
          capacity: 1000,
          insertedCount: 23,
          confirmedCount: 19,
          startTime: "22:00",
          endTime: "00:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 8,
          eventId: parseInt(eventId),
          name: "Lista Sábado",
          description: "Valores de Entrada - Sábado:\nDas 14H às 16H: VIP\n16H às 20H: R$40,00 Seco ou R$150,00 consome.\n20H às 00H: R$50 Seco ou R$150 consome;\nApós 00h: R$80 Seco ou R$200 consome:",
          value: 50,
          consumption: 150,
          capacity: 1000,
          insertedCount: 234,
          confirmedCount: 198,
          startTime: "14:00",
          endTime: "00:00",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        }
      ],
      4: [ // Oh Freguês
        {
          id: 9,
          eventId: parseInt(eventId),
          name: "Lista Familiar",
          description: "Até às 20H - VIP\n20:00 - 22:30 - R$35 seco ou R$100 consome\nApós às 22:30 - R$45 seco ou R$120 consome",
          value: 35,
          consumption: 100,
          capacity: 1200,
          insertedCount: 178,
          confirmedCount: 145,
          startTime: "20:00",
          endTime: "22:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 10,
          eventId: parseInt(eventId),
          name: "Lista Happy Hour",
          description: "Até às 18H - VIP\n18:00 - 20:00 - R$25 seco ou R$80 consome\nApós às 20:00 - R$35 seco ou R$100 consome",
          value: 25,
          consumption: 80,
          capacity: 800,
          insertedCount: 89,
          confirmedCount: 76,
          startTime: "18:00",
          endTime: "20:00",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        }
      ],
      8: [ // Pracinha do Seu Justino
        {
          id: 11,
          eventId: parseInt(eventId),
          name: "Lista Ar Livre",
          description: "Até às 17H - VIP\n17:00 - 19:30 - R$30 seco ou R$90 consome\nApós às 19:30 - R$40 seco ou R$110 consome",
          value: 30,
          consumption: 90,
          capacity: 600,
          insertedCount: 45,
          confirmedCount: 38,
          startTime: "17:00",
          endTime: "19:30",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        },
        {
          id: 12,
          eventId: parseInt(eventId),
          name: "Lista Feijoada",
          description: "Domingo - Feijoada Completa:\nDas 12H às 15H: R$45,00\nDas 15H às 18H: R$55,00",
          value: 45,
          consumption: 0,
          capacity: 400,
          insertedCount: 123,
          confirmedCount: 98,
          startTime: "12:00",
          endTime: "18:00",
          allowInsert: true,
          allowConvert: true,
          status: 'active' as const
        }
      ]
    };

    const mockProducts = establishmentProducts[parseInt(eventId)] || [
      {
        id: 1,
        eventId: parseInt(eventId),
        name: "Lista Padrão",
        description: "Lista padrão para estabelecimento não configurado",
        value: 50,
        consumption: 120,
        capacity: 500,
        insertedCount: 0,
        confirmedCount: 0,
        startTime: "20:00",
        endTime: "00:00",
        allowInsert: true,
        allowConvert: true,
        status: 'active' as const
      }
    ];

    return NextResponse.json(mockProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos do evento' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produtos do evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const products = await request.json();
    
    // Aqui você faria a chamada para sua API backend para salvar os produtos
    console.log('Salvando produtos para evento:', eventId, products);
    
    // Simular sucesso
    return NextResponse.json({ success: true, message: 'Produtos salvos com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar produtos do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar produtos do evento' },
      { status: 500 }
    );
  }
} 