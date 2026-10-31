#!/usr/bin/env bash
# Compila la vista previa de cada subdirectorio (preview.pdf y preview-N.png).
# Uso: ./build.sh [subdirectorio...]   (sin argumentos compila todos)
set -euo pipefail
cd "$(dirname "$0")"
dirs=("$@")
[ ${#dirs[@]} -gt 0 ] || dirs=([0-9][0-9]-*/)
for d in "${dirs[@]}"; do
  d=${d%/}
  (
    cd "$d"
    printf '%s\n' '\input{../preamble.tex}' '\begin{document}' '\input{frames.tex}' '\end{document}' > preview.tex
    latexmk -pdf -interaction=nonstopmode -halt-on-error -quiet preview.tex >/dev/null
    latexmk -c -quiet preview.tex >/dev/null; rm -f preview.nav preview.snm
    rm -f preview-*.png
    pdftoppm -png -r 110 preview.pdf preview
  )
  echo "ok: $d"
done
