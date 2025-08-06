import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar configurações do evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    
    // Aqui você faria a chamada para sua API backend
    // Por enquanto, retornando dados mockados baseados na estrutura da imagem
    // Dados específicos por estabelecimento
    const establishmentConfigs: Record<number, any> = {
      7: { // High Line
        id: 1,
        eventId: parseInt(eventId),
        totalCapacity: 1500,
        needCPF: true,
        allowPublicInsert: true,
        allowCashierInsert: true,
        requirePaymentInfo: true,
        doubleCheck: true,
        systemLimitDate: "2024-02-15T23:59:00",
        publicLimitDate: "2024-02-15T22:00:00",
        conversionLimitDate: "2024-02-16T02:00:00",
        observations: "High Line - Evento VIP com controle rigoroso"
      },
      1: { // Seu Justino
        id: 2,
        eventId: parseInt(eventId),
        totalCapacity: 800,
        needCPF: false,
        allowPublicInsert: true,
        allowCashierInsert: false,
        requirePaymentInfo: false,
        doubleCheck: false,
        systemLimitDate: null,
        publicLimitDate: null,
        conversionLimitDate: null,
        observations: "Seu Justino - Evento mais descontraído"
      },
      4: { // Oh Freguês
        id: 3,
        eventId: parseInt(eventId),
        totalCapacity: 1200,
        needCPF: false,
        allowPublicInsert: true,
        allowCashierInsert: true,
        requirePaymentInfo: false,
        doubleCheck: false,
        systemLimitDate: "2024-02-15T23:30:00",
        publicLimitDate: "2024-02-15T21:00:00",
        conversionLimitDate: "2024-02-16T01:30:00",
        observations: "Oh Freguês - Evento familiar"
      },
      8: { // Pracinha do Seu Justino
        id: 4,
        eventId: parseInt(eventId),
        totalCapacity: 600,
        needCPF: false,
        allowPublicInsert: true,
        allowCashierInsert: false,
        requirePaymentInfo: false,
        doubleCheck: false,
        systemLimitDate: null,
        publicLimitDate: null,
        conversionLimitDate: null,
        observations: "Pracinha - Evento ao ar livre"
      }
    };

    const mockConfig = establishmentConfigs[parseInt(eventId)] || {
      id: 1,
      eventId: parseInt(eventId),
      totalCapacity: 1000,
      needCPF: false,
      allowPublicInsert: true,
      allowCashierInsert: false,
      requirePaymentInfo: false,
      doubleCheck: false,
      systemLimitDate: null,
      publicLimitDate: null,
      conversionLimitDate: null,
      observations: ""
    };

    return NextResponse.json(mockConfig);
  } catch (error) {
    console.error('Erro ao buscar configurações do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações do evento' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações do evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const config = await request.json();
    
    // Aqui você faria a chamada para sua API backend para salvar as configurações
    console.log('Salvando configurações para evento:', eventId, config);
    
    // Simular sucesso
    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configurações do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações do evento' },
      { status: 500 }
    );
  }
} 