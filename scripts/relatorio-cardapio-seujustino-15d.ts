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

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // apenas o token, sem "Bearer "
const ESTABLISHMENT_ID = 1; // Seu Justino

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase();
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function extractAdditionalDataObject(additionalData: unknown): Record<string, unknown> | null {
  if (!additionalData) return null;
  if (typeof additionalData !== 'object') return null;
  if (Array.isArray(additionalData)) return null;
  return additionalData as Record<string, unknown>;
}

function extractEstablishmentIdFromAdditionalData(additionalData: unknown): number | null {
  const obj = extractAdditionalDataObject(additionalData);
  if (!obj) return null;

  const candidates = [
    obj.establishmentId,
    obj.establishment_id,
    obj.estabelecimentoId,
    obj.estabelecimento_id,
    obj.barId,
    obj.bar_id,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }

  return null;
}

function isSeuJustinoLog(log: ActionLog): boolean {
  const establishmentName = normalizeText(log.establishment_name);
  const additionalData = normalizeText(log.additional_data);
  const extractedEstablishmentId = extractEstablishmentIdFromAdditionalData(log.additional_data);

  const matchesName =
    establishmentName.includes('seu justino') && !establishmentName.includes('pracinha');
  const matchesAdditionalData =
    additionalData.includes('seu justino') && !additionalData.includes('pracinha');

  return log.establishment_id === ESTABLISHMENT_ID || extractedEstablishmentId === ESTABLISHMENT_ID || matchesName || matchesAdditionalData;
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
  if (actionType.includes('create') || actionType.includes('update') || actionType.includes('delete')) return true;

  return (
    description.includes('criou') ||
    description.includes('alterou') ||
    description.includes('atualizou') ||
    description.includes('editou') ||
    description.includes('removeu') ||
    description.includes('excluiu')
  );
}

function isoDate(d: Date) {
  // o backend aceita string; usamos ISO completo
  return d.toISOString();
}

async function fetchLogs(startDateIso: string, endDateIso: string): Promise<ActionLog[]> {
  const params = new URLSearchParams();
  params.set('startDate', startDateIso);
  params.set('endDate', endDateIso);
  params.set('limit', '5000');
  params.set('offset', '0');

  const res = await fetch(`${API_URL}/api/action-logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Falha ao buscar logs: ${res.status} ${res.statusText} ${text}`.trim());
  }

  const data = (await res.json()) as { logs?: ActionLog[] };
  return Array.isArray(data.logs) ? data.logs : [];
}

async function main() {
  if (!AUTH_TOKEN) {
    console.error('AUTH_TOKEN não informado. Rode com: $env:AUTH_TOKEN="..." (PowerShell) ou export AUTH_TOKEN="..."');
    process.exit(1);
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 15);

  const logs = await fetchLogs(isoDate(start), isoDate(end));

  const relevant = logs.filter((l) => isSeuJustinoLog(l) && isCardapioLog(l) && isAlteration(l));

  const byUser = new Map<number, { name: string; email: string; role: string; count: number; lastAt: string }>();
  for (const log of relevant) {
    const existing = byUser.get(log.user_id);
    if (!existing) {
      byUser.set(log.user_id, {
        name: log.user_name,
        email: log.user_email,
        role: log.user_role,
        count: 1,
        lastAt: log.created_at,
      });
    } else {
      existing.count += 1;
      if (new Date(log.created_at).getTime() > new Date(existing.lastAt).getTime()) {
        existing.lastAt = log.created_at;
      }
    }
  }

  const rows = Array.from(byUser.entries())
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.count - a.count);

  console.log('Relatório rápido: Alterações no cardápio do Seu Justino (últimos 15 dias)');
  console.log(`Período: ${start.toLocaleString('pt-BR')} até ${end.toLocaleString('pt-BR')}`);
  console.log(`Total de alterações encontradas: ${relevant.length}`);
  console.log('');

  if (rows.length === 0) {
    console.log('Nenhuma alteração encontrada com os critérios atuais.');
    process.exit(0);
  }

  for (const r of rows) {
    console.log(`- ${r.name} <${r.email}> (${r.role}) — ${r.count} alteração(ões) — última: ${new Date(r.lastAt).toLocaleString('pt-BR')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

