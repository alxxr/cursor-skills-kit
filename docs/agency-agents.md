# Agency Agents (aparte del instalador de skills)

[`msitarzewski/agency-agents`](https://github.com/msitarzewski/agency-agents) **no es un skill CLI**: es un roster de agentes/personas. No tiene `SKILL.md` para `npx skills add`.

Por eso **no** entra en `priority/priority-skills.json` ni en `npm run install:priority`.

Hay **dos opciones**:

---

## Opción 1 — App nativa (recomendada)

Instala y actualiza el roster en Claude Code, Cursor, Codex, Gemini, etc. con UI.

- Sitio / descarga: **[https://agencyagents.app](https://agencyagents.app)**
- Desde este kit (abre el sitio):

```bash
npm run agency:app
```

- macOS (Homebrew):

```bash
brew install --cask msitarzewski/agency-agents/agency-agents
```

Útil también si quieres gestionar agentes como producto / MCP desde la app, sin clonar el repo a mano.

---

## Opción 2 — Instalador en Cursor (scripts del repo)

Copia reglas convertidas (`.mdc`) a **`.cursor/rules/`** del proyecto destino.

Requisitos: Git + **bash** (en Windows: Git Bash).

```bash
# instalar todos los agentes convertidos para Cursor en el proyecto actual
npm run agency:cursor -- --target .

# solo algunas divisiones
npm run agency:cursor -- --target . --division engineering,design

# agentes concretos
npm run agency:cursor -- --target . --agent frontend-developer,ui-designer

# ver comandos sin ejecutar
npm run agency:cursor -- --dry-run
```

Equivale a:

```bash
git clone https://github.com/msitarzewski/agency-agents.git
cd agency-agents
./scripts/install.sh --tool cursor --no-interactive --path /ruta/al/proyecto/.cursor/rules
```

(`install.sh` puede auto-ejecutar `convert.sh` si faltan archivos en `integrations/cursor`.)

---

## Resumen

| Opción | Qué hace | Comando / link |
| --- | --- | --- |
| 1 App | GUI + updates multi-herramienta | [agencyagents.app](https://agencyagents.app) / `npm run agency:app` |
| 2 Cursor script | Reglas en `.cursor/rules/` | `npm run agency:cursor -- --target .` |

El inventario Notion sigue listando agency-agents como recurso de **Agencia**; solo el camino de instalación es distinto al de skills.
