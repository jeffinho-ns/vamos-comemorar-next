type ActionLog = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  action_type: string;
  action_description: string;
  resource_type: string | null;
  resource_id: number | null;
  establishment_id: number | null;
  establishment_name: string | null;
  request_method: string | null;
  request_url: string | null;
  additional_data: unknown;
  created_at: string;
};

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://vamos-comemorar-api.onrender.com';

const AUTH_TOKEN = process.env.AUTH_TOKEN; // token puro, sem "Bearer "

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase();
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function isCardapioLog(log: ActionLog): boolean {
  const joined = [
    log.action_type,
    log.action_description,
    log.resource_type,
    log.request_url,
    log.additional_data,
  ]
    .map(normalizeText)
    .join(' ');

  return (
    joined.includes('/api/cardapio') ||
    joined.includes('/cardapio/') ||
    joined.includes('cardapio') ||
    joined.includes('cardápio') ||
    joined.includes('menu') ||
    joined.includes('categoria') ||
    joined.includes('subcategoria') ||
    joined.includes('item')
  );
}

function isAlteration(log: ActionLog): boolean {
  const method = normalizeText(log.request_method);
  const actionType = normalizeText(log.action_type);
  const description = normalizeText(log.action_description);

  if (['post', 'put', 'patch', 'delete'].includes(method)) return true;
  if (
    actionType.includes('create') ||
    actionType.includes('update') ||
    actionType.includes('delete')
  )
    return true;

  return (
    description.includes('criou') ||
    description.includes('alterou') ||
    description.includes('atualizou') ||
    description.includes('editou') ||
    description.includes('removeu') ||
    description.includes('excluiu')
  );
}

function toIso(d: Date) {
  return d.toISOString();
}

async function fetchLogs(startIso: string, endIso: string): Promise<ActionLog[]> {
  const params = new URLSearchParams();
  params.set('startDate', startIso);
  params.set('endDate', endIso);
  params.set('limit', '5000');
  params.set('offset', '0');

  const res = await fetch(`${API_URL}/api/action-logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Falha ao buscar logs: ${res.status} ${res.statusText}${
        text ? `\n${text}` : ''
      }`
    );
  }

  const data = (await res.json()) as { logs?: ActionLog[] };
  return Array.isArray(data.logs) ? data.logs : [];
}

function summarizeUsers(logs: ActionLog[]) {
  const map = new Map<
    number,
    { name: string; email: string; role: string; count: number; lastAt: string }
  >();

  for (const log of logs) {
    const existing = map.get(log.user_id);
    if (!existing) {
      map.set(log.user_id, {
        name: log.user_name,
        email: log.user_email,
        role: log.user_role,
        count: 1,
        lastAt: log.created_at,
      });
      continue;
    }
    existing.count += 1;
    if (new Date(log.created_at).getTime() > new Date(existing.lastAt).getTime()) {
      existing.lastAt = log.created_at;
    }
  }

  return Array.from(map.entries())
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.count - a.count);
}

async function main() {
  if (!AUTH_TOKEN) {
    console.error(
      'AUTH_TOKEN não informado. Exemplo PowerShell:\n' +
        '$env:AUTH_TOKEN="SEU_TOKEN_ADMIN"\n' +
        'yarn -s tsx scripts/cardapio-usuarios-15d.ts'
    );
    process.exit(1);
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 15);

  const allLogs = await fetchLogs(toIso(start), toIso(end));
  const cardapioLogs = allLogs.filter(isCardapioLog);

  const accessLogs = cardapioLogs.filter((l) => !isAlteration(l));
  const alterationLogs = cardapioLogs.filter((l) => isAlteration(l));

  const accessUsers = summarizeUsers(accessLogs);
  const alterationUsers = summarizeUsers(alterationLogs);

  console.log('Relatório simples - Usuários do Cardápio (últimos 15 dias)');
  console.log(`Período: ${start.toLocaleString('pt-BR')} até ${end.toLocaleString('pt-BR')}`);
  console.log(`Total de logs (API): ${allLogs.length}`);
  console.log(`Total de logs (cardápio): ${cardapioLogs.length}`);
  console.log(`Acessos (estimado): ${accessLogs.length}`);
  console.log(`Alterações (estimado): ${alterationLogs.length}`);
  console.log('');

  console.log('USUÁRIOS QUE ENTRARAM / VISUALIZARAM (estimado):');
  if (accessUsers.length === 0) console.log('- (nenhum encontrado)');
  for (const u of accessUsers) {
    console.log(
      `- ${u.name} <${u.email}> (${u.role}) — ${u.count} ação(ões) — último: ${new Date(
        u.lastAt
      ).toLocaleString('pt-BR')}`
    );
  }

  console.log('');
  console.log('USUÁRIOS QUE ALTERARAM (estimado):');
  if (alterationUsers.length === 0) console.log('- (nenhum encontrado)');
  for (const u of alterationUsers) {
    console.log(
      `- ${u.name} <${u.email}> (${u.role}) — ${u.count} alteração(ões) — última: ${new Date(
        u.lastAt
      ).toLocaleString('pt-BR')}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

