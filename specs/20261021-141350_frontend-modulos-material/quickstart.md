# Quickstart: Módulos y material frontend

Implementación US1–US3 disponible. Evidencia y límites: [guía](../../docs/guides/frontend-content.md).

## Prerrequisitos

Node 24, pnpm 9.15.9, backend existente disponible y fixtures UC/UTFSM.
Usar `.env.example` y las instrucciones backend del repositorio; no guardar secretos.
Configurar NEXT_PUBLIC_API_URL y NEXT_PUBLIC_INSTITUTION_ORIGINS en el entorno frontend
según `.env.example`; abrir http://uc.localhost:3000 y http://utfsm.localhost:3000.
Login real para validación runtime; cuentas/datos ya provisionados, sin seed destructivo.
Fixtures aisladas en frontend/test/fixtures/content.ts bastan para pruebas automatizadas.

## Comandos (raíz del repositorio)

```bash
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend api:check
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir frontend test:coverage
pnpm --dir frontend build
python3 .github/scripts/check-doc-length.py
pnpm --dir frontend dev
```

Ejecutar dev después de checks con las variables públicas configuradas.
content-*.test.ts cubre contratos/UI con fixtures; no certifica el backend real.

## Matriz de fixtures

UC: curso de dos secciones, teacher admin, teacher no admin, assistant y student;
admin/superadmin sin teacher y caso sin Enrollment. UTFSM: curso diferente.
Cuatro combinaciones módulo/ítem publicado, módulo vacío y curso sin material visible;
Unicode/multilínea, HTML y URLs adversariales. No requiere quizzes ni PDF.

## US1 — MVP consulta

1. Student/assistant abre módulos y lectura: solo accede cuando ambos están publicados.
2. Probar las cuatro combinaciones, incluso URL directa; rechazo no revela contenido oculto.
3. IDs cruzados UC/UTFSM o padres incorrectos del mismo tenant: cero datos mostrados;
   verificar path institucional y rechazo backend real además del check con fixtures.
4. HTML/scripts, javascript:/data:, imágenes y metadatos adversariales quedan como texto;
   sin ejecución, navegación activa o petición externa originada por markdown.
5. Revisar carga, vacío real, 503, timeout, retorno curso/módulo y reintento GET.

## US2 — Autor sin privilegio admin

1. Teacher no admin crea módulo/material borrador compartido; teacher de otra sección
   lo ve, student no puede leerlo.
2. Editar título/markdown y ordenar por teclado enviando todos los IDs vía PUT.
   Alta usa max(position)+1; verificar posiciones con huecos y conflicto por concurrencia.
3. Assistant/student/admin sin teacher no escriben, incluso con petición API forzada.
4. Título blanco/NUL/>200, markdown blanco/NUL/>10000 y JSON >4096 bytes se rechazan;
   probar UTF-8 y escapes en el límite, conservar texto autorizado sin truncarlo.
5. Perder respuesta POST: no retry, consultar lista antes de repetir; ambigüedad bloquea.
   Probar fallo de consulta y dos recursos con igual título.
6. Edición concurrente/409 no promete merge/versionado ni reenvía cambios automáticamente.

## US3 — Publicación independiente

1. Publicar ítem bajo módulo oculto: estado publicado, aviso de no visibilidad efectiva.
2. Publicar módulo habilita lectura del ítem publicado; ocultarlo conserva estados hijos.
3. Repetir publicación: estado coherente; audit/no-op se observa en backend existente,
   no se genera en navegador. Un mock UI no certifica rollback SQL.
4. 403/404 o respuesta perdida: sin éxito inventado, limpiar al revocar y consultar
   estado antes de repetir. Mutación confirmada + refresh fallido se comunica distinto.

## Transversal

Durante lectura/edición/envío: logout, expiración y cambio usuario/tenant/recurso deben
ignorar respuestas tardías y limpiar datos/borradores, sin persistencia en storage.
Verificar teclado completo, foco tras orden/publicación, labels y anuncios, 375 px,
ambos temas, contraste ≥4.5:1 y prefers-reduced-motion.
Registrar resultados por US y FR/SC en docs/guides/frontend-content.md tras implementar;
separar límites runtime de evidencia obtenida con fixtures.

## Baseline 2026-10-22

T002: api:check, lint, typecheck y 165 pruebas aprobadas antes de cambios runtime.

Fundación/US1: 9 pruebas content aprobadas; lint/typecheck verdes.
Red inicial: módulos de validación/API/componentes ausentes; verde tras implementación.
T012: layout sin colores nuevos, wrapping explícito; revisión visual integrada en T026 pendiente.

## Evidencia de implementación

- T003–T005: fixtures, DTO/parentesco, Unicode/NUL/UTF-8 e independencia de admin.
- T006–T012: lectura profunda, estados, navegación, markdown inerte y respuestas tardías.
- T013–T019: payloads mínimos, posición/orden, incertidumbre y borradores autorizados.
- T020–T024: POST sin body, cuatro publicaciones, foco y refresh después de confirmación.
- T025: regresiones existentes de sesión/cursos/participantes conservadas en suite final.
- T026 parcial: Chromium visible, 375/1280 px, ambos temas, teclado y reduced motion.
  Backend localhost:3001 no responde y no hay credenciales locales disponibles.
  Rechazos, matriz y auditoría con API/SQL reales permanecen pendientes.
- T027/T028: resultados finales y matriz FR/SC en la guía; sin despliegue.
- Hooks before/after implement: git commit opcional omitido por instrucción del usuario.

Checks finales: api:check/lint/typecheck/test/coverage/build PASS, 192 pruebas.
Cobertura 92.88% líneas / 87.55% ramas (umbrales 80/80 intactos).
Audit adicional: high preexistente braces en tooling ESLint; detalle y límites en guía.
