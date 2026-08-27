# Flujo CodeGraph

Usar CodeGraph antes de buscar a mano cuando exista `.codegraph/` en la raiz.

## Uso

1. Preguntar por simbolos, archivos o flujo:
   ```bash
   codegraph explore "como fluye la correccion de entregas hasta publicar notas"
   ```
2. Leer el codigo que CodeGraph devuelve y revisar callers/dependientes antes de editar.
3. Si CodeGraph no cubre config, docs o archivos no indexados, usar `rg`/`find`.

## Regla Del Repo

Para bugs, ubicar el punto compartido del flujo y corregir ahi. Evitar parches
solo en el caller que mostro el sintoma.
