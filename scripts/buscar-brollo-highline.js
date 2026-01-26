/**
 * Busca completa de reservas para "Brollo" no estabelecimento Highline
 * Busca em todas as tabelas: restaurant_reservations, large_reservations, guest_lists
 */

const API_URL = process.env.API_URL || 'https://vamos-comemorar-api.onrender.com';

async function buscarBrolloHighline() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 BUSCA COMPLETA: BROLLO - HIGHLINE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const highlineId = 7;
    const searchTerms = ['brollo', 'brolo', 'broll', 'brol'];
    
    console.log(`📋 Buscando por: "${searchTerms.join('", "')}"`);
    console.log(`🏢 Estabelecimento: Highline (ID: ${highlineId})\n`);
    
    // 1. Buscar em restaurant_reservations
    console.log('1️⃣ Buscando em restaurant_reservations...');
    const restaurantRes = await fetch(`${API_URL}/api/restaurant-reservations?establishment_id=${highlineId}`);
    const restaurantData = await restaurantRes.json();
    const reservations = restaurantData.reservations || restaurantData.data || [];
    
    const brolloReservations = reservations.filter(r => {
      const clientName = (r.client_name || '').toLowerCase();
      const ownerName = (r.owner_name || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      return searchTerms.some(term => 
        clientName.includes(term) || 
        ownerName.includes(term) || 
        responsavel.includes(term)
      );
    });
    
    console.log(`   ✅ ${brolloReservations.length} reserva(s) encontrada(s) em restaurant_reservations\n`);
    
    // 2. Buscar em large_reservations
    console.log('2️⃣ Buscando em large_reservations...');
    const largeRes = await fetch(`${API_URL}/api/large-reservations?establishment_id=${highlineId}`);
    const largeData = await largeRes.json();
    const largeReservations = largeData.reservations || largeData.data || [];
    
    const brolloLarge = largeReservations.filter(r => {
      const clientName = (r.client_name || '').toLowerCase();
      const ownerName = (r.owner_name || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      return searchTerms.some(term => 
        clientName.includes(term) || 
        ownerName.includes(term) || 
        responsavel.includes(term)
      );
    });
    
    console.log(`   ✅ ${brolloLarge.length} reserva(s) encontrada(s) em large_reservations\n`);
    
    // 3. Buscar em guest_lists (listas de aniversário)
    console.log('3️⃣ Buscando em guest_lists...');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Buscar guest lists do Highline (buscar em vários meses)
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
                    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
                    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
                    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
                    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    const allGuestLists = [];
    
    console.log(`   Buscando em ${months.length} meses...`);
    for (const month of months) {
      try {
        const guestListsRes = await fetch(`${API_URL}/api/admin/guest-lists?month=${month}&establishment_id=${highlineId}`, { headers });
        if (guestListsRes.ok) {
          const guestListsData = await guestListsRes.json();
          const guestLists = guestListsData.guestLists || guestListsData.data || [];
          allGuestLists.push(...guestLists);
        }
      } catch (e) {
        // Ignorar erros silenciosamente para não poluir o output
      }
    }
    
    const brolloGuestLists = allGuestLists.filter(gl => {
      const ownerName = (gl.owner_name || '').toLowerCase();
      return searchTerms.some(term => ownerName.includes(term));
    });
    
    console.log(`   ✅ ${brolloGuestLists.length} guest list(s) encontrada(s)\n`);
    
    // 4. Exibir resultados
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADOS DA BUSCA');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 4. Buscar também em todas as reservas sem filtro de data (busca mais ampla)
    console.log('4️⃣ Buscando em todas as reservas (sem filtro de data)...');
    const allReservationsRes = await fetch(`${API_URL}/api/restaurant-reservations?establishment_id=${highlineId}`);
    const allReservationsData = await allReservationsRes.json();
    const allReservations = allReservationsData.reservations || allReservationsData.data || [];
    
    const brolloAllReservations = allReservations.filter(r => {
      const clientName = (r.client_name || '').toLowerCase();
      const ownerName = (r.owner_name || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      const phone = (r.client_phone || '').toLowerCase();
      const email = (r.client_email || '').toLowerCase();
      return searchTerms.some(term => 
        clientName.includes(term) || 
        ownerName.includes(term) || 
        responsavel.includes(term) ||
        phone.includes(term) ||
        email.includes(term)
      );
    });
    
    console.log(`   ✅ ${brolloAllReservations.length} reserva(s) adicional(is) encontrada(s)\n`);
    
    // Combinar resultados
    const todasReservas = [...new Set([...brolloReservations, ...brolloAllReservations].map(r => r.id))];
    const reservasUnicas = [...brolloReservations, ...brolloAllReservations.filter(r => !brolloReservations.find(br => br.id === r.id))];
    
    if (reservasUnicas.length === 0 && brolloLarge.length === 0 && brolloGuestLists.length === 0) {
      console.log('❌ Nenhuma reserva encontrada para "Brollo" no Highline.');
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se o nome está escrito corretamente');
      console.log('   - Tente buscar por parte do nome (ex: "brol")');
      console.log('   - Verifique se a reserva está em outro estabelecimento');
      console.log(`   - Total de reservas verificadas: ${allReservations.length} restaurant + ${largeReservations.length} large`);
      return;
    }
    
    // Restaurant Reservations
    if (reservasUnicas.length > 0) {
      console.log('📋 RESTAURANT RESERVATIONS:');
      console.log('─────────────────────────────────────────────────────────────');
      reservasUnicas.forEach((r, index) => {
        console.log(`\n${index + 1}. Reserva ID: ${r.id}`);
        console.log(`   Cliente: ${r.client_name || r.owner_name || r.responsavel || 'N/A'}`);
        console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
        console.log(`   Email: ${r.client_email || 'N/A'}`);
        console.log(`   Data: ${r.reservation_date || 'N/A'}`);
        console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
        console.log(`   Pessoas: ${r.number_of_people || 'N/A'}`);
        console.log(`   Mesa: ${r.table_number || 'N/A'}`);
        console.log(`   Área: ${r.area_name || 'N/A'}`);
        console.log(`   Status: ${r.status || 'N/A'}`);
        console.log(`   Origem: ${r.origin || 'N/A'}`);
        console.log(`   Check-in: ${r.checked_in ? '✅ Sim' : '❌ Não'}`);
        if (r.checkin_time) {
          console.log(`   Horário Check-in: ${new Date(r.checkin_time).toLocaleString('pt-BR')}`);
        }
      });
      console.log('\n');
    }
    
    // Large Reservations
    if (brolloLarge.length > 0) {
      console.log('📋 LARGE RESERVATIONS:');
      console.log('─────────────────────────────────────────────────────────────');
      brolloLarge.forEach((r, index) => {
        console.log(`\n${index + 1}. Reserva ID: ${r.id}`);
        console.log(`   Cliente: ${r.client_name || r.owner_name || r.responsavel || 'N/A'}`);
        console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
        console.log(`   Email: ${r.client_email || 'N/A'}`);
        console.log(`   Data: ${r.reservation_date || 'N/A'}`);
        console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
        console.log(`   Pessoas: ${r.number_of_people || 'N/A'}`);
        console.log(`   Status: ${r.status || 'N/A'}`);
        console.log(`   Origem: ${r.origin || 'N/A'}`);
        console.log(`   Check-in: ${r.checked_in ? '✅ Sim' : '❌ Não'}`);
        if (r.checkin_time) {
          console.log(`   Horário Check-in: ${new Date(r.checkin_time).toLocaleString('pt-BR')}`);
        }
      });
      console.log('\n');
    }
    
    // Guest Lists
    if (brolloGuestLists.length > 0) {
      console.log('📋 GUEST LISTS (Listas de Aniversário):');
      console.log('─────────────────────────────────────────────────────────────');
      for (const gl of brolloGuestLists) {
        console.log(`\nGuest List ID: ${gl.guest_list_id || gl.id}`);
        console.log(`   Dono da Lista: ${gl.owner_name || 'N/A'}`);
        console.log(`   Data: ${gl.reservation_date || 'N/A'}`);
        console.log(`   Tipo: ${gl.event_type || 'N/A'}`);
        console.log(`   Total Convidados: ${gl.total_guests || 0}`);
        console.log(`   Check-in Dono: ${gl.owner_checked_in ? '✅ Sim' : '❌ Não'}`);
        if (gl.owner_checkin_time) {
          console.log(`   Horário Check-in Dono: ${new Date(gl.owner_checkin_time).toLocaleString('pt-BR')}`);
        }
        console.log(`   Check-out Dono: ${gl.owner_checked_out ? '✅ Sim' : '❌ Não'}`);
        if (gl.owner_checkout_time) {
          console.log(`   Horário Check-out Dono: ${new Date(gl.owner_checkout_time).toLocaleString('pt-BR')}`);
        }
        
        // Buscar convidados desta lista
        try {
          const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${gl.guest_list_id || gl.id}/guests`, { headers });
          if (guestsRes.ok) {
            const guestsData = await guestsRes.json();
            const guests = guestsData.guests || guestsData.data || [];
            if (guests.length > 0) {
              console.log(`   Convidados (${guests.length}):`);
              guests.forEach((g, gIndex) => {
                console.log(`      ${gIndex + 1}. ${g.name || 'Sem nome'}`);
                console.log(`         Check-in: ${g.checked_in ? '✅ Sim' : '❌ Não'}`);
                if (g.checkin_time) {
                  console.log(`         Horário: ${new Date(g.checkin_time).toLocaleString('pt-BR')}`);
                }
              });
            }
          }
        } catch (e) {
          console.error(`   ⚠️ Erro ao buscar convidados:`, e.message);
        }
      }
      console.log('\n');
    }
    
    // Resumo
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Total de Reservas Encontradas: ${reservasUnicas.length + brolloLarge.length + brolloGuestLists.length}`);
    console.log(`   - Restaurant Reservations: ${reservasUnicas.length}`);
    console.log(`   - Large Reservations: ${brolloLarge.length}`);
    console.log(`   - Guest Lists: ${brolloGuestLists.length}`);
    
    console.log('\n✅ Busca concluída!');
    
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar busca
buscarBrolloHighline();

