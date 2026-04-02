/**
 * Garante um único `next dev`: no Windows, encerra listeners nas portas comuns
 * antes de subir (evita EPERM em .next\trace quando há outro Node usando a mesma pasta).
 */
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killListenersOnPortsWin32(ports) {
  for (const port of ports) {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        windowsHide: true,
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore", windowsHide: true });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* findstr sem match = exit 1 */
    }
  }
}

async function main() {
  if (process.platform === "win32") {
    killListenersOnPortsWin32([3000, 3001, 3002, 3003, 3004, 3005]);
    await sleep(600);
    const tracePath = path.join(root, ".next", "trace");
    try {
      if (fs.existsSync(tracePath)) {
        fs.unlinkSync(tracePath);
      }
    } catch {
      /* outro processo pode ainda segurar; o taskkill acima costuma resolver */
    }
  }

  if (!fs.existsSync(nextBin)) {
    console.error("Next não encontrado. Rode: yarn install");
    process.exit(1);
  }

  const child = spawn(process.execPath, [nextBin, "dev", "-H", "0.0.0.0"], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
