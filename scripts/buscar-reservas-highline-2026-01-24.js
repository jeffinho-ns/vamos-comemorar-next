/**
 * Script para buscar todas as reservas do Highline no dia 24/01/2026
 * Executar: node scripts/buscar-reservas-highline-2026-01-24.js
 */

const API_URL = process.env.API_URL || 'https://vamos-comemorar-api.onrender.com';

async function buscarReservasHighline() {
  try {
    console.log('🔍 Buscando reservas do Highline em 24/01/2026...\n');
    
    // Primeiro, precisamos identificar o ID do estabelecimento Highline
    // Vamos buscar em places e bars
    const [placesRes, barsRes] = await Promise.all([
      fetch(`${API_URL}/api/places`),
      fetch(`${API_URL}/api/bars`)
    ]);
    
    let highlineId = null;
    let highlineName = null;
    
    if (placesRes.ok) {
      const places = await placesRes.json();
      const highline = Array.isArray(places) 
        ? places.find(p => p.name && p.name.toLowerCase().includes('highline'))
        : (places.data || []).find(p => p.name && p.name.toLowerCase().includes('highline'));
      
      if (highline) {
        highlineId = highline.id;
        highlineName = highline.name;
        console.log(`✅ Highline encontrado em places: ID ${highlineId} - ${highlineName}`);
      }
    }
    
    if (!highlineId && barsRes.ok) {
      const bars = await barsRes.json();
      const highline = Array.isArray(bars)
        ? bars.find(b => b.name && b.name.toLowerCase().includes('highline'))
        : (bars.data || []).find(b => b.name && b.name.toLowerCase().includes('highline'));
      
      if (highline) {
        highlineId = highline.id;
        highlineName = highline.name;
        console.log(`✅ Highline encontrado em bars: ID ${highlineId} - ${highlineName}`);
      }
    }
    
    if (!highlineId) {
      console.error('❌ Highline não encontrado! Verificando todos os estabelecimentos...');
      
      // Listar todos os estabelecimentos para debug
      if (placesRes.ok) {
        const places = await placesRes.json();
        const allPlaces = Array.isArray(places) ? places : (places.data || []);
        console.log('\n📋 Estabelecimentos em places:');
        allPlaces.forEach(p => console.log(`   - ID: ${p.id}, Nome: ${p.name}`));
      }
      
      if (barsRes.ok) {
        const bars = await barsRes.json();
        const allBars = Array.isArray(bars) ? bars : (bars.data || []);
        console.log('\n📋 Estabelecimentos em bars:');
        allBars.forEach(b => console.log(`   - ID: ${b.id}, Nome: ${b.name}`));
      }
      
      return;
    }
    
    // Buscar reservas do restaurante para o Highline no dia 24/01/2026
    console.log(`\n📅 Buscando reservas para ${highlineName} (ID: ${highlineId}) em 2026-01-24...\n`);
    
    const reservationsUrl = `${API_URL}/api/restaurant-reservations?date=2026-01-24&establishment_id=${highlineId}&include_cancelled=true`;
    const reservationsRes = await fetch(reservationsUrl);
    
    if (!reservationsRes.ok) {
      console.error(`❌ Erro ao buscar reservas: ${reservationsRes.status} ${reservationsRes.statusText}`);
      const errorText = await reservationsRes.text();
      console.error('Resposta:', errorText);
      return;
    }
    
    const reservationsData = await reservationsRes.json();
    const reservations = reservationsData.reservations || reservationsData.data || [];
    
    console.log(`\n📊 Total de reservas encontradas: ${reservations.length}\n`);
    
    if (reservations.length === 0) {
      console.log('⚠️ Nenhuma reserva encontrada para este dia.');
      console.log('\n💡 Verificando se há reservas em outras datas próximas...');
      
      // Verificar datas próximas
      for (const date of ['2026-01-23', '2026-01-25', '2026-01-22', '2026-01-26']) {
        const nearbyRes = await fetch(`${API_URL}/api/restaurant-reservations?date=${date}&establishment_id=${highlineId}&include_cancelled=true`);
        if (nearbyRes.ok) {
          const nearbyData = await nearbyRes.json();
          const nearbyReservations = nearbyData.reservations || nearbyData.data || [];
          if (nearbyReservations.length > 0) {
            console.log(`   📅 ${date}: ${nearbyReservations.length} reserva(s)`);
          }
        }
      }
      return;
    }
    
    // Exibir detalhes de cada reserva
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 DETALHES DAS RESERVAS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    reservations.forEach((reservation, index) => {
      console.log(`${index + 1}. Reserva ID: ${reservation.id}`);
      console.log(`   Cliente: ${reservation.client_name || 'N/A'}`);
      console.log(`   Telefone: ${reservation.client_phone || 'N/A'}`);
      console.log(`   Email: ${reservation.client_email || 'N/A'}`);
      console.log(`   Data: ${reservation.reservation_date}`);
      console.log(`   Horário: ${reservation.reservation_time || 'N/A'}`);
      console.log(`   Pessoas: ${reservation.number_of_people || 'N/A'}`);
      console.log(`   Mesa: ${reservation.table_number || 'N/A'}`);
      console.log(`   Área: ${reservation.area_name || 'N/A'}`);
      console.log(`   Status: ${reservation.status || 'N/A'}`);
      console.log(`   Origem: ${reservation.origin || 'N/A'}`);
      console.log(`   Check-in: ${reservation.checked_in ? 'Sim' : 'Não'}`);
      if (reservation.checkin_time) {
        console.log(`   Horário Check-in: ${reservation.checkin_time}`);
      }
      if (reservation.checkout_time) {
        console.log(`   Horário Check-out: ${reservation.checkout_time}`);
      }
      if (reservation.notes) {
        console.log(`   Observações: ${reservation.notes}`);
      }
      if (reservation.admin_notes) {
        console.log(`   Notas Admin: ${reservation.admin_notes}`);
      }
      console.log(`   Criado em: ${reservation.created_at || 'N/A'}`);
      console.log(`   Atualizado em: ${reservation.updated_at || 'N/A'}`);
      console.log('');
    });
    
    // Resumo por status
    const statusCount = {};
    reservations.forEach(r => {
      const status = r.status || 'SEM_STATUS';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO POR STATUS:');
    console.log('═══════════════════════════════════════════════════════════════');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} reserva(s)`);
    });
    
    // Verificar se há reservas canceladas ou deletadas
    const canceladas = reservations.filter(r => 
      (r.status && (r.status.toLowerCase().includes('cancel') || r.status.toLowerCase().includes('cancela')))
    );
    
    if (canceladas.length > 0) {
      console.log(`\n⚠️ ATENÇÃO: ${canceladas.length} reserva(s) cancelada(s) encontrada(s):`);
      canceladas.forEach(r => {
        console.log(`   - ID ${r.id}: ${r.client_name} (${r.reservation_date} ${r.reservation_time})`);
      });
    }
    
    // Verificar reservas com guest lists
    console.log('\n🔍 Verificando se há guest lists associadas...');
    const reservationsWithGuestLists = [];
    
    for (const reservation of reservations) {
      try {
        const guestListRes = await fetch(`${API_URL}/api/restaurant-reservations/${reservation.id}/guest-list`);
        if (guestListRes.ok) {
          const guestListData = await guestListRes.json();
          if (guestListData.guestList) {
            reservationsWithGuestLists.push({
              reservation_id: reservation.id,
              client_name: reservation.client_name,
              guest_list_id: guestListData.guestList.id
            });
          }
        }
      } catch (e) {
        // Ignorar erros individuais
      }
    }
    
    if (reservationsWithGuestLists.length > 0) {
      console.log(`\n✅ ${reservationsWithGuestLists.length} reserva(s) com guest list:`);
      reservationsWithGuestLists.forEach(r => {
        console.log(`   - Reserva ID ${r.reservation_id} (${r.client_name}): Guest List ID ${r.guest_list_id}`);
      });
    } else {
      console.log('   Nenhuma reserva com guest list encontrada.');
    }
    
    console.log('\n✅ Busca concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao buscar reservas:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar
buscarReservasHighline();

