#!/usr/bin/env bash
# Instala la lista "Prioridad para instalar skills" en un proyecto Cursor.
# Uso:
#   ./bin/install.sh
#   ./bin/install.sh --target /path/to/project --global
#   ./bin/install.sh --only vercel-skills,diagram-design
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$(pwd)"
MANIFEST="$ROOT/priority/priority-skills.json"
AGENT="cursor"
GLOBAL=0
DRY_RUN=0
ONLY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --manifest) MANIFEST="$2"; shift 2 ;;
    --agent) AGENT="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    --global) GLOBAL=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,7p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

command -v node >/dev/null || { echo "Node.js requerido (>= 22.20 recomendado)" >&2; exit 1; }
command -v npx >/dev/null || { echo "npx requerido" >&2; exit 1; }
[[ -f "$MANIFEST" ]] || { echo "No encuentro $MANIFEST" >&2; exit 1; }

mapfile -t SOURCES < <(node -e '
const fs=require("fs");
const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
const only=(process.argv[2]||"").split(",").map(s=>s.trim()).filter(Boolean);
let items=[...m.items].sort((a,b)=>a.priority-b.priority);
if(only.length){
  items=items.filter(i=>only.includes(i.id)||only.includes(i.keyword)||only.includes(i.source));
}
for(const i of items){
  console.log([i.priority,i.nombre,i.source].join("\t"));
}
' "$MANIFEST" "$ONLY")

if [[ ${#SOURCES[@]} -eq 0 ]]; then
  echo "No hay items para instalar" >&2
  exit 1
fi

echo "Target:  $TARGET"
echo "Agent:   $AGENT"
echo "Global:  $GLOBAL"
echo "Items:   ${#SOURCES[@]}"
echo

ok=0
fail=0
cd "$TARGET"
for row in "${SOURCES[@]}"; do
  IFS=$'\t' read -r priority nombre source <<<"$row"
  echo "==> [$priority] $nombre  ($source)"
  args=(skills add "$source" -a "$AGENT" -y)
  if [[ "$GLOBAL" -eq 1 ]]; then args+=(-g); fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "    dry-run: npx ${args[*]}"
    ok=$((ok+1))
    continue
  fi
  if npx "${args[@]}"; then
    ok=$((ok+1))
    echo "    ok"
  else
    fail=$((fail+1))
    echo "    fallo instalando $source" >&2
  fi
done

echo
echo "Listo. ok=$ok fail=$fail"
echo "Notion Skills DB: https://flicker-boat-98b.notion.site/4087a3959dfc80619059c99a27a1303a?v=4087a3959dfc80759e36000cade27ff2"
[[ "$fail" -eq 0 ]]
