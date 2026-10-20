# Validación local

Desde raíz, Node 24 y pnpm:

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm docs:api:lint
pnpm docs:api:test
pnpm docs:api:build
pnpm docs:api
```

Abrir `http://localhost:8080/`. Swagger UI requiere JavaScript; backend no es necesario.
El comando de build imprime revisión y cobertura real; descargar openapi.json
con la misma revisión desde portada. Abrir links de identidad y cursos,
usar filtro y expandir parámetros/respuestas con teclado; ampliar al 200 %.
No aparece Try it out. La descarga funciona sin JavaScript; probar fallo de
openapi.json y confirmar error explícito sin fichas parciales.

Consultar [operación y evidencia](../../docs/reference/api-catalog.md).
Pruebas con cuentas reales de test y cinco lectores se registran por separado;
no confundir ejemplos sintéticos con ejecución de operaciones académicas.
