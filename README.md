# cursor-skills-kit

Kit para **guardar, priorizar e instalar agent skills** en cualquier proyecto Cursor.

La idea: el inventario vive en Notion; este repo lo hace portable (CSV + lista prioritaria + instalador) para que puedas acoplar las mismas skills en un proyecto nuevo en minutos.

## Notion (fuentes vivas)

| Página | Rol |
| --- | --- |
| [Skills DB / Skills AI](https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2) | Base de datos: Nombre, URL, Resumen, Keyword, Estado (`por instalar` / `instalada`), Grupo |
| [Inventario Skills Brave](https://flicker-boat-98b.notion.site/Inventario-Skills-Brave-4087a3959dfc80b79a55f40fafff9ee2) | Inventario / notas del barrido original de pestañas |

Detalle de acoplamiento: [`notion/LINKS.md`](./notion/LINKS.md)

## Qué hay en el repo

```
catalog/skills.csv                 # snapshot del inventario (~80 items)
priority/priority-skills.json      # "Prioridad para instalar skills"
bin/install.mjs                    # instalador de skills (npx skills)
bin/open-agency-app.mjs            # Agency Agents → opción app
bin/install-agency-agents.mjs      # Agency Agents → opción Cursor
docs/agency-agents.md              # guía aparte (no es skill CLI)
Dockerfile
```

## Requisitos

- Node.js **≥ 22.20** (para `npx skills`)
- Git
- Cursor como agente destino (`-a cursor`)

## Uso rápido (skills)

```bash
git clone https://github.com/alxxr/cursor-skills-kit.git
cd cursor-skills-kit

npm run list
npm run dry-run
node bin/install.mjs --target /ruta/a/tu-proyecto
node bin/install.mjs --global
```

Windows (PowerShell):

```powershell
.\bin\install.ps1 -Target "C:\path\to\project"
.\bin\install.ps1 -Only vercel-skills,diagram-design
```

Cada item prioritario corre:

```bash
npx skills add <owner/repo> -a cursor -y
```

## Prioridad para instalar skills

Lista en [`priority/priority-skills.json`](./priority/priority-skills.json):

1. `vercel-labs/skills`
2. `addyosmani/agent-skills`
3. `cathrynlavery/diagram-design`
4. `nextlevelbuilder/ui-ux-pro-max-skill`
5. `cloudflare/security-audit-skill`
6. `vercel-labs/agent-browser`
7. `Leonxlnx/taste-skill`
8. `pbakaus/impeccable`
9. `coreyhaines31/marketingskills`
10. `mukul975/Anthropic-Cybersecurity-Skills`
11. `google/skills`

Catálogo completo: [`catalog/skills.csv`](./catalog/skills.csv).

---

## Agency Agents (instalación aparte)

**No** va en el instalador de skills: no tiene `SKILL.md`; es un roster de agentes/personas. Guía completa: [`docs/agency-agents.md`](./docs/agency-agents.md).

### Opción 1 — App (recomendada)

Abre el sitio / app nativa (Cursor, Claude Code, Codex, Gemini, etc.):

**→ [https://agencyagents.app](https://agencyagents.app)**

```bash
npm run agency:app
```

macOS: `brew install --cask msitarzewski/agency-agents/agency-agents`

### Opción 2 — Instalador Cursor (scripts del repo)

Copia reglas `.mdc` a `.cursor/rules/` del proyecto (requiere bash / Git Bash):

```bash
npm run agency:cursor -- --target .
npm run agency:cursor -- --target . --division engineering,design
npm run agency:cursor -- --dry-run
```

Repo upstream: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)

---

## Docker (solo skills prioritarias)

```bash
docker build -t cursor-skills-kit .
docker run --rm -v /ruta/a/tu-proyecto:/workspace -w /workspace cursor-skills-kit
```

## Flujo recomendado

1. Marca items en **Skills DB** (Notion).
2. Skills → `priority/priority-skills.json` + `node bin/install.mjs`.
3. Agency Agents → app o `npm run agency:cursor`.
4. Cuando quede usable, marca **Estado = instalada** en Notion.

## Licencia

MIT. Los repos de terceros conservan sus propias licencias.
