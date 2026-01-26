/**
 * Busca COMPLETA de reservas para "Brollo" em TODOS os estabelecimentos
 * Lista também todas as reservas do Highline para análise
 */

const API_URL = process.env.API_URL || 'https://vamos-comemorar-api.onrender.com';

async function buscarBrolloCompleto() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 BUSCA COMPLETA: BROLLO - TODOS OS ESTABELECIMENTOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const searchTerms = ['brollo', 'brolo', 'broll', 'brol'];
    
    console.log(`📋 Buscando por: "${searchTerms.join('", "')}"`);
    console.log(`🌍 Buscando em TODOS os estabelecimentos\n`);
    
    // 1. Buscar no Highline em múltiplas datas
    console.log('1️⃣ Buscando em restaurant_reservations do Highline...');
    const highlineId = 7;
    const dates = [
      '2024-12-01', '2024-12-15', '2024-12-31',
      '2025-01-01', '2025-01-15', '2025-01-31',
      '2025-02-01', '2025-02-15', '2025-02-28',
      '2025-03-01', '2025-03-15', '2025-03-31',
      '2025-04-01', '2025-04-15', '2025-04-30',
      '2025-05-01', '2025-05-15', '2025-05-31',
      '2025-06-01', '2025-06-15', '2025-06-30',
      '2025-07-01', '2025-07-15', '2025-07-31',
      '2025-08-01', '2025-08-15', '2025-08-31',
      '2025-09-01', '2025-09-15', '2025-09-30',
      '2025-10-01', '2025-10-15', '2025-10-31',
      '2025-11-01', '2025-11-15', '2025-11-30',
      '2025-12-01', '2025-12-15', '2025-12-31',
      '2026-01-01', '2026-01-15', '2026-01-24', '2026-01-31',
      '2026-02-01', '2026-02-15', '2026-02-28',
      '2026-03-01', '2026-03-15', '2026-03-31'
    ];
    
    const allReservations = [];
    console.log(`   Buscando em ${dates.length} datas...`);
    
    for (const date of dates) {
      try {
        const restaurantRes = await fetch(`${API_URL}/api/restaurant-reservations?date=${date}&establishment_id=${highlineId}&include_cancelled=true`);
        if (restaurantRes.ok) {
          const restaurantData = await restaurantRes.json();
          const reservations = restaurantData.reservations || restaurantData.data || [];
          allReservations.push(...reservations);
        }
      } catch (e) {
        // Ignorar erros silenciosamente
      }
    }
    
    // Remover duplicatas
    const uniqueReservations = Array.from(
      new Map(allReservations.map(r => [r.id, r])).values()
    );
    
    console.log(`   ✅ ${uniqueReservations.length} reserva(s) única(s) encontrada(s)\n`);
    
    const brolloReservations = uniqueReservations.filter(r => {
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
    
    console.log(`   ✅ ${brolloReservations.length} reserva(s) encontrada(s) em restaurant_reservations\n`);
    
    // 2. Buscar em large_reservations do Highline
    console.log('2️⃣ Buscando em large_reservations do Highline...');
    const allLargeReservations = [];
    
    for (const date of dates) {
      try {
        const largeRes = await fetch(`${API_URL}/api/large-reservations?date=${date}&establishment_id=${highlineId}`);
        if (largeRes.ok) {
          const largeData = await largeRes.json();
          const largeReservations = largeData.reservations || largeData.data || [];
          allLargeReservations.push(...largeReservations);
        }
      } catch (e) {
        // Ignorar erros silenciosamente
      }
    }
    
    const uniqueLargeReservations = Array.from(
      new Map(allLargeReservations.map(r => [r.id, r])).values()
    );
    
    console.log(`   ✅ ${uniqueLargeReservations.length} reserva(s) grande(s) encontrada(s)\n`);
    
    const brolloLarge = uniqueLargeReservations.filter(r => {
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
    
    console.log(`   ✅ ${brolloLarge.length} reserva(s) encontrada(s) em large_reservations\n`);
    
    // 3. Buscar em guest_lists (listas de aniversário)
    console.log('3️⃣ Buscando em guest_lists do Highline...');
    const months = ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', 
                    '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', 
                    '2025-12', '2026-01', '2026-02', '2026-03'];
    const allGuestLists = [];
    
    for (const month of months) {
      try {
        const guestListsRes = await fetch(`${API_URL}/api/admin/guest-lists?month=${month}&establishment_id=${highlineId}`);
        if (guestListsRes.ok) {
          const guestListsData = await guestListsRes.json();
          const guestLists = guestListsData.guestLists || guestListsData.data || [];
          allGuestLists.push(...guestLists);
        }
      } catch (e) {
        // Ignorar erros silenciosamente
      }
    }
    
    const brolloGuestLists = allGuestLists.filter(gl => {
      const ownerName = (gl.owner_name || '').toLowerCase();
      return searchTerms.some(term => ownerName.includes(term));
    });
    
    console.log(`   ✅ ${allGuestLists.length} guest list(s) encontrada(s) no total`);
    console.log(`   ✅ ${brolloGuestLists.length} guest list(s) com "Brollo"\n`);
    
    // 4. Buscar nomes similares no Highline (busca por padrões comuns)
    console.log('4️⃣ Buscando nomes similares no Highline...');
    const similarNames = uniqueReservations.filter(r => {
      const clientName = (r.client_name || '').toLowerCase();
      const ownerName = (r.owner_name || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      const allNames = `${clientName} ${ownerName} ${responsavel}`;
      
      // Buscar por padrões que possam ser similares
      return allNames.includes('br') || 
             allNames.includes('rol') ||
             allNames.includes('llo');
    });
    
    console.log(`   ✅ ${similarNames.length} reserva(s) com nomes potencialmente similares\n`);
    
    // 5. Exibir resultados
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADOS DA BUSCA');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Restaurant Reservations encontradas
    if (brolloReservations.length > 0) {
      console.log('📋 RESTAURANT RESERVATIONS ENCONTRADAS:');
      console.log('─────────────────────────────────────────────────────────────');
      brolloReservations.forEach((r, index) => {
        console.log(`\n${index + 1}. Reserva ID: ${r.id}`);
        console.log(`   Estabelecimento ID: ${r.establishment_id || 'N/A'}`);
        console.log(`   Cliente: ${r.client_name || r.owner_name || r.responsavel || 'N/A'}`);
        console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
        console.log(`   Email: ${r.client_email || 'N/A'}`);
        console.log(`   Data: ${r.reservation_date || 'N/A'}`);
        console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
        console.log(`   Pessoas: ${r.number_of_people || 'N/A'}`);
        console.log(`   Mesa: ${r.table_number || 'N/A'}`);
        console.log(`   Área: ${r.area_name || 'N/A'}`);
        console.log(`   Status: ${r.status || 'N/A'}`);
        console.log(`   Check-in: ${r.checked_in ? '✅ Sim' : '❌ Não'}`);
      });
      console.log('\n');
    }
    
    // Large Reservations encontradas
    if (brolloLarge.length > 0) {
      console.log('📋 LARGE RESERVATIONS ENCONTRADAS:');
      console.log('─────────────────────────────────────────────────────────────');
      brolloLarge.forEach((r, index) => {
        console.log(`\n${index + 1}. Reserva ID: ${r.id}`);
        console.log(`   Estabelecimento ID: ${r.establishment_id || 'N/A'}`);
        console.log(`   Cliente: ${r.client_name || r.owner_name || r.responsavel || 'N/A'}`);
        console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
        console.log(`   Email: ${r.client_email || 'N/A'}`);
        console.log(`   Data: ${r.reservation_date || 'N/A'}`);
        console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
        console.log(`   Pessoas: ${r.number_of_people || 'N/A'}`);
        console.log(`   Status: ${r.status || 'N/A'}`);
        console.log(`   Check-in: ${r.checked_in ? '✅ Sim' : '❌ Não'}`);
      });
      console.log('\n');
    }
    
    // Nomes similares no Highline
    if (similarNames.length > 0) {
      console.log('📋 NOMES SIMILARES NO HIGHLINE (para verificação manual):');
      console.log('─────────────────────────────────────────────────────────────');
      similarNames.slice(0, 20).forEach((r, index) => {
        console.log(`\n${index + 1}. Reserva ID: ${r.id}`);
        console.log(`   Cliente: ${r.client_name || r.owner_name || r.responsavel || 'N/A'}`);
        console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
        console.log(`   Data: ${r.reservation_date || 'N/A'}`);
        console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
      });
      if (similarNames.length > 20) {
        console.log(`\n   ... e mais ${similarNames.length - 20} reserva(s)`);
      }
      console.log('\n');
    }
    
    // Lista completa de reservas do Highline (últimas 50)
    console.log('📋 ÚLTIMAS 50 RESERVAS DO HIGHLINE (para referência):');
    console.log('─────────────────────────────────────────────────────────────');
    const recentHighline = [...uniqueReservations, ...uniqueLargeReservations]
      .sort((a, b) => {
        const dateA = new Date(a.reservation_date || 0);
        const dateB = new Date(b.reservation_date || 0);
        return dateB - dateA;
      })
      .slice(0, 50);
    
    recentHighline.forEach((r, index) => {
      console.log(`${index + 1}. ${r.client_name || r.owner_name || r.responsavel || 'Sem nome'} | ${r.reservation_date || 'N/A'} | ${r.reservation_time || 'N/A'}`);
    });
    console.log('\n');
    
    // Resumo
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Total de Reservas Encontradas para "Brollo": ${brolloReservations.length + brolloLarge.length + brolloGuestLists.length}`);
    console.log(`   - Restaurant Reservations: ${brolloReservations.length}`);
    console.log(`   - Large Reservations: ${brolloLarge.length}`);
    console.log(`   - Guest Lists: ${brolloGuestLists.length}`);
    console.log(`\nTotal de Reservas no Highline: ${uniqueReservations.length + uniqueLargeReservations.length}`);
    console.log(`   - Restaurant Reservations: ${uniqueReservations.length}`);
    console.log(`   - Large Reservations: ${uniqueLargeReservations.length}`);
    console.log(`   - Guest Lists: ${allGuestLists.length}`);
    console.log(`\nNomes Similares no Highline: ${similarNames.length}`);
    
    if (brolloReservations.length === 0 && brolloLarge.length === 0 && brolloGuestLists.length === 0) {
      console.log('\n❌ Nenhuma reserva encontrada para "Brollo" em nenhum estabelecimento.');
      console.log('\n💡 Recomendações:');
      console.log('   1. Verifique se o nome está escrito corretamente');
      console.log('   2. Verifique a lista de nomes similares acima');
      console.log('   3. Verifique as últimas reservas do Highline listadas acima');
      console.log('   4. Considere buscar por telefone ou email se disponível');
    }
    
    console.log('\n✅ Busca concluída!');
    
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar busca
buscarBrolloCompleto();

