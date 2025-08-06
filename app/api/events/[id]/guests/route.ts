import { NextRequest, NextResponse } from 'next/server';

// GET - Buscar convidados do evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    
    // Dados mockados específicos por estabelecimento
    const establishmentGuests: Record<number, any[]> = {
      7: [ // High Line - Clientes VIP
        {
          id: 1,
          name: "João Silva",
          document: "123.456.789-00",
          email: "joao@email.com",
          phone: "(11) 99999-9999",
          companions: 0,
          status: 'pending' as const,
          insertedBy: "Highline Bar SP - Highline",
          observation: "Cliente VIP",
          insertedAt: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          name: "Maria Santos",
          document: "987.654.321-00",
          email: "maria@email.com",
          phone: "(11) 88888-8888",
          companions: 2,
          status: 'confirmed' as const,
          insertedBy: "Highline Bar SP - Highline",
          observation: "Cliente Premium",
          insertedAt: "2024-01-16T14:20:00Z"
        },
        {
          id: 3,
          name: "Pedro Oliveira",
          document: "456.789.123-00",
          email: "pedro@email.com",
          phone: "(11) 77777-7777",
          companions: 0,
          status: 'checked-in' as const,
          insertedBy: "Highline Bar SP - Highline",
          observation: "Cliente frequente",
          insertedAt: "2024-01-17T09:15:00Z"
        }
      ],
      1: [ // Seu Justino - Clientes mais descontraídos
        {
          id: 4,
          name: "Ana Costa",
          document: "789.123.456-00",
          email: "ana@email.com",
          phone: "(11) 66666-6666",
          companions: 1,
          status: 'pending' as const,
          insertedBy: "Seu Justino - Admin",
          observation: "Primeira vez",
          insertedAt: "2024-01-18T16:45:00Z"
        },
        {
          id: 5,
          name: "Carlos Ferreira",
          document: "321.654.987-00",
          email: "carlos@email.com",
          phone: "(11) 55555-5555",
          companions: 0,
          status: 'confirmed' as const,
          insertedBy: "Seu Justino - Admin",
          observation: "Cliente regular",
          insertedAt: "2024-01-19T11:30:00Z"
        },
        {
          id: 6,
          name: "Fernanda Lima",
          document: "147.258.369-00",
          email: "fernanda@email.com",
          phone: "(11) 44444-4444",
          companions: 3,
          status: 'checked-in' as const,
          insertedBy: "Seu Justino - Admin",
          observation: "Grupo de amigos",
          insertedAt: "2024-01-20T13:15:00Z"
        }
      ],
      4: [ // Oh Freguês - Clientes familiares
        {
          id: 7,
          name: "Roberto Almeida",
          document: "963.852.741-00",
          email: "roberto@email.com",
          phone: "(11) 33333-3333",
          companions: 0,
          status: 'pending' as const,
          insertedBy: "Oh Freguês - Admin",
          observation: "Cliente familiar",
          insertedAt: "2024-01-21T10:00:00Z"
        },
        {
          id: 8,
          name: "Lucia Mendes",
          document: "852.741.963-00",
          email: "lucia@email.com",
          phone: "(11) 22222-2222",
          companions: 2,
          status: 'confirmed' as const,
          insertedBy: "Oh Freguês - Admin",
          observation: "Família com crianças",
          insertedAt: "2024-01-22T15:30:00Z"
        }
      ],
      8: [ // Pracinha - Clientes ao ar livre
        {
          id: 9,
          name: "Paulo Santos",
          document: "741.963.852-00",
          email: "paulo@email.com",
          phone: "(11) 11111-1111",
          companions: 0,
          status: 'pending' as const,
          insertedBy: "Pracinha - Admin",
          observation: "Cliente ao ar livre",
          insertedAt: "2024-01-23T12:00:00Z"
        },
        {
          id: 10,
          name: "Carla Oliveira",
          document: "369.258.147-00",
          email: "carla@email.com",
          phone: "(11) 00000-0000",
          companions: 1,
          status: 'confirmed' as const,
          insertedBy: "Pracinha - Admin",
          observation: "Cliente feijoada",
          insertedAt: "2024-01-24T14:45:00Z"
        }
      ]
    };

    const mockGuests = establishmentGuests[parseInt(eventId)] || [
      {
        id: 1,
        name: "Cliente Padrão",
        document: "000.000.000-00",
        email: "cliente@email.com",
        phone: "(11) 00000-0000",
        companions: 0,
        status: 'pending' as const,
        insertedBy: "Admin",
        observation: "Cliente padrão",
        insertedAt: "2024-01-25T10:00:00Z"
      }
    ];

    // Se um listId foi especificado, filtrar os convidados (simulação)
    if (listId) {
      console.log(`Buscando convidados para lista ${listId} do evento ${eventId}`);
      // Em uma implementação real, você filtraria por listId no banco de dados
    }

    return NextResponse.json(mockGuests);
  } catch (error) {
    console.error('Erro ao buscar convidados do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convidados do evento' },
      { status: 500 }
    );
  }
}

// POST - Inserir novos convidados
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const { listId, names, insertedBy, observation } = await request.json();
    
    console.log('Inserindo nomes para evento:', eventId);
    console.log('Lista:', listId);
    console.log('Nomes:', names);
    console.log('Inserido por:', insertedBy);
    console.log('Observação:', observation);
    
    // Processar nomes com acompanhantes
    const processedNames = names.map((name: string) => {
      const match = name.match(/(.*)\[(\d+)\]$/);
      if (match) {
        return {
          name: match[1].trim(),
          companions: parseInt(match[2], 10)
        };
      } else {
        return {
          name: name.trim(),
          companions: 0
        };
      }
    });
    
    console.log('Nomes processados:', processedNames);
    
    // Aqui você faria a chamada para sua API backend para salvar os convidados
    // Por enquanto, apenas simulando sucesso
    
    return NextResponse.json({ 
      success: true, 
      message: `${names.length} nomes inseridos com sucesso`,
      processedNames 
    });
  } catch (error) {
    console.error('Erro ao inserir convidados:', error);
    return NextResponse.json(
      { error: 'Erro ao inserir convidados' },
      { status: 500 }
    );
  }
} 