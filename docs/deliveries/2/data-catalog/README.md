# Catálogo y ER de AcademiX

13 tablas, 111 columnas y 33 relaciones. Tipos PostgreSQL y límites de cadenas
acordados; el modelo documental no sustituye migraciones ni DDL ejecutable.

## Archivos

- [academix-data-catalog.xlsx](academix-data-catalog.xlsx): único catálogo editable,
  con las hojas Tablas, Columnas y Relaciones.
- [academix-er.mmd](academix-er.mmd): fuente Mermaid editable del ER completo.
- [academix-er.pdf](academix-er.pdf): solo el ER, en una página ajustada al contenido.
- [academix-er.svg](academix-er.svg): diagrama vectorial para informes.
- `mermaid-config.json`: configuración visual para renderizar el diagrama.

Las restricciones de unicidad, validaciones, contratos JSON y decisiones pendientes
se mantienen en [12-data-catalog.md](../12-data-catalog.md). El ER solo marca PK/FK.
`NULL`/`NOT NULL` indica nulabilidad; `varchar(n)` cuenta caracteres y
`timestamptz(6)` expresa precisión de seis decimales.

## Edición y exportación

Editar el catálogo directamente en Excel o LibreOffice. Al modificar tablas,
campos, tipos o relaciones, actualizar también `academix-er.mmd`, el Mermaid de
[06-data-model.md](../06-data-model.md) y el anexo del catálogo. No hay generador
del catálogo ni CSV paralelos; la correspondencia se mantiene manualmente.

Desde la raíz del repositorio, renderizar el Mermaid actualizado:

```bash
pnpm dlx @mermaid-js/mermaid-cli@12.0.0 \
  -i docs/deliveries/2/data-catalog/academix-er.mmd \
  -o docs/deliveries/2/data-catalog/academix-er.svg \
  -c docs/deliveries/2/data-catalog/mermaid-config.json

pnpm dlx @mermaid-js/mermaid-cli@12.0.0 \
  -i docs/deliveries/2/data-catalog/academix-er.mmd \
  -o docs/deliveries/2/data-catalog/academix-er.pdf \
  -c docs/deliveries/2/data-catalog/mermaid-config.json --size 4949
```

Mermaid CLI usa Puppeteer/Chrome. Para un Chrome instalado localmente, puede
pasarse `-p` con un JSON que indique `executablePath`. El PDF conserva detalle
vectorial; requiere zoom o impresión en formato grande para leer todos los campos.
