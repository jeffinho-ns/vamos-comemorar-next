/**
 * Baixa TODOS os ficheiros do Firebase Storage para uma pasta no teu computador (Windows/macOS/Linux).
 *
 * CHAVE JSON (obrigatório para correr em casa):
 *   Firebase Console → ⚙️ Definições do projeto → Contas de serviço →
 *   "Gerar nova chave privada" → guarda o .json (NÃO commits para o Git).
 *
 * Opção A — variável de ambiente (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\TU\Downloads\agilizai-service-account.json"
 *   yarn download-firebase-storage
 *
 * Opção B — ficheiro .env.local na raiz do projeto (junto ao package.json):
 *   GOOGLE_APPLICATION_CREDENTIALS=C:/Users/TU/Downloads/agilizai-service-account.json
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agilizaiapp-img.firebasestorage.app
 *
 * Opção C — passar o caminho na linha de comandos:
 *   yarn download-firebase-storage -- --credentials=C:\Users\TU\Downloads\chave.json
 *
 * Opção D — colar o JSON na raiz do repo (não faz commit; está no .gitignore):
 *   firebase-admin-key.json   OU   secrets/firebase-admin-key.json
 *
 * O bucket correto costuma ser *.firebasestorage.app (NÃO uses ...appspot.com se der 404).
 *
 * Uso:
 *   yarn download-firebase-storage
 *   yarn download-firebase-storage -- --out=C:\Users\TU\Desktop\backup-firebase
 *   yarn download-firebase-storage -- --bucket=agilizaiapp-img.firebasestorage.app
 *   yarn download-firebase-storage -- --prefix=cardapio/items
 *   yarn download-firebase-storage -- --dry-run
 *   yarn download-firebase-storage -- --concurrency=8
 */

/* eslint-disable no-console */
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { createWriteStream, existsSync, readFileSync } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const DEFAULT_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "agilizaiapp-img.firebasestorage.app";

function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const [k, rawV] = a.split("=", 2);
    if (rawV === undefined) args.set(k, true);
    else args.set(k, rawV);
  }
  return {
    out: String(args.get("--out") || "./downloads/firebase-storage"),
    prefix: args.get("--prefix") ? String(args.get("--prefix")) : "",
    bucket: args.get("--bucket") ? String(args.get("--bucket")) : "",
    credentials: args.get("--credentials")
      ? String(args.get("--credentials"))
      : "",
    dryRun: Boolean(args.get("--dry-run")),
    concurrency: Math.max(
      1,
      Math.min(32, Number(args.get("--concurrency")) || 4),
    ),
  };
}

function resolveCredentialPath(credPath: string): string {
  const trimmed = credPath.trim().replace(/^["']|["']$/g, "");
  if (isAbsolute(trimmed)) return trimmed;
  return resolve(process.cwd(), trimmed);
}

/** Ordem: --credentials, env, depois ficheiros padrão na raiz do projeto. */
function pickCredentialJsonPath(credentialsArg: string): string | null {
  const cwd = process.cwd();
  const ordered: string[] = [];

  if (credentialsArg) ordered.push(resolveCredentialPath(credentialsArg));

  const e1 = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const e2 = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (e1) ordered.push(resolveCredentialPath(e1));
  if (e2) ordered.push(resolveCredentialPath(e2));

  ordered.push(
    join(cwd, "firebase-admin-key.json"),
    join(cwd, "secrets", "firebase-admin-key.json"),
  );

  for (const p of ordered) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

function initFirebaseAdmin(bucketName: string, credentialsArg: string) {
  if (getApps().length > 0) return;

  const picked = pickCredentialJsonPath(credentialsArg);

  if (picked) {
    let json: string;
    try {
      json = readFileSync(picked, "utf8");
    } catch (e) {
      console.error(`Erro ao ler credenciais (${picked}):`, e);
      process.exit(1);
    }
    let serviceAccount: Parameters<typeof cert>[0];
    try {
      serviceAccount = JSON.parse(json) as Parameters<typeof cert>[0];
    } catch {
      console.error(`Ficheiro não é JSON válido: ${picked}`);
      process.exit(1);
    }
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName,
    });
    console.log(`Credenciais: ${picked}`);
  } else if (process.env.FIREBASE_DOWNLOAD_USE_ADC === "1") {
    initializeApp({
      credential: applicationDefault(),
      storageBucket: bucketName,
    });
    console.log("Credenciais: ADC (FIREBASE_DOWNLOAD_USE_ADC=1 + gcloud application-default login).");
  } else {
    console.error(`
Não foi encontrado nenhum ficheiro de conta de serviço.

Coloca o JSON na raiz do projeto com o nome:
  firebase-admin-key.json
ou:
  secrets/firebase-admin-key.json

Ou define GOOGLE_APPLICATION_CREDENTIALS no .env.local, ou usa:
  yarn download-firebase-storage -- --credentials=C:\\caminho\\chave.json

Para tentar só ADC (Linux/macOS com gcloud): FIREBASE_DOWNLOAD_USE_ADC=1 yarn download-firebase-storage
`);
    process.exit(1);
  }
}

async function ensureDir(p: string) {
  await mkdir(p, { recursive: true });
}

async function downloadFile(
  bucketName: string,
  objectPath: string,
  destPath: string,
): Promise<void> {
  await ensureDir(dirname(destPath));
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(objectPath);
  const readStream = file.createReadStream();
  const writeStream = createWriteStream(destPath);
  await pipeline(readStream, writeStream);
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const { out, prefix, dryRun, concurrency, bucket, credentials } =
    parseArgs(process.argv);
  const bucketName = (bucket || DEFAULT_BUCKET).replace(/^gs:\/\//, "");
  const outDir = isAbsolute(out) ? out : resolve(process.cwd(), out);

  console.log(`Bucket: ${bucketName}`);
  console.log(`Prefixo (filtro): ${prefix || "(tudo)"}`);
  console.log(`Destino: ${outDir}`);
  console.log(`Concorrência: ${concurrency}`);
  if (dryRun) console.log("Modo: dry-run (sem gravar ficheiros)\n");

  initFirebaseAdmin(bucketName, credentials);
  const storageBucket = getStorage().bucket(bucketName);

  console.log("A listar objetos (pode demorar em buckets grandes)...");
  const [files] = await storageBucket.getFiles({
    prefix: prefix || undefined,
    autoPaginate: true,
  });

  const objects = files.filter((f) => {
    const name = f.name;
    if (!name || name.endsWith("/")) return false;
    return true;
  });

  console.log(`Total de ficheiros a processar: ${objects.length}\n`);

  const stats = { ok: 0, fail: 0, skipped: 0 };

  await runPool(objects, concurrency, async (file) => {
    const name = file.name;
    const destPath = join(outDir, name);

    try {
      if (dryRun) {
        const [meta] = await file.getMetadata();
        const size = meta.size ?? "?";
        console.log(`[dry-run] ${name} (${size} bytes)`);
        stats.ok++;
        return;
      }

      try {
        const st = await stat(destPath);
        if (st.isFile()) {
          const [remoteMeta] = await file.getMetadata();
          const remoteUpdated = remoteMeta.updated
            ? new Date(remoteMeta.updated).getTime()
            : 0;
          if (remoteUpdated && st.mtimeMs >= remoteUpdated - 2000) {
            stats.skipped++;
            return;
          }
        }
      } catch {
        // dest não existe
      }

      await downloadFile(bucketName, name, destPath);
      stats.ok++;
      if (stats.ok % 50 === 0) {
        process.stdout.write(`\rBaixados: ${stats.ok}/${objects.length}`);
      }
    } catch (e) {
      stats.fail++;
      console.error(`\nErro em ${name}:`, e instanceof Error ? e.message : e);
    }
  });

  console.log(
    `\n\nConcluído. OK: ${stats.ok}, falhas: ${stats.fail}, ignorados (já existentes): ${stats.skipped}`,
  );
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("default credentials") || msg.includes("Could not load")) {
    console.error(`
Autenticação em falta. Escolhe uma opção:

  1) Cola o JSON na raiz do projeto com o nome: firebase-admin-key.json
     (ou secrets/firebase-admin-key.json — cria a pasta secrets se precisares)

  2) No .env.local:
     GOOGLE_APPLICATION_CREDENTIALS=C:/Users/TEU_USER/Downloads/chave-firebase.json

  3) Na linha de comandos:
     yarn download-firebase-storage -- --credentials=C:\\Users\\TEU_USER\\Downloads\\chave-firebase.json

  Chave: Firebase Console → Definições do projeto → Contas de serviço → Gerar nova chave privada

  (Linux/macOS: gcloud auth application-default login)
`);
  }
  console.error(e);
  process.exit(1);
});
