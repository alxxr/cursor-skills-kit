#!/usr/bin/env node
/**
 * Cross-platform installer for priority/priority-skills.json
 *
 * Methods:
 *   skills-cli     → npx skills add <source> -a cursor -y
 *   agency-agents  → clone repo + ./scripts/install.sh --tool cursor --path <target>/.cursor/rules
 *
 * Usage:
 *   node bin/install.mjs
 *   node bin/install.mjs --target ./my-app --global
 *   node bin/install.mjs --only vercel-skills,taste-skill,agency-agents
 *   node bin/install.mjs --list
 *   node bin/install.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const NOTION_URL =
  "https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2";

function parseArgs(argv) {
  const out = {
    target: process.cwd(),
    manifest: join(root, "priority", "priority-skills.json"),
    agent: "cursor",
    only: [],
    global: false,
    dryRun: false,
    list: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = resolve(argv[++i]);
    else if (a === "--manifest") out.manifest = resolve(argv[++i]);
    else if (a === "--agent") out.agent = argv[++i];
    else if (a === "--only")
      out.only = argv[++i]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--global") out.global = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--list") out.list = true;
    else if (a === "-h" || a === "--help") {
      console.log(`Install priority Cursor skills / agents

Options:
  --target <dir>     Project to install into (default: cwd)
  --manifest <file>  Priority JSON (default: priority/priority-skills.json)
  --agent <name>     Agent target for skills-cli (default: cursor)
  --only a,b         Filter by id/keyword/source
  --global           skills-cli: install with -g
  --list             Print the priority list
  --dry-run          Print commands only
`);
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  return r.status ?? 1;
}

function findBash() {
  if (process.platform !== "win32") return "bash";
  const candidates = [
    "bash",
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  ];
  for (const c of candidates) {
    const r = spawnSync(c, ["-lc", "echo ok"], {
      encoding: "utf8",
      shell: false,
    });
    if (r.status === 0) return c;
  }
  return null;
}

function installSkillsCli(item, opts) {
  const args = ["skills", "add", item.source, "-a", opts.agent, "-y"];
  if (opts.global) args.push("-g");
  if (opts.dryRun) {
    console.log(`    dry-run: npx ${args.join(" ")}`);
    return 0;
  }
  return run("npx", args, { cwd: opts.target });
}

function ensureAgencyClone(repoUrl, repoDir, dryRun) {
  if (dryRun) {
    console.log(`    dry-run: git clone/pull ${repoUrl} → ${repoDir}`);
    return 0;
  }
  mkdirSync(dirname(repoDir), { recursive: true });
  if (!existsSync(join(repoDir, ".git"))) {
    mkdirSync(dirname(repoDir), { recursive: true });
    const status = run("git", ["clone", "--depth", "1", repoUrl, repoDir]);
    if (status !== 0) return status;
  } else {
    const status = run("git", ["-C", repoDir, "pull", "--ff-only"]);
    if (status !== 0) {
      console.warn("    aviso: git pull falló; se usa el clone en cache");
    }
  }
  return 0;
}

function installAgencyAgents(item, opts) {
  const repoUrl =
    item.install?.repoUrl || `https://github.com/${item.source}.git`;
  const tool = item.install?.tool || "cursor";
  const cacheDir = join(homedir(), ".cache", "cursor-skills-kit", "agency-agents");
  const rulesDir = join(opts.target, ".cursor", "rules");
  const bash = findBash();

  if (!bash && !opts.dryRun) {
    console.error(
      "    agency-agents necesita bash (Git Bash en Windows). Instala Git for Windows o WSL.",
    );
    return 1;
  }

  if (opts.dryRun) {
    console.log(`    dry-run: clone ${repoUrl} → ${cacheDir}`);
    console.log(
      `    dry-run: ${bash || "bash"} scripts/install.sh --tool ${tool} --no-interactive --path ${rulesDir}`,
    );
    return 0;
  }

  const cloneStatus = ensureAgencyClone(repoUrl, cacheDir, false);
  if (cloneStatus !== 0) return cloneStatus;

  mkdirSync(rulesDir, { recursive: true });

  // install.sh auto-runs convert.sh when integrations/cursor is missing
  const script = join(cacheDir, "scripts", "install.sh").replace(/\\/g, "/");
  const pathArg = rulesDir.replace(/\\/g, "/");
  const status = run(bash, [
    script,
    "--tool",
    tool,
    "--no-interactive",
    "--path",
    pathArg,
  ], { cwd: cacheDir, shell: false });

  return status;
}

function installItem(item, opts) {
  const method = item.method || "skills-cli";
  console.log(
    `==> [${item.priority}] ${item.nombre}  (${item.source})  [${method}]`,
  );
  if (method === "agency-agents") return installAgencyAgents(item, opts);
  if (method === "skills-cli") return installSkillsCli(item, opts);
  console.error(`    método desconocido: ${method}`);
  return 1;
}

const opts = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(readFileSync(opts.manifest, "utf8"));
let items = [...manifest.items].sort((a, b) => a.priority - b.priority);
if (opts.only.length) {
  items = items.filter(
    (i) =>
      opts.only.includes(i.id) ||
      opts.only.includes(i.keyword) ||
      opts.only.includes(i.source),
  );
}

if (opts.list) {
  console.log(`${manifest.name}\n`);
  for (const i of items) {
    console.log(`${String(i.priority).padStart(2)}. ${i.nombre}`);
    console.log(`    source:  ${i.source}`);
    console.log(`    method:  ${i.method || "skills-cli"}`);
    console.log(`    keyword: ${i.keyword}`);
    console.log(`    why:     ${i.why}`);
  }
  console.log(`\nNotion: ${NOTION_URL}`);
  process.exit(0);
}

if (!items.length) {
  console.error("No hay items para instalar");
  process.exit(1);
}

console.log(`Target:  ${opts.target}`);
console.log(`Agent:   ${opts.agent}`);
console.log(`Global:  ${opts.global}`);
console.log(`Items:   ${items.length}\n`);

let ok = 0;
let fail = 0;
for (const item of items) {
  const status = installItem(item, opts);
  if (status === 0) {
    ok++;
    console.log("    ok");
  } else {
    fail++;
    console.warn(`    fallo instalando ${item.source} (exit ${status})`);
  }
}

console.log(`\nListo. ok=${ok} fail=${fail}`);
console.log(`Notion Skills DB: ${NOTION_URL}`);
process.exit(fail ? 1 : 0);
