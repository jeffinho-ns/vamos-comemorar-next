import { NextRequest, NextResponse } from 'next/server';

// URL da API backend - sempre usar vamos-comemorar-api.onrender.com
const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

// GET - Buscar todos os detalhes operacionais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const establishment_id = searchParams.get('establishment_id');
    const event_date = searchParams.get('event_date');
    const is_active = searchParams.get('is_active');

    let url = `${API_BASE_URL}/api/v1/operational-details`;
    const params = new URLSearchParams();
    
    if (establishment_id) params.append('establishment_id', establishment_id);
    if (event_date) params.append('event_date', event_date);
    if (is_active !== null && is_active !== undefined) params.append('is_active', is_active);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const token = request.headers.get('authorization');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar detalhes operacionais' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes operacionais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo detalhe operacional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log para debug
    console.log('📤 Recebendo dados para criar OS:', {
      event_date: body.event_date,
      artistic_attraction: body.artistic_attraction,
      ticket_prices: body.ticket_prices,
      os_type: body.os_type,
      establishment_id: body.establishment_id
    });
    
    // Validações básicas antes de enviar para a API
    if (!body.event_date) {
      return NextResponse.json(
        { error: 'Data do evento é obrigatória' },
        { status: 400 }
      );
    }
    
    if (!body.artistic_attraction || body.artistic_attraction.trim() === '') {
      return NextResponse.json(
        { error: 'Atrativo artístico é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!body.ticket_prices || body.ticket_prices.trim() === '') {
      return NextResponse.json(
        { error: 'Informações de preços são obrigatórias' },
        { status: 400 }
      );
    }
    
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    // Preparar dados para envio - APENAS os campos que a API espera
    // A API espera exatamente 80 parâmetros na ordem específica
    const dataToSend: Record<string, any> = {
      // Campos básicos obrigatórios
      os_type: body.os_type || null,
      os_number: (body.os_number && String(body.os_number).trim() !== '') ? String(body.os_number).trim() : null,
      event_id: body.event_id ? parseInt(String(body.event_id)) : null,
      establishment_id: body.establishment_id ? parseInt(String(body.establishment_id)) : null,
      event_date: String(body.event_date).trim(),
      artistic_attraction: String(body.artistic_attraction).trim(),
      show_schedule: (body.show_schedule && String(body.show_schedule).trim() !== '') ? String(body.show_schedule).trim() : null,
      ticket_prices: String(body.ticket_prices).trim(),
      promotions: (body.promotions && String(body.promotions).trim() !== '') ? String(body.promotions).trim() : null,
      visual_reference_url: (body.visual_reference_url && String(body.visual_reference_url).trim() !== '') ? String(body.visual_reference_url).trim() : null,
      admin_notes: (body.admin_notes && String(body.admin_notes).trim() !== '') ? String(body.admin_notes).trim() : null,
      operational_instructions: (body.operational_instructions && String(body.operational_instructions).trim() !== '') ? String(body.operational_instructions).trim() : null,
      // is_active deve ser enviado como boolean, a API converte para 1 ou 0
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      
      // Campos de Artista (todos null se não fornecidos)
      contractor_name: body.contractor_name || null,
      contractor_cnpj: body.contractor_cnpj || null,
      contractor_address: body.contractor_address || null,
      contractor_legal_responsible: body.contractor_legal_responsible || null,
      contractor_legal_cpf: body.contractor_legal_cpf || null,
      contractor_phone: body.contractor_phone || null,
      contractor_email: body.contractor_email || null,
      artist_artistic_name: body.artist_artistic_name || null,
      artist_full_name: body.artist_full_name || null,
      artist_cpf_cnpj: body.artist_cpf_cnpj || null,
      artist_address: body.artist_address || null,
      artist_phone: body.artist_phone || null,
      artist_email: body.artist_email || null,
      artist_responsible_name: body.artist_responsible_name || null,
      artist_bank_name: body.artist_bank_name || null,
      artist_bank_agency: body.artist_bank_agency || null,
      artist_bank_account: body.artist_bank_account || null,
      artist_bank_account_type: body.artist_bank_account_type || null,
      event_name: (body.event_name && String(body.event_name).trim() !== '') ? String(body.event_name).trim() : null,
      event_location_address: body.event_location_address || null,
      event_presentation_date: body.event_presentation_date || null,
      event_presentation_time: body.event_presentation_time || null,
      event_duration: body.event_duration || null,
      event_soundcheck_time: body.event_soundcheck_time || null,
      event_structure_offered: body.event_structure_offered || null,
      event_equipment_provided_by_contractor: body.event_equipment_provided_by_contractor || null,
      event_equipment_brought_by_artist: body.event_equipment_brought_by_artist || null,
      financial_total_value: body.financial_total_value ? parseFloat(String(body.financial_total_value)) : null,
      financial_payment_method: body.financial_payment_method || null,
      financial_payment_conditions: body.financial_payment_conditions || null,
      financial_discounts_or_fees: body.financial_discounts_or_fees || null,
      general_penalties: body.general_penalties || null,
      general_transport_responsibility: body.general_transport_responsibility || null,
      general_image_rights: body.general_image_rights || null,
      contractor_signature: body.contractor_signature || null,
      artist_signature: body.artist_signature || null,
      
      // Campos de Bar/Fornecedor (todos null se não fornecidos)
      provider_name: body.provider_name || null,
      provider_cpf_cnpj: body.provider_cpf_cnpj || null,
      provider_address: body.provider_address || null,
      provider_responsible_name: body.provider_responsible_name || null,
      provider_responsible_contact: body.provider_responsible_contact || null,
      provider_bank_name: body.provider_bank_name || null,
      provider_bank_agency: body.provider_bank_agency || null,
      provider_bank_account: body.provider_bank_account || null,
      provider_bank_account_type: body.provider_bank_account_type || null,
      service_type: body.service_type || null,
      service_professionals_count: body.service_professionals_count ? parseInt(String(body.service_professionals_count)) : null,
      service_materials_included: body.service_materials_included || null,
      service_start_date: body.service_start_date || null,
      service_start_time: body.service_start_time || null,
      service_end_date: body.service_end_date || null,
      service_end_time: body.service_end_time || null,
      service_setup_location: body.service_setup_location || null,
      service_technical_responsible: body.service_technical_responsible || null,
      commercial_total_value: body.commercial_total_value ? parseFloat(String(body.commercial_total_value)) : null,
      commercial_payment_method: body.commercial_payment_method || null,
      commercial_payment_deadline: body.commercial_payment_deadline || null,
      commercial_cancellation_policy: body.commercial_cancellation_policy || null,
      commercial_additional_costs: body.commercial_additional_costs || null,
      general_damage_responsibility: body.general_damage_responsibility || null,
      general_conduct_rules: body.general_conduct_rules || null,
      general_insurance: body.general_insurance || null,
      provider_signature: body.provider_signature || null,
    };
    
    // Remover campos undefined e converter strings vazias para null em campos opcionais
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === undefined) {
        delete dataToSend[key];
      } else if (typeof dataToSend[key] === 'string' && dataToSend[key].trim() === '' && 
                 !['event_date', 'artistic_attraction', 'ticket_prices'].includes(key)) {
        dataToSend[key] = null;
      }
    });

    console.log('📤 Enviando para API externa:', {
      url: `${API_BASE_URL}/api/v1/operational-details`,
      method: 'POST',
      hasToken: !!token,
      dataKeys: Object.keys(dataToSend),
      dataPreview: {
        os_type: dataToSend.os_type,
        event_date: dataToSend.event_date,
        artistic_attraction: dataToSend.artistic_attraction,
        ticket_prices: dataToSend.ticket_prices,
        is_active: dataToSend.is_active,
        establishment_id: dataToSend.establishment_id,
        admin_notes: dataToSend.admin_notes ? 'present' : 'null'
      },
      fullData: JSON.stringify(dataToSend, null, 2).substring(0, 1000)
    });

    // URL completa da API backend
    const apiUrl = `${API_BASE_URL}/api/v1/operational-details`;
    
    console.log('🌐 Fazendo proxy para API backend:', {
      url: apiUrl,
      method: 'POST',
      hasToken: !!token,
      dataKeys: Object.keys(dataToSend).length
    });
    
    // Fazer requisição para o backend
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify(dataToSend),
      });
    } catch (fetchError) {
      console.error('❌ Erro ao fazer fetch para API backend:', fetchError);
      return NextResponse.json(
        { 
          error: 'Erro ao conectar com o servidor backend',
          details: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }

    const responseText = await response.text();
    console.log('📥 Resposta da API externa:', {
      status: response.status,
      statusText: response.statusText,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 500)
    });

    let errorData;
    
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError);
      errorData = { 
        error: responseText || `Erro ${response.status}: ${response.statusText}`,
        rawResponse: responseText.substring(0, 1000)
      };
    }

    if (!response.ok) {
      console.error('❌ Erro da API externa:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: apiUrl,
        fullResponse: responseText
      });
      
      // Se for erro 500, retornar mais detalhes para debug
      if (response.status === 500) {
        return NextResponse.json(
          { 
            error: errorData.error || errorData.message || 'Erro interno do servidor na API externa',
            details: errorData.details || errorData,
            fullError: process.env.NODE_ENV === 'development' ? responseText : undefined
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: errorData.error || errorData.message || `Erro ao criar detalhe operacional: ${response.status} ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta de sucesso:', parseError);
      console.error('Resposta recebida:', responseText);
      return NextResponse.json(
        { error: 'Resposta inválida da API externa' },
        { status: 500 }
      );
    }
    
    console.log('✅ OS criada com sucesso:', data);
    
    // A API pode retornar { success: true, id: ... } ou { success: true, data: { id: ... } }
    // Vamos normalizar a resposta
    if (data.success && data.id && !data.data) {
      return NextResponse.json({
        success: true,
        data: { id: data.id },
        message: data.message
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao criar detalhe operacional:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Stack trace:', errorStack);
    console.error('❌ API_BASE_URL:', API_BASE_URL);
    console.error('❌ Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    
    // Se for um erro de fetch, incluir mais detalhes
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: `Erro ao conectar com a API externa: ${errorMessage}`,
          details: {
            apiUrl: API_BASE_URL,
            message: 'Verifique se a API está acessível e se a URL está correta'
          },
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: {
          apiUrl: API_BASE_URL,
          type: error instanceof Error ? error.constructor.name : typeof error
        },
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

