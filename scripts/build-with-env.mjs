import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function parseEnvFile(content) {
  const out = {};
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }
  return out;
}

function loadEnvFiles(files) {
  const merged = {};
  for (const file of files) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, "utf8");
    Object.assign(merged, parseEnvFile(content));
  }
  return merged;
}

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sanitizeEnvVars(vars) {
  const out = {};
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined || value === null) continue;
    out[key] = String(value);
  }
  return out;
}

const modeArg = (process.argv[2] || "prod").toLowerCase();
const taskArg = (process.argv[3] || "build").toLowerCase();
const mode = modeArg === "dev" ? "development" : "production";

const envFiles =
  mode === "development"
    ? [".env", ".env.development.local"]
    : [".env", ".env.production.local"];

const fileEnv = loadEnvFiles(envFiles);
const env = sanitizeEnvVars({
  ...fileEnv,
  ...process.env,
  APP_ENV: mode,
});

const binExt = process.platform === "win32" ? ".cmd" : "";
const prismaBin = resolve(process.cwd(), "node_modules", ".bin", `prisma${binExt}`);
const nextBin = resolve(process.cwd(), "node_modules", ".bin", `next${binExt}`);

console.log(`[build] mode=${mode}`);
console.log(`[build] env files=${envFiles.join(", ")}`);

if (taskArg === "build") {
  run(prismaBin, ["generate"], env);
  run(nextBin, ["build"], env);
} else if (taskArg === "start") {
  run(nextBin, ["start"], env);
} else {
  console.error(`Unknown task "${taskArg}". Use "build" or "start".`);
  process.exit(1);
}
