# cursor-skills-kit

Kit para **guardar, priorizar e instalar agent skills** en cualquier proyecto Cursor.

La idea: el inventario vive en Notion; este repo lo hace portable (CSV + lista prioritaria + instalador) para que puedas acoplar las mismas skills en un proyecto nuevo en minutos.

## Notion (fuentes vivas)

| Página | Rol |
| --- | --- |
| [Skills DB](https://www.notion.so/4087a3959dfc80619059c99a27a1303a) | Base de datos: Nombre, URL, Resumen, Keyword, Estado (`por instalar` / `instalada`), Grupo |
| [Inventario Skills Brave](https://www.notion.so/4087a3959dfc80b79a55f40fafff9ee2) | Inventario / notas del barrido original de pestañas |

Detalle de acoplamiento: [`notion/LINKS.md`](./notion/LINKS.md)

## Qué hay en el repo

```
catalog/skills.csv                 # snapshot del inventario (~80 items)
priority/priority-skills.json      # "Prioridad para instalar skills"
bin/install.mjs                    # instalador cross-platform (recomendado)
bin/install.ps1 / bin/install.sh   # wrappers PowerShell / bash
Dockerfile                         # instalar en un proyecto montado vía Docker
```

## Requisitos

- Node.js **≥ 22.20** (para `npx skills`)
- Git
- Cursor como agente destino (`-a cursor`)

## Uso rápido

Desde **cualquier proyecto** donde quieras las skills:

```bash
# clonar el kit una vez
git clone https://github.com/alxxr/cursor-skills-kit.git
cd cursor-skills-kit

# ver la lista prioritaria
npm run list

# dry-run
npm run dry-run

# instalar en el proyecto actual
node bin/install.mjs --target /ruta/a/tu-proyecto

# o instalar globalmente en tu usuario Cursor
node bin/install.mjs --global
```

En Windows (PowerShell):

```powershell
.\bin\install.ps1 -Target "C:\path\to\project"
.\bin\install.ps1 -Only vercel-skills,diagram-design
```

El instalador ejecuta, por cada item prioritario:

```bash
npx skills add <owner/repo> -a cursor -y
```

## Docker

```bash
docker build -t cursor-skills-kit .

# monta el proyecto destino en /workspace
docker run --rm -v /ruta/a/tu-proyecto:/workspace -w /workspace cursor-skills-kit
docker run --rm -v /ruta/a/tu-proyecto:/workspace -w /workspace cursor-skills-kit --dry-run
```

## Prioridad para instalar skills

Lista curada (instalable vía GitHub) en [`priority/priority-skills.json`](./priority/priority-skills.json):

1. `vercel-labs/skills` — toolkit / CLI de skills  
2. `addyosmani/agent-skills` — skills de producción  
3. `cathrynlavery/diagram-design`  
4. `nextlevelbuilder/ui-ux-pro-max-skill`  
5. `cloudflare/security-audit-skill`  
6. `vercel-labs/agent-browser`  
7. `Leonlxnx/taste-skill`  
8. `pbakaus/impeccable`  
9. `coreyhaines31/marketingskills`  
10. `mukul975/Anthropic-Cybersecurity-Skills`  
11. `msitarzewski/agency-agents`  
12. `google/skills`

El catálogo completo (incluyendo inspiración UI, builders, CLI, etc.) está en [`catalog/skills.csv`](./catalog/skills.csv). No todo el CSV es “skill instalable”; la prioridad se limita a repos que el CLI `skills` puede aplicar a Cursor.

## Flujo recomendado

1. Descubres / marcas items en **Skills DB** (Notion).  
2. Si algo pasa a prioridad, lo agregas a `priority/priority-skills.json`.  
3. En un proyecto nuevo corres `node bin/install.mjs --target .`.  
4. Cuando una skill queda usable en tu flujo, marcas **Estado = instalada** en Notion.

## Licencia

MIT. Los repos de terceros conservan sus propias licencias.
