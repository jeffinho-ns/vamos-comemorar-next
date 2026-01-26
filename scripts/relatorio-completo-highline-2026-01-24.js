/**
 * Relatório COMPLETO de reservas do Highline em 24/01/2026
 * Inclui: todas as reservas, guest lists e convidados de cada lista
 */

const API_URL = process.env.API_URL || 'https://vamos-comemorar-api.onrender.com';

async function gerarRelatorioCompleto() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO COMPLETO - HIGHLINE - 24/01/2026');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const highlineId = 7;
    const dataRelatorio = '2026-01-24';
    
    // 1. Buscar todas as reservas
    console.log('1️⃣ Buscando reservas...');
    const restaurantRes = await fetch(`${API_URL}/api/restaurant-reservations?date=${dataRelatorio}&establishment_id=${highlineId}&include_cancelled=true`);
    const restaurantData = await restaurantRes.json();
    const reservations = restaurantData.reservations || restaurantData.data || [];
    console.log(`   ✅ ${reservations.length} reserva(s) encontrada(s)\n`);
    
    // 2. Buscar guest lists
    console.log('2️⃣ Buscando guest lists...');
    const guestListsRes = await fetch(`${API_URL}/api/admin/guest-lists?month=2026-01&establishment_id=${highlineId}`);
    const guestListsData = await guestListsRes.json();
    const allGuestLists = guestListsData.guestLists || guestListsData.data || [];
    
    // Filtrar guest lists do dia
    const guestListsDoDia = allGuestLists.filter((gl) => {
      if (!gl.reservation_date) return false;
      const dateStr = String(gl.reservation_date).split('T')[0];
      return dateStr === dataRelatorio;
    });
    console.log(`   ✅ ${guestListsDoDia.length} guest list(s) encontrada(s)\n`);
    
    // 3. Criar mapa de reservation_id -> guest_list
    const guestListMap = {};
    guestListsDoDia.forEach((gl) => {
      guestListMap[gl.reservation_id] = gl;
    });
    
    // 4. Buscar convidados de cada guest list
    console.log('3️⃣ Buscando convidados de cada guest list...\n');
    const relatorioCompleto = [];
    
    for (const reservation of reservations) {
      const guestList = guestListMap[reservation.id];
      let guests = [];
      
      if (guestList) {
        try {
          const guestsRes = await fetch(`${API_URL}/api/admin/guest-lists/${guestList.guest_list_id || guestList.id}/guests`);
          if (guestsRes.ok) {
            const guestsData = await guestsRes.ok ? await guestsRes.json() : { guests: [] };
            guests = guestsData.guests || guestsData.data || [];
          }
        } catch (e) {
          console.error(`   ⚠️ Erro ao buscar convidados da reserva ${reservation.id}:`, e.message);
        }
      }
      
      relatorioCompleto.push({
        reservation: reservation,
        guestList: guestList,
        guests: guests
      });
    }
    
    // 5. Gerar relatório formatado
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RELATÓRIO DETALHADO POR RESERVA');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    relatorioCompleto.forEach((item, index) => {
      const r = item.reservation;
      const gl = item.guestList;
      const guests = item.guests;
      
      console.log(`${index + 1}. RESERVA ID: ${r.id}`);
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`   Cliente: ${r.client_name}`);
      console.log(`   Telefone: ${r.client_phone || 'N/A'}`);
      console.log(`   Email: ${r.client_email || 'N/A'}`);
      console.log(`   Data: ${r.reservation_date}`);
      console.log(`   Horário: ${r.reservation_time || 'N/A'}`);
      console.log(`   Pessoas: ${r.number_of_people || 'N/A'}`);
      console.log(`   Mesa: ${r.table_number || 'N/A'}`);
      console.log(`   Área: ${r.area_name || 'N/A'}`);
      console.log(`   Status: ${r.status || 'N/A'}`);
      console.log(`   Origem: ${r.origin || 'N/A'}`);
      
      if (gl) {
        console.log(`\n   📝 GUEST LIST ID: ${gl.guest_list_id || gl.id}`);
        console.log(`   Dono da Lista: ${gl.owner_name || r.client_name}`);
        console.log(`   Total de Convidados Cadastrados: ${guests.length}`);
        console.log(`   Check-in Dono: ${gl.owner_checked_in ? 'Sim' : 'Não'}`);
        if (gl.owner_checkin_time) {
          console.log(`   Horário Check-in Dono: ${new Date(gl.owner_checkin_time).toLocaleString('pt-BR')}`);
        }
        console.log(`   Check-out Dono: ${gl.owner_checked_out ? 'Sim' : 'Não'}`);
        if (gl.owner_checkout_time) {
          console.log(`   Horário Check-out Dono: ${new Date(gl.owner_checkout_time).toLocaleString('pt-BR')}`);
        }
        
        if (guests.length > 0) {
          console.log(`\n   👥 LISTA DE CONVIDADOS (${guests.length}):`);
          console.log('   ───────────────────────────────────────────────────────────');
          guests.forEach((guest, gIndex) => {
            console.log(`   ${gIndex + 1}. ${guest.name || guest.nome || 'Sem nome'}`);
            if (guest.whatsapp) {
              console.log(`      WhatsApp: ${guest.whatsapp}`);
            }
            console.log(`      Check-in: ${guest.checked_in ? '✅ Sim' : '❌ Não'}`);
            if (guest.checkin_time) {
              console.log(`      Horário Check-in: ${new Date(guest.checkin_time).toLocaleString('pt-BR')}`);
            }
            console.log(`      Check-out: ${guest.checked_out ? '✅ Sim' : '❌ Não'}`);
            if (guest.checkout_time) {
              console.log(`      Horário Check-out: ${new Date(guest.checkout_time).toLocaleString('pt-BR')}`);
            }
            if (guest.entrada_tipo) {
              console.log(`      Tipo Entrada: ${guest.entrada_tipo}`);
            }
            if (guest.entrada_valor) {
              console.log(`      Valor Entrada: R$ ${guest.entrada_valor}`);
            }
            console.log('');
          });
          
          // Resumo de check-ins
          const checkedIn = guests.filter(g => g.checked_in === 1 || g.checked_in === true).length;
          const checkedOut = guests.filter(g => g.checked_out === 1 || g.checked_out === true).length;
          console.log(`   📊 Resumo: ${checkedIn} fizeram check-in, ${checkedOut} fizeram check-out de ${guests.length} convidados`);
        } else {
          console.log(`\n   ⚠️ Nenhum convidado cadastrado nesta lista ainda.`);
        }
      } else {
        console.log(`\n   ⚠️ Esta reserva não possui guest list associada.`);
      }
      
      console.log('\n');
    });
    
    // 6. Resumo geral
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO GERAL');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const totalReservas = relatorioCompleto.length;
    const reservasComGuestList = relatorioCompleto.filter(item => item.guestList).length;
    const totalConvidados = relatorioCompleto.reduce((sum, item) => sum + item.guests.length, 0);
    const totalCheckIns = relatorioCompleto.reduce((sum, item) => {
      return sum + item.guests.filter(g => g.checked_in === 1 || g.checked_in === true).length;
    }, 0);
    const totalCheckOuts = relatorioCompleto.reduce((sum, item) => {
      return sum + item.guests.filter(g => g.checked_out === 1 || g.checked_out === true).length;
    }, 0);
    const donosComCheckIn = relatorioCompleto.filter(item => 
      item.guestList && (item.guestList.owner_checked_in === 1 || item.guestList.owner_checked_in === true)
    ).length;
    const donosComCheckOut = relatorioCompleto.filter(item => 
      item.guestList && (item.guestList.owner_checked_out === 1 || item.guestList.owner_checked_out === true)
    ).length;
    
    console.log(`Total de Reservas: ${totalReservas}`);
    console.log(`Reservas com Guest List: ${reservasComGuestList}`);
    console.log(`Reservas sem Guest List: ${totalReservas - reservasComGuestList}`);
    console.log(`Total de Convidados Cadastrados: ${totalConvidados}`);
    console.log(`Total de Check-ins de Convidados: ${totalCheckIns}`);
    console.log(`Total de Check-outs de Convidados: ${totalCheckOuts}`);
    console.log(`Donos com Check-in: ${donosComCheckIn}`);
    console.log(`Donos com Check-out: ${donosComCheckOut}`);
    
    // 7. Lista consolidada de todos os convidados
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('👥 LISTA CONSOLIDADA DE TODOS OS CONVIDADOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    relatorioCompleto.forEach((item) => {
      if (item.guestList && item.guests.length > 0) {
        console.log(`\n📋 ${item.reservation.client_name} (Reserva ID: ${item.reservation.id})`);
        console.log(`   Mesa: ${item.reservation.table_number || 'N/A'} | Horário: ${item.reservation.reservation_time || 'N/A'}`);
        item.guests.forEach((guest, index) => {
          const status = guest.checked_out 
            ? '✅ Concluído' 
            : guest.checked_in 
            ? '🟢 Presente' 
            : '⏳ Aguardando';
          console.log(`   ${index + 1}. ${guest.name || guest.nome || 'Sem nome'} - ${status}`);
        });
      }
    });
    
    console.log('\n✅ Relatório completo gerado!');
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    console.error('Stack:', error.stack);
  }
}

gerarRelatorioCompleto();

