/**
 * Testa no Seu Justino: eventos, reservas e check-ins para 23/01/2026.
 * Uso: node scripts/test-seujustino-checkins.mjs
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
const EMAIL = 'gerente.sjm@seujustino.com.br';
const PASSWORD = '@123Mudar';
const ESTABLISHMENT_ID = 1; // Seu Justino
const DATE = '2026-01-23';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function main() {
  console.log('🔐 Login...');
  const login = await fetchJson(`${API}/api/users/login`, {
    method: 'POST',
    body: JSON.stringify({ access: EMAIL, password: PASSWORD }),
  });
  const token = login.token || login.data?.token;
  if (!token) {
    console.error('❌ Sem token no login. Resposta:', JSON.stringify(login, null, 2));
    process.exit(1);
  }
  console.log('✅ Login OK\n');

  const headers = { Authorization: `Bearer ${token}` };

  console.log(`📅 Eventos (establishment_id=${ESTABLISHMENT_ID}, data_evento=${DATE})...`);
  let eventosRes;
  try {
    eventosRes = await fetch(
      `${API}/api/v1/eventos?establishment_id=${ESTABLISHMENT_ID}&data_evento=${DATE}`,
      { headers }
    );
  } catch (e) {
    console.error('❌ Erro ao listar eventos:', e.message);
    process.exit(1);
  }
  const eventosData = await eventosRes.json().catch(() => ({}));
  const eventos = Array.isArray(eventosData) ? eventosData : eventosData.eventos || eventosData.data || [];
  console.log(`   Encontrados: ${eventos.length} evento(s)`);
  eventos.forEach((e, i) => {
    console.log(`   [${i + 1}] id=${e.evento_id || e.id} | ${e.nome} | ${e.data_evento} ${e.horario_funcionamento || e.horario || ''} | ${e.establishment_name || ''}`);
  });
  console.log('');

  const eventoId = eventos[0]?.evento_id ?? eventos[0]?.id;
  if (!eventoId) {
    console.log('⚠️ Nenhum evento para essa data. Tentando listar eventos do Seu Justino sem filtro de data...');
    const allRes = await fetch(
      `${API}/api/v1/eventos?establishment_id=${ESTABLISHMENT_ID}`,
      { headers }
    );
    const allData = await allRes.json().catch(() => ({}));
    const all = Array.isArray(allData) ? allData : allData.eventos || allData.data || [];
    console.log(`   Total eventos: ${all.length}`);
    all.slice(0, 5).forEach((e, i) => {
      console.log(`   [${i + 1}] id=${e.evento_id || e.id} | ${e.data_evento} | ${e.nome}`);
    });
  } else {
    console.log(`📋 Check-ins do evento ${eventoId}...`);
    const checkinsRes = await fetch(`${API}/api/v1/eventos/${eventoId}/checkins`, { headers });
    if (!checkinsRes.ok) {
      console.error('❌ Erro checkins:', checkinsRes.status, await checkinsRes.text());
    } else {
      const checkins = await checkinsRes.json();
      const ev = checkins.evento || {};
      console.log(`   Evento: ${ev.nome} | ${ev.data_evento} | establishment_id=${ev.establishment_id} | ${ev.establishment_name}`);
      const d = checkins.dados || {};
      console.log(`   reservasMesa: ${(d.reservasMesa || []).length}`);
      console.log(`   reservasRestaurante: ${(d.reservasRestaurante || []).length}`);
      console.log(`   convidadosReservasRestaurante: ${(d.convidadosReservasRestaurante || []).length}`);
      console.log(`   guestListsRestaurante: ${(d.guestListsRestaurante || []).length}`);
      console.log(`   promoters: ${(d.promoters || []).length}`);
      console.log(`   camarotes: ${(d.camarotes || []).length}`);
      if ((d.guestListsRestaurante || []).length) {
        console.log('   Guest lists:');
        d.guestListsRestaurante.forEach((gl, i) => {
          console.log(`      [${i + 1}] ${gl.owner_name} | mesa ${gl.table_number} | ${gl.reservation_date} ${gl.reservation_time}`);
        });
      }
      if ((d.reservasRestaurante || []).length) {
        console.log('   Reservas restaurante:');
        d.reservasRestaurante.forEach((r, i) => {
          console.log(`      [${i + 1}] id=${r.id} | ${r.responsavel || r.client_name} | mesa ${r.table_number} | ${r.reservation_date}`);
        });
      }
      const conv = d.convidadosReservasRestaurante || [];
      const owners = d.guestListsRestaurante || [];
      const cam = d.camarotes || [];
      const totalPeople = conv.length + owners.length + cam.reduce((s, c) => s + (c.total_convidados || 0), 0);
      const checkinsPeople = conv.filter(c => c.status_checkin === 1 || c.status_checkin === true).length +
        owners.filter(o => o.owner_checked_in === 1).length +
        cam.reduce((s, c) => s + (c.convidados_checkin || 0), 0);
      console.log(`   Simulação Total Geral: ${checkinsPeople}/${totalPeople} (convidados+donos+camarotes)`);
    }
    console.log('');
  }

  console.log(`🍽️ Restaurant reservations (establishment_id=${ESTABLISHMENT_ID}, date=${DATE})...`);
  const rrRes = await fetch(
    `${API}/api/restaurant-reservations?establishment_id=${ESTABLISHMENT_ID}&date=${DATE}`,
    { headers }
  );
  const rrData = await rrRes.json().catch(() => ({}));
  const reservations = rrData.reservations || [];
  console.log(`   Encontradas: ${reservations.length} reserva(s)`);
  reservations.forEach((r, i) => {
    console.log(`   [${i + 1}] id=${r.id} | ${r.client_name} | ${r.reservation_date} ${r.reservation_time} | mesa ${r.table_number} | ${r.area_name || ''}`);
  });
  console.log('');

  console.log(`📦 Large reservations (establishment_id=${ESTABLISHMENT_ID}, date=${DATE})...`);
  const lrRes = await fetch(
    `${API}/api/large-reservations?establishment_id=${ESTABLISHMENT_ID}&date=${DATE}`,
    { headers }
  );
  const lrData = await lrRes.json().catch(() => ({}));
  const large = lrData.reservations || lrData.data || [];
  console.log(`   Encontradas: ${large.length} reserva(s)`);
  large.forEach((r, i) => {
    console.log(`   [${i + 1}] id=${r.id} | ${r.client_name} | ${r.reservation_date} ${r.reservation_time}`);
  });

  console.log('\n✅ Teste concluído.');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
