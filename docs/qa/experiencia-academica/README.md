# Evidencia: experiencia académica

Implementación en `fix/experiencia-academica`, desde `dev`.
Spec: specs/20261026-235900_experiencia-academica.
La [matriz](edge-cases.md) registra escenarios y verificaciones por flujo.

## Entorno y verificación visual

PostgreSQL 17 en contenedor desechable, base exclusiva terminada en `_test` y
rol `academix_runtime`; frontend 3100 y backend 3101 independientes del entorno
del usuario en 3000/3001. Sin cambios de esquema ni dependencias del proyecto.
Los datos académicos de captura se crearon mediante API real: curso, matrículas,
material, quizzes, intentos, calificación automática y publicación.

Perfiles comprobados en navegador: estudiante, docente, ayudante, docente
administrador propietario y superadmin sin matrícula académica. Ayudante ve el
libro sin publicar/ponderar/auditar; superadmin no obtiene acceso académico.
La búsqueda devolvió participantes de la institución y la asignación del mismo
rol confirmó la matrícula existente sin duplicarla.

Publicación guiada: selección, resumen, foco en Volver, cierre independiente,
confirmación HTTP y recibo real. Ponderaciones congeladas tras la primera publicación.
Notas propias muestran promedio parcial y 50 % antes de completar la publicación.
Auditoría filtra por etiqueta legible, conserva códigos/UTC en el detalle.

Las cuatro áreas se revisaron con ancho real `innerWidth=375`, sin desbordamiento
global (ancho documento 365; la tabla del libro desplaza 840 en contenedor 331).
Se verificaron ambos temas y foco seguro/retorno al cerrar diálogo con Escape.
Las capturas usan únicamente cuentas y registros ficticios del dominio `.example`.

## Capturas

- [Notas de estudiante](notas-estudiante.jpg).
- [Notas móvil](notas-movil.jpg) y [oscuro](notas-movil-oscuro.jpg).
- [Libro docente](libro-docente.jpg) y [móvil](libro-movil.jpg).
- [Revisión de publicación](publicacion-revision.jpg) y [recibo](publicacion-confirmada.jpg).
- [Ponderaciones bloqueadas](ponderaciones-bloqueadas.jpg).
- [Auditoría](auditoria-docente.jpg), [oscuro](auditoria-oscuro.jpg),
  [móvil](auditoria-movil.jpg) y [móvil oscuro](auditoria-movil-oscuro.jpg).
- [Búsqueda de participantes](participantes-busqueda.jpg) y [móvil](participantes-movil.jpg).

## Comandos reproducibles

```sh
pnpm --dir frontend test:coverage
pnpm --dir frontend typecheck
pnpm --dir frontend lint
pnpm --dir frontend build
pnpm --dir backend lint
# Configurar TEST_DATABASE_URL y TEST_RUNTIME_DATABASE_URL en una base desechable.
pnpm --dir backend test:coverage
pnpm docs:api:lint
pnpm docs:api:test
pnpm --dir frontend api:check
python3 .github/scripts/check-doc-length.py --self-test
python3 .github/scripts/check-doc-length.py --base origin/dev
```

No ejecutar integración contra bases compartidas: el harness recrea `public` y
comprueba revocaciones/roles de runtime. Evitar builds backend simultáneos con la
integración: Nest reemplaza `dist` mientras los procesos de prueba lo importan.

## Resultados

- Backend: 171/171; cobertura líneas 99,55 %, ramas 95,59 %.
- Frontend: 324/324; cobertura líneas 94,44 %, ramas 87,96 % (gate ≥80 %).
- Catálogo: 4/4, `/users` detectada como implementada.
- OpenAPI válido; conserva tres advertencias preexistentes del catálogo.
- La PR la crea el usuario. CI remoto y revisión humana quedan fuera de esta ejecución;
  una aprobación de PR no se infiere de estas pruebas.
