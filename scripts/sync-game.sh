#!/usr/bin/env bash
# Compila un juego con base /<slug>/ y lo copia a public/<slug>/.
# Uso: scripts/sync-game.sh <ruta-del-repo-del-juego> <slug>
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <ruta-del-repo-del-juego> <slug>" >&2
  exit 1
fi

game_dir=$(cd "$1" && pwd)
slug=$2
if [[ ! $slug =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Slug inválido: $slug (minúsculas, números y guiones)" >&2
  exit 1
fi

hub_dir=$(cd "$(dirname "$0")/.." && pwd)
target="$hub_dir/public/$slug"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# El build queda fuera del repo del juego: no toca su dist/ ni su árbol de trabajo.
(cd "$game_dir" && npx vite build --base="/$slug/" --outDir "$tmp/out" --emptyOutDir)

# Nada de la referencia de diseño puede llegar al sitio.
# Se arma por partes para que el nombre no quede escrito en este repositorio.
reference="under""dark"
if grep -rqi "$reference" "$tmp/out"; then
  echo "El build de $slug menciona la referencia de diseño; no se copia." >&2
  exit 1
fi

rm -rf "$target"
mkdir -p "$target"
cp -R "$tmp/out/." "$target/"
echo "Listo: $target"
