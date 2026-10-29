# Notion — fuentes vivas

Estas dos páginas son la fuente de verdad del inventario. El repo guarda un snapshot (`catalog/skills.csv`) y la lista de instalación prioritaria (`priority/priority-skills.json`).

## Páginas

| Página | Para qué sirve | URL |
| --- | --- | --- |
| **Skills DB** | Base de datos con columnas Nombre, URL, Resumen, Keyword, Estado (`por instalar` / `instalada`), Grupo | https://www.notion.so/4087a3959dfc80619059c99a27a1303a |
| **Inventario Skills Brave** | Notas / agrupación original del barrido de pestañas | https://www.notion.so/4087a3959dfc80b79a55f40fafff9ee2 |

## Cómo mantener el acoplamiento

1. Actualiza filas o `Estado` en **Skills DB**.
2. Cuando cambies prioridades, edita `priority/priority-skills.json` en este repo (o vuelve a exportar CSV a `catalog/skills.csv`).
3. En cualquier proyecto: `./bin/install.sh` o `.\bin\install.ps1` instala la lista prioritaria con el CLI `skills` hacia Cursor.

## IDs Notion (referencia)

- Skills DB page: `4087a3959dfc80619059c99a27a1303a`
- Inventario Skills Brave page: `4087a3959dfc80b79a55f40fafff9ee2`
