/* eslint-disable no-console */
import dotenv from 'dotenv';

// Carregar variáveis: preferir .env (DB) e .env.local (Firebase) quando existirem.
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
// Fallback (client config do Firebase já versionado no repo)
dotenv.config({ path: 'config/production.env.example' });

import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { Client } from 'pg';

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

type TableColumn = { schema: string; table: string; column: string };
type PrimaryKey = { columns: string[] };

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith('--')) continue;
    const [k, rawV] = a.split('=', 2);
    if (rawV === undefined) args.set(k, true);
    else args.set(k, rawV);
  }
  return {
    dryRun: Boolean(args.get('--dry-run')),
    schema: (args.get('--schema') as string | undefined) || 'public',
    limit: args.get('--limit') ? Number(args.get('--limit')) : undefined,
    concurrency: args.get('--concurrency') ? Number(args.get('--concurrency')) : 3,
    onlyTables: args.get('--tables') ? String(args.get('--tables')).split(',').map(s => s.trim()).filter(Boolean) : undefined,
  };
}

function isCloudinaryUrl(s: string) {
  return s.toLowerCase().includes('cloudinary');
}

function looksLikeJson(s: string) {
  const t = s.trim();
  return (t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'));
}

function safeJsonParse(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function replaceCloudinaryDeep(value: unknown, replacer: (url: string) => string): { changed: boolean; value: unknown } {
  if (typeof value === 'string') {
    if (isCloudinaryUrl(value)) return { changed: true, value: replacer(value) };
    return { changed: false, value };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map(v => {
      const r = replaceCloudinaryDeep(v, replacer);
      if (r.changed) changed = true;
      return r.value;
    });
    return { changed, value: out };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = replaceCloudinaryDeep(v, replacer);
      if (r.changed) changed = true;
      out[k] = r.value;
    }
    return { changed, value: out };
  }
  return { changed: false, value };
}

function guessExt(contentType: string | null, fallbackUrl: string) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('image/jpeg')) return 'jpg';
  if (ct.includes('image/png')) return 'png';
  if (ct.includes('image/webp')) return 'webp';
  if (ct.includes('image/gif')) return 'gif';
  if (ct.includes('image/avif')) return 'avif';

  const u = fallbackUrl.split('?')[0] || '';
  const m = u.match(/\.([a-z0-9]+)$/i);
  if (m) return m[1]!.toLowerCase();
  return 'jpg';
}

function sha1(buf: ArrayBuffer) {
  return crypto.createHash('sha1').update(Buffer.from(buf)).digest('hex').slice(0, 12);
}

async function fetchWithRetry(url: string, retries = 3) {
  let lastErr: unknown = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < retries) await delay(500 * Math.pow(2, i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha ao baixar imagem');
}

class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];
  constructor(n: number) {
    this.available = Math.max(1, n);
  }
  async acquire() {
    if (this.available > 0) {
      this.available--;
      return;
    }
    await new Promise<void>(resolve => this.queue.push(resolve));
    this.available--;
  }
  release() {
    this.available++;
    const next = this.queue.shift();
    if (next) next();
  }
}

async function getPrimaryKey(client: Client, schema: string, table: string): Promise<PrimaryKey | null> {
  const q = `
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
    WHERE i.indisprimary
      AND n.nspname = $1
      AND c.relname = $2
    ORDER BY array_position(i.indkey, a.attnum);
  `;
  const r = await client.query(q, [schema, table]);
  const cols = r.rows.map((x: any) => String(x.column_name));
  if (cols.length === 0) return null;
  return { columns: cols };
}

async function discoverCandidateColumns(client: Client, schema: string, onlyTables?: string[]): Promise<TableColumn[]> {
  const nameFilters = [
    '%image%',
    '%imagem%',
    '%foto%',
    '%avatar%',
    '%logo%',
    '%banner%',
    '%cover%',
    '%thumbnail%',
    '%url%',
  ];

  const tableFilterSql = onlyTables?.length ? `AND c.table_name = ANY($3)` : '';

  const q = `
    SELECT c.table_schema AS schema, c.table_name AS table, c.column_name AS column
    FROM information_schema.columns c
    WHERE c.table_schema = $1
      AND c.data_type IN ('character varying', 'text')
      AND (
        ${nameFilters.map((_, i) => `c.column_name ILIKE $${i + 2}`).join(' OR ')}
      )
      ${tableFilterSql}
    ORDER BY c.table_name, c.column_name;
  `;

  const params: any[] = [schema, ...nameFilters];
  if (onlyTables?.length) params.push(onlyTables);
  const r = await client.query(q, params);
  return r.rows.map((row: any) => ({ schema: row.schema, table: row.table, column: row.column }));
}

function quoteIdent(ident: string) {
  return `"${ident.replace(/"/g, '""')}"`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!Number.isFinite(args.concurrency) || args.concurrency < 1) throw new Error('--concurrency inválido');

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error('Informe DATABASE_URL (ou POSTGRES_URL) para conectar no Postgres.');
  }

  // Render Postgres normalmente exige SSL. Se sua DATABASE_URL já tiver sslmode=require, ok.
  // Caso não tenha, usamos SSL "leniente" (rejectUnauthorized: false) para evitar falha por CA.
  const needsSsl =
    /sslmode=require/i.test(databaseUrl) ||
    process.env.PGSSLMODE === 'require' ||
    process.env.RENDER === 'true' ||
    process.env.ONRENDER === 'true';

  const pg = new Client({
    connectionString: databaseUrl,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  await pg.connect();

  // Firebase (client SDK) - somente quando for migrar de verdade (não no dry-run)
  let storage: ReturnType<typeof getStorage> | null = null;
  if (!args.dryRun) {
    const firebaseConfig = {
      apiKey: env('NEXT_PUBLIC_FIREBASE_API_KEY'),
      authDomain: env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: env('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: env('NEXT_PUBLIC_FIREBASE_APP_ID'),
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
    const firebaseApp = initializeApp(firebaseConfig);
    storage = getStorage(firebaseApp);
    const auth = getAuth(firebaseApp);
    await signInAnonymously(auth);
  }

  console.log('🔎 Descobrindo colunas candidatas (auto-discovery)…');
  const candidates = await discoverCandidateColumns(pg, args.schema, args.onlyTables);
  console.log(`✅ Candidatas encontradas: ${candidates.length}`);

  const sem = new Semaphore(args.concurrency);
  let processed = 0;
  let migrated = 0;
  let failures = 0;

  for (const tc of candidates) {
    const pk = await getPrimaryKey(pg, tc.schema, tc.table);
    if (!pk) {
      console.log(`⚠️  Pulando ${tc.table}.${tc.column}: tabela sem PK detectável`);
      continue;
    }

    const pkCols = pk.columns;
    const selectCols = [...pkCols.map(quoteIdent), quoteIdent(tc.column)].join(', ');
    const whereCol = `${quoteIdent(tc.column)} ILIKE '%cloudinary%'`;
    const limitSql = args.limit ? `LIMIT ${Number(args.limit)}` : '';
    const sql = `SELECT ${selectCols} FROM ${quoteIdent(tc.schema)}.${quoteIdent(tc.table)} WHERE ${whereCol} ${limitSql};`;

    const rows = await pg.query(sql);
    if (rows.rowCount === 0) continue;

    console.log(`\n📦 ${tc.table}.${tc.column}: ${rows.rowCount} registros com Cloudinary`);

    const tasks = rows.rows.map((row: any) => (async () => {
      await sem.acquire();
      try {
        processed++;

        const pkValue = pkCols.map(c => String(row[c])).join('_');
        const raw = row[tc.column];
        if (raw == null) return;

        const migrateOneUrl = async (url: string) => {
          if (!storage) throw new Error('Storage não inicializado (modo WRITE esperado)');
          const res = await fetchWithRetry(url, 3);
          const contentType = res.headers.get('content-type');
          const buf = await res.arrayBuffer();
          const hash = sha1(buf);
          const ext = guessExt(contentType, url);
          const objectPath = `migrations/${tc.table}/${tc.column}/${pkValue}/${hash}.${ext}`;
          const storageRef = ref(storage, objectPath);
          await uploadBytes(storageRef, buf, { contentType: contentType || undefined });
          return await getDownloadURL(storageRef);
        };

        let newValue: any = raw;
        let didChange = false;

        if (typeof raw === 'string' && looksLikeJson(raw)) {
          const parsed = safeJsonParse(raw);
          if (parsed != null) {
            const replaced = replaceCloudinaryDeep(parsed, (u) => u); // placeholder
            if (replaced.changed) {
              if (args.dryRun) {
                migrated++;
                console.log(`DRY ✅ ${tc.table}.${tc.column} pk=${pkValue} (JSON contém Cloudinary)`);
                return;
              }
              // migra URLs uma a uma
              const replaced2 = await (async () => {
                const out = replaceCloudinaryDeep(parsed, (u) => u).value; // clone
                const final = await (async function walk(v: any): Promise<any> {
                  if (typeof v === 'string' && isCloudinaryUrl(v)) return await migrateOneUrl(v);
                  if (Array.isArray(v)) return await Promise.all(v.map(walk));
                  if (v && typeof v === 'object') {
                    const entries = await Promise.all(Object.entries(v).map(async ([k, val]) => [k, await walk(val)] as const));
                    return Object.fromEntries(entries);
                  }
                  return v;
                })(out);
                return final;
              })();
              newValue = JSON.stringify(replaced2);
              didChange = true;
            }
          }
        } else if (typeof raw === 'string' && isCloudinaryUrl(raw)) {
          if (args.dryRun) {
            migrated++;
            console.log(`DRY ✅ ${tc.table}.${tc.column} pk=${pkValue} url=${raw}`);
            return;
          }
          newValue = await migrateOneUrl(raw);
          didChange = true;
        }

        if (!didChange) return;

        const setSql = `UPDATE ${quoteIdent(tc.schema)}.${quoteIdent(tc.table)} SET ${quoteIdent(tc.column)} = $1 WHERE ${pkCols.map((c, i) => `${quoteIdent(c)} = $${i + 2}`).join(' AND ')};`;
        const params = [newValue, ...pkCols.map(c => row[c])];
        await pg.query(setSql, params);

        migrated++;
        console.log(`✅ ${tc.table}.${tc.column} pk=${pkValue}`);
      } catch (e) {
        failures++;
        console.error(`❌ Falha em ${tc.table}.${tc.column}:`, e instanceof Error ? e.message : e);
      } finally {
        sem.release();
      }
    })());

    await Promise.all(tasks);
  }

  await pg.end();

  console.log('\n===== RESUMO =====');
  console.log('Processados:', processed);
  console.log('Migrados:', migrated);
  console.log('Falhas:', failures);
  console.log('Modo:', args.dryRun ? 'DRY-RUN' : 'WRITE');
}

main().catch((e) => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});


