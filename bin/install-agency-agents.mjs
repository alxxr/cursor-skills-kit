#!/usr/bin/env node
/**
 * Opción 2: instalar agency-agents en Cursor vía scripts oficiales del repo.
 * (No es un skill CLI / SKILL.md — copia reglas .mdc a .cursor/rules/)
 *
 * Usage:
 *   node bin/install-agency-agents.mjs
 *   node bin/install-agency-agents.mjs --target ./my-app
 *   node bin/install-agency-agents.mjs --dry-run
 *   node bin/install-agency-agents.mjs --division engineering,design
 *   node bin/install-agency-agents.mjs --agent frontend-developer,ui-designer
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const REPO_URL = "https://github.com/msitarzewski/agency-agents.git";
const APP_URL = "https://agencyagents.app";

function parseArgs(argv) {
  const out = {
    target: process.cwd(),
    dryRun: false,
    division: "",
    agent: "",
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = resolve(argv[++i]);
    else if (a === "--division") out.division = argv[++i];
    else if (a === "--agent") out.agent = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "-h" || a === "--help") out.help = true;
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  return r.status ?? 1;
}

function findBash() {
  if (process.platform !== "win32") return "bash";
  for (const c of [
    "bash",
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  ]) {
    const r = spawnSync(c, ["-lc", "echo ok"], {
      encoding: "utf8",
      shell: false,
    });
    if (r.status === 0) return c;
  }
  return null;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log(`Install agency-agents into Cursor (.cursor/rules)

  node bin/install-agency-agents.mjs --target .
  node bin/install-agency-agents.mjs --division engineering,design
  node bin/install-agency-agents.mjs --agent frontend-developer,ui-designer

Opción GUI (recomendada): npm run agency:app
  → ${APP_URL}
`);
  process.exit(0);
}

const cacheDir = join(homedir(), ".cache", "cursor-skills-kit", "agency-agents");
const rulesDir = join(opts.target, ".cursor", "rules");
const bash = findBash();

console.log("Agency Agents — opción 2: instalador Cursor (scripts del repo)");
console.log(`Target rules: ${rulesDir}`);
console.log(`Cache clone:  ${cacheDir}`);
console.log("");
console.log("Esto NO usa npx skills. Copia agentes convertidos a .cursor/rules/");
console.log(`App GUI: ${APP_URL}`);
console.log("");

if (!bash && !opts.dryRun) {
  console.error("Se necesita bash (Git Bash en Windows) para scripts/install.sh");
  process.exit(1);
}

const installArgs = [
  "--tool",
  "cursor",
  "--no-interactive",
  "--path",
  rulesDir.replace(/\\/g, "/"),
];
if (opts.division) installArgs.push("--division", opts.division);
if (opts.agent) installArgs.push("--agent", opts.agent);

if (opts.dryRun) {
  console.log(`dry-run: git clone/pull ${REPO_URL} → ${cacheDir}`);
  console.log(
    `dry-run: ${bash || "bash"} scripts/install.sh ${installArgs.join(" ")}`,
  );
  process.exit(0);
}

mkdirSync(dirname(cacheDir), { recursive: true });
if (!existsSync(join(cacheDir, ".git"))) {
  const st = run("git", ["clone", "--depth", "1", REPO_URL, cacheDir], {
    shell: process.platform === "win32",
  });
  if (st !== 0) process.exit(st);
} else {
  run("git", ["-C", cacheDir, "pull", "--ff-only"], {
    shell: process.platform === "win32",
  });
}

mkdirSync(rulesDir, { recursive: true });
const script = join(cacheDir, "scripts", "install.sh").replace(/\\/g, "/");
const status = run(bash, [script, ...installArgs], {
  cwd: cacheDir,
  shell: false,
});

if (status === 0) {
  console.log("\nok — agentes en", rulesDir);
  console.log("Docs: https://github.com/msitarzewski/agency-agents");
} else {
  console.error("\nfalló install.sh. Revisa bash/Git y el repo.");
}
process.exit(status);
