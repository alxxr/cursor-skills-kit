#!/usr/bin/env node
/**
 * Post-install: analyze installed skills and group them by matching task.
 *
 * - Moves: .cursor/skills/<skill>/ → .cursor/skills/<task>/<skill>/
 * - Writes a router skill per task so the agent loads the whole bundle
 * - Writes .cursor/skills-kit/task-groups.json index
 *
 * Usage:
 *   node bin/group-skills.mjs --target .
 *   node bin/group-skills.mjs --target . --global
 *   node bin/group-skills.mjs --target . --dry-run
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyTaskGroup,
  FALLBACK_GROUP,
  KIT_GRUPO_ALIASES,
  TASK_GROUPS,
} from "./lib/skill-taxonomy.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const kitRoot = join(__dirname, "..");

function parseArgs(argv) {
  const out = {
    target: process.cwd(),
    global: false,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = resolve(argv[++i]);
    else if (a === "--global") out.global = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "-h" || a === "--help") out.help = true;
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function parseFrontmatter(md) {
  // strip UTF-8 BOM from editors / PowerShell Set-Content
  const text = String(md).replace(/^\uFEFF/, "");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { name: "", description: "", body: text };
  const fm = m[1];
  const strip = (s) => (s || "").trim().replace(/^["']|["']$/g, "");
  const name = strip((fm.match(/^name:\s*(.+)$/m) || [])[1]);
  const description = strip((fm.match(/^description:\s*(.+)$/m) || [])[1]);
  const body = text.slice(m[0].length);
  return { name, description, body };
}

function walkSkillMd(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      // skip our generated router folder naming collision handled later
      walkSkillMd(p, acc);
    } else if (ent.name === "SKILL.md") {
      acc.push(p);
    }
  }
  return acc;
}

function skillRootsFor(target, useGlobal) {
  const roots = [
    join(target, ".cursor", "skills"),
    join(target, ".agents", "skills"),
  ];
  if (useGlobal) {
    roots.push(
      join(homedir(), ".cursor", "skills"),
      join(homedir(), ".agents", "skills"),
    );
  }
  return roots.filter((r) => existsSync(r));
}

function loadKitHints() {
  const map = new Map();
  try {
    const manifest = JSON.parse(
      readFileSync(join(kitRoot, "priority", "priority-skills.json"), "utf8"),
    );
    for (const item of manifest.items || []) {
      const alias = KIT_GRUPO_ALIASES[item.grupo];
      if (!alias) continue;
      map.set(item.keyword, alias);
      map.set(item.id, alias);
      map.set(String(item.source).split("/").pop(), alias);
    }
  } catch {
    // optional
  }
  return map;
}

function isRouterSkill(skillDirName) {
  return skillDirName.startsWith("task-");
}

function discoverSkills(roots) {
  const skills = [];
  for (const root of roots) {
    for (const skillMd of walkSkillMd(root)) {
      const skillDir = dirname(skillMd);
      const folderName = skillDir.split(/[/\\]/).pop();
      if (isRouterSkill(folderName)) continue;
      const relFromRoot = relative(root, skillDir);
      const parts = relFromRoot.split(/[/\\]/).filter(Boolean);
      // already nested: <task>/<skill> or flat: <skill>
      const currentGroup = parts.length >= 2 ? parts[0] : null;
      const raw = readFileSync(skillMd, "utf8");
      const { name, description, body } = parseFrontmatter(raw);
      skills.push({
        root,
        skillMd,
        skillDir,
        folderName,
        currentGroup,
        name: name || folderName,
        description,
        bodySnippet: body.slice(0, 1200),
      });
    }
  }
  return skills;
}

function ensureDir(p, dryRun) {
  if (dryRun || existsSync(p)) return;
  mkdirSync(p, { recursive: true });
}

function moveSkill(skill, groupId, dryRun) {
  const destParent = join(skill.root, groupId);
  const destDir = join(destParent, skill.folderName);
  if (resolve(skill.skillDir) === resolve(destDir)) {
    return { moved: false, destDir };
  }
  if (dryRun) {
    console.log(`    move: ${relative(skill.root, skill.skillDir)} → ${groupId}/${skill.folderName}`);
    return { moved: true, destDir };
  }
  ensureDir(destParent, false);
  if (existsSync(destDir)) {
    // already present — remove empty source if different
    console.warn(`    skip move (exists): ${groupId}/${skill.folderName}`);
    return { moved: false, destDir };
  }
  renameSync(skill.skillDir, destDir);
  // clean empty parent group leftovers
  return { moved: true, destDir };
}

function writeRouterSkill(root, group, members, dryRun) {
  const routerName = `task-${group.id}`;
  const routerDir = join(root, group.id, routerName);
  const routerMd = join(routerDir, "SKILL.md");
  const list = members
    .map((m) => `- **${m.name}** — ${m.description || "(sin descripción)"}`)
    .join("\n");

  const content = `---
name: ${routerName}
description: >-
  Usa este skill cuando la tarea encaje con: ${group.description}.
  Carga el paquete completo de skills del grupo "${group.title}"
  (${members.map((m) => m.name).join(", ")}).
---

# Task group: ${group.title}

Cuando el usuario pida algo relacionado con **${group.title.toLowerCase()}**, no elijas una sola skill suelta: aplica **todas** las skills de este grupo juntas.

## Skills del grupo

${list || "_Sin skills aún._"}

## Cómo usarlo

1. Confirma que la tarea encaja con: ${group.description}.
2. Lee y sigue las instrucciones de **cada** skill listada arriba (en el mismo turno / plan).
3. Si hay conflicto entre skills, prioriza seguridad y claridad; menciona el trade-off.
4. No ignores skills del grupo solo porque una parezca “suficiente”.

## Miembros (ids)

${members.map((m) => `- \`${m.name}\``).join("\n")}
`;

  if (dryRun) {
    console.log(`    router: ${group.id}/${routerName}/SKILL.md (${members.length} skills)`);
    return;
  }
  ensureDir(routerDir, false);
  writeFileSync(routerMd, content, "utf8");
}

/**
 * @param {{ target: string, global?: boolean, dryRun?: boolean }} opts
 */
export function groupInstalledSkills(opts) {
  const target = resolve(opts.target || process.cwd());
  const dryRun = !!opts.dryRun;
  const roots = skillRootsFor(target, !!opts.global);
  const hints = loadKitHints();

  console.log("\n==> Agrupando skills por tarea");
  console.log(`    roots: ${roots.length ? roots.join(" | ") : "(ninguno)"}`);

  if (!roots.length) {
    console.log("    no hay skills instaladas para agrupar");
    return { groups: {}, skills: 0 };
  }

  const skills = discoverSkills(roots);
  console.log(`    skills detectadas: ${skills.length}`);

  /** @type {Map<string, { group: any, members: any[] }>} */
  const byGroup = new Map();

  for (const skill of skills) {
    const preferred =
      hints.get(skill.folderName) ||
      hints.get(skill.name) ||
      (skill.currentGroup &&
      TASK_GROUPS.some((g) => g.id === skill.currentGroup)
        ? skill.currentGroup
        : null);
    const group = classifyTaskGroup(
      `${skill.name}\n${skill.description}\n${skill.bodySnippet}`,
      { preferredGroupId: preferred },
    );

    const { destDir } = moveSkill(skill, group.id, dryRun);
    const member = {
      name: skill.name,
      description: skill.description,
      folderName: skill.folderName,
      path: dryRun ? join(skill.root, group.id, skill.folderName) : destDir,
      root: skill.root,
    };

    if (!byGroup.has(group.id)) {
      byGroup.set(group.id, { group, members: [] });
    }
    byGroup.get(group.id).members.push(member);
  }

  // write routers per root that has members
  const index = {
    generatedAt: new Date().toISOString(),
    target,
    groups: {},
  };

  for (const [id, { group, members }] of byGroup) {
    index.groups[id] = {
      title: group.title,
      description: group.description,
      skills: members.map((m) => ({
        name: m.name,
        description: m.description,
        path: relative(target, m.path).split(sep).join("/"),
      })),
    };
    // one router per skills root involved
    const rootsInGroup = [...new Set(members.map((m) => m.root))];
    for (const root of rootsInGroup) {
      const subset = members.filter((m) => m.root === root);
      writeRouterSkill(root, group, subset, dryRun);
    }
    console.log(
      `    ✓ ${group.id}: ${members.map((m) => m.name).join(", ")}`,
    );
  }

  const indexDir = join(target, ".cursor", "skills-kit");
  const indexPath = join(indexDir, "task-groups.json");
  if (dryRun) {
    console.log(`    index: ${indexPath}`);
  } else {
    ensureDir(indexDir, false);
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");
    console.log(`    index → ${indexPath}`);
  }

  // prune empty leftover dirs under skills roots (best-effort)
  if (!dryRun) {
    for (const root of roots) {
      pruneEmptyDirs(root);
    }
  }

  return { groups: index.groups, skills: skills.length };
}

function pruneEmptyDirs(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return;
  for (const ent of readdirSync(dir)) {
    pruneEmptyDirs(join(dir, ent));
  }
  const left = readdirSync(dir);
  if (left.length === 0 && !dir.endsWith(`${sep}skills`) && !dir.endsWith("/skills")) {
    try {
      rmSync(dir, { recursive: false });
    } catch {
      // ignore
    }
  }
}

// CLI
const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(`Group installed skills by task

  node bin/group-skills.mjs --target .
  node bin/group-skills.mjs --target . --global
  node bin/group-skills.mjs --dry-run

Known task groups:
${[...TASK_GROUPS, FALLBACK_GROUP].map((g) => `  - ${g.id}: ${g.title}`).join("\n")}
`);
    process.exit(0);
  }
  groupInstalledSkills(opts);
}
