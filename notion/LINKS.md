# Notion — fuentes vivas

Estas dos páginas son la fuente de verdad del inventario (publicadas en la web). El repo guarda un snapshot (`catalog/skills.csv`) y la lista de instalación prioritaria (`priority/priority-skills.json`).

## Páginas (URLs públicas)

| Página | Para qué sirve | URL |
| --- | --- | --- |
| **Skills DB** | Base de datos con columnas Nombre, URL, Resumen, Keyword, Estado (`por instalar` / `instalada`), Grupo | https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2 |
| **Inventario Skills Brave** | Notas / agrupación original del barrido de pestañas | https://flicker-boat-98b.notion.site/Inventario-Skills-Brave-4087a3959dfc80b79a55f40fafff9ee2 |

## Cómo mantener el acoplamiento

1. Actualiza filas o `Estado` en **Skills DB**.
2. Cuando cambies prioridades, edita `priority/priority-skills.json` en este repo (o vuelve a exportar CSV a `catalog/skills.csv`).
3. En cualquier proyecto: `./bin/install.sh` o `.\bin\install.ps1` instala la lista prioritaria con el CLI `skills` hacia Cursor.

## IDs Notion (referencia)

- Skills DB page: `4087a3959dfc80619059c99a27a1303a`
- Inventario Skills Brave page: `4087a3959dfc80b79a55f40fafff9ee2`
