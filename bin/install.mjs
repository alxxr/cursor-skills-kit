#!/usr/bin/env node
/**
 * Cross-platform installer for priority/priority-skills.json
 * Usage:
 *   node bin/install.mjs
 *   node bin/install.mjs --target ./my-app --global
 *   node bin/install.mjs --only vercel-skills,diagram-design
 *   node bin/install.mjs --list
 *   node bin/install.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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
    else if (a === "--only") out.only = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--global") out.global = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--list") out.list = true;
    else if (a === "-h" || a === "--help") {
      console.log(`Install priority Cursor skills

Options:
  --target <dir>     Project to install into (default: cwd)
  --manifest <file>  Priority JSON (default: priority/priority-skills.json)
  --agent <name>     Agent target (default: cursor)
  --only a,b         Filter by id/keyword/source
  --global           Install with skills -g
  --list             Print the priority list
  --dry-run          Print npx commands only
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
  console.log(`\nNotion: https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2`);
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

console.log(`\nListo. ok=${ok} fail=${fail}`);
console.log("Notion Skills DB: https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2");
process.exit(fail ? 1 : 0);
