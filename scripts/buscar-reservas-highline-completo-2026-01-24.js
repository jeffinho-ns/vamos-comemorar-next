/**
 * Script completo para buscar TODAS as reservas do Highline no dia 24/01/2026
 * Inclui: restaurant_reservations, large_reservations, guest_lists
 */

const API_URL = process.env.API_URL || 'https://vamos-comemorar-api.onrender.com';

async function buscarTodasReservasHighline() {
  try {
    console.log('🔍 Busca COMPLETA de reservas do Highline em 24/01/2026...\n');
    
    const highlineId = 7; // ID conhecido do Highline
    
    // 1. Buscar restaurant_reservations
    console.log('1️⃣ Buscando restaurant_reservations...');
    const restaurantRes = await fetch(`${API_URL}/api/restaurant-reservations?date=2026-01-24&establishment_id=${highlineId}&include_cancelled=true`);
    const restaurantData = await restaurantRes.json();
    const restaurantReservations = restaurantData.reservations || restaurantData.data || [];
    console.log(`   ✅ ${restaurantReservations.length} reserva(s) encontrada(s)\n`);
    
    // 2. Buscar large_reservations
    console.log('2️⃣ Buscando large_reservations...');
    const largeRes = await fetch(`${API_URL}/api/large-reservations?date=2026-01-24&establishment_id=${highlineId}&include_cancelled=true`);
    const largeData = await largeRes.json();
    const largeReservations = largeData.reservations || largeData.data || [];
    console.log(`   ✅ ${largeReservations.length} reserva(s) grande(s) encontrada(s)\n`);
    
    // 3. Buscar guest_lists relacionadas
    console.log('3️⃣ Buscando guest_lists...');
    const guestListsRes = await fetch(`${API_URL}/api/admin/guest-lists?month=2026-01&establishment_id=${highlineId}`);
    const guestListsData = await guestListsRes.json();
    const guestLists = guestListsData.guestLists || guestListsData.data || [];
    
    // Filtrar apenas as do dia 24/01/2026
    const guestListsDoDia = guestLists.filter((gl) => {
      if (!gl.reservation_date) return false;
      const dateStr = String(gl.reservation_date).split('T')[0];
      return dateStr === '2026-01-24';
    });
    console.log(`   ✅ ${guestListsDoDia.length} guest list(s) encontrada(s) para o dia\n`);
    
    // 4. Resumo total
    const total = restaurantReservations.length + largeReservations.length;
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 RESUMO TOTAL: ${total} reserva(s) encontrada(s)`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 5. Detalhes das restaurant_reservations
    if (restaurantReservations.length > 0) {
      console.log('📋 RESTAURANT RESERVATIONS:');
      console.log('─────────────────────────────────────────────────────────────\n');
      restaurantReservations.forEach((r, index) => {
        console.log(`${index + 1}. ID: ${r.id} | ${r.client_name} | ${r.reservation_time} | Mesa: ${r.table_number || 'N/A'} | Status: ${r.status}`);
      });
      console.log('');
    }
    
    // 6. Detalhes das large_reservations
    if (largeReservations.length > 0) {
      console.log('📋 LARGE RESERVATIONS:');
      console.log('─────────────────────────────────────────────────────────────\n');
      largeReservations.forEach((r, index) => {
        console.log(`${index + 1}. ID: ${r.id} | ${r.client_name} | ${r.reservation_time} | Mesas: ${r.selected_tables || 'N/A'} | Status: ${r.status}`);
      });
      console.log('');
    }
    
    // 7. Detalhes das guest_lists
    if (guestListsDoDia.length > 0) {
      console.log('📋 GUEST LISTS:');
      console.log('─────────────────────────────────────────────────────────────\n');
      guestListsDoDia.forEach((gl, index) => {
        console.log(`${index + 1}. Guest List ID: ${gl.guest_list_id || gl.id} | Dono: ${gl.owner_name} | Reserva ID: ${gl.reservation_id} | Tipo: ${gl.reservation_type}`);
      });
      console.log('');
    }
    
    // 8. Verificar reservas canceladas ou deletadas
    const canceladasRestaurant = restaurantReservations.filter((r) => 
      r.status && (r.status.toLowerCase().includes('cancel') || r.status.toLowerCase().includes('cancela'))
    );
    const canceladasLarge = largeReservations.filter((r) => 
      r.status && (r.status.toLowerCase().includes('cancel') || r.status.toLowerCase().includes('cancela'))
    );
    
    if (canceladasRestaurant.length > 0 || canceladasLarge.length > 0) {
      console.log('⚠️ RESERVAS CANCELADAS ENCONTRADAS:');
      console.log('─────────────────────────────────────────────────────────────\n');
      canceladasRestaurant.forEach((r) => {
        console.log(`   Restaurant ID ${r.id}: ${r.client_name} (${r.reservation_date} ${r.reservation_time}) - Status: ${r.status}`);
      });
      canceladasLarge.forEach((r) => {
        console.log(`   Large ID ${r.id}: ${r.client_name} (${r.reservation_date} ${r.reservation_time}) - Status: ${r.status}`);
      });
      console.log('');
    }
    
    // 9. Verificar duplicatas ou conflitos de mesa
    console.log('🔍 Verificando conflitos de mesa/horário...\n');
    const mesasPorHorario = {};
    
    [...restaurantReservations, ...largeReservations].forEach((r) => {
      const horario = r.reservation_time || '';
      const mesa = r.table_number || r.selected_tables || '';
      if (horario && mesa) {
        const key = `${horario}_${mesa}`;
        if (!mesasPorHorario[key]) {
          mesasPorHorario[key] = [];
        }
        mesasPorHorario[key].push(`ID ${r.id} - ${r.client_name}`);
      }
    });
    
    const conflitos = Object.entries(mesasPorHorario).filter(([_, reservas]) => reservas.length > 1);
    if (conflitos.length > 0) {
      console.log('⚠️ CONFLITOS DE MESA/HORÁRIO ENCONTRADOS:');
      conflitos.forEach(([key, reservas]) => {
        const [horario, mesa] = key.split('_');
        console.log(`   Mesa ${mesa} às ${horario}:`);
        reservas.forEach((r) => console.log(`      - ${r}`));
      });
    } else {
      console.log('   ✅ Nenhum conflito de mesa/horário encontrado.');
    }
    
    console.log('\n✅ Busca completa concluída!');
    console.log(`\n📝 Total: ${total} reserva(s) (${restaurantReservations.length} restaurant + ${largeReservations.length} large)`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar reservas:', error);
    console.error('Stack:', error.stack);
  }
}

buscarTodasReservasHighline();

