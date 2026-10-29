#!/usr/bin/env node
/**
 * Installer for priority/priority-skills.json via skills CLI only.
 *
 * After installs, runs task grouping (bin/group-skills.mjs) so related
 * skills live under .cursor/skills/<task>/... with a router skill per task.
 *
 * agency-agents is NOT installed here — see docs/agency-agents.md
 *
 * Usage:
 *   node bin/install.mjs
 *   node bin/install.mjs --target ./my-app --global
 *   node bin/install.mjs --only vercel-skills,taste-skill
 *   node bin/install.mjs --skip-group
 *   node bin/install.mjs --list
 *   node bin/install.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { groupInstalledSkills } from "./group-skills.mjs";

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
    skipGroup: false,
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
    else if (a === "--skip-group") out.skipGroup = true;
    else if (a === "-h" || a === "--help") {
      console.log(`Install priority Cursor skills (skills CLI)

After install, skills are grouped by task under:
  .cursor/skills/<task-id>/<skill-name>/
with a router skill task-<task-id> so the agent loads the whole bundle.

agency-agents is separate → docs/agency-agents.md

Options:
  --target <dir>     Project to install into (default: cwd)
  --manifest <file>  Priority JSON
  --agent <name>     Agent target (default: cursor)
  --only a,b         Filter by id/keyword/source
  --global           Install with skills -g (+ group global dirs)
  --skip-group       Do not run post-install task grouping
  --list             Print the priority list
  --dry-run          Print commands only (still shows grouping plan)
`);
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return out;
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
    console.log(`    keyword: ${i.keyword}`);
    console.log(`    why:     ${i.why}`);
  }
  console.log(`\nNotion: ${NOTION_URL}`);
  console.log(`agency-agents → docs/agency-agents.md (no va en este instalador)`);
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
  const args = ["skills", "add", item.source, "-a", opts.agent, "-y"];
  if (opts.global) args.push("-g");
  console.log(`==> [${item.priority}] ${item.nombre}  (${item.source})`);
  if (opts.dryRun) {
    console.log(`    dry-run: npx ${args.join(" ")}`);
    ok++;
    continue;
  }
  const r = spawnSync("npx", args, {
    cwd: opts.target,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status === 0) {
    ok++;
    console.log("    ok");
  } else {
    fail++;
    console.warn(`    fallo instalando ${item.source} (exit ${r.status})`);
  }
}

console.log(`\nInstalación skills: ok=${ok} fail=${fail}`);

if (!opts.skipGroup) {
  try {
    groupInstalledSkills({
      target: opts.target,
      global: opts.global,
      dryRun: opts.dryRun,
    });
  } catch (err) {
    console.warn(`Aviso: agrupación por tarea falló: ${err?.message || err}`);
  }
} else {
  console.log("\n(skip) agrupación por tarea (--skip-group)");
}

console.log(`\nNotion Skills DB: ${NOTION_URL}`);
console.log("agency-agents → npm run agency:app  |  npm run agency:cursor");
console.log("re-agrupar luego: npm run group-skills -- --target .");
process.exit(fail ? 1 : 0);
