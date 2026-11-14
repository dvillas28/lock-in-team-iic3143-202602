# Implementation Plan: Calendario de plazos

**Branch**: `feat/student-calendar` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md) | **Issue**: #316

## Summary

Endpoint agregado de solo lectura más tres superficies de UI que comparten una grilla mensual:
botón flotante con mini calendario, página `/calendar` e ítem del sidebar.

## Technical Context

- Backend NestJS + SQL con `pg`; sin migraciones (índice `enrollments_visibility_idx` cubre la consulta).
- Frontend Next.js App Router; cliente `openapi-fetch` regenerado desde OpenAPI; sin librerías de fechas nuevas.
- Zona horaria: `localChile()` de `frontend/src/lib/assignments/dates.ts`.

## Constitution Check

Pre-design: PASS. Post-design: PASS.
- Tenant: `withInstitution` + `institution_id=$1` explícito en cada tabla; RLS vigente; prueba UC/UTFSM.
- Roles: solo matrículas activas `teacher`/`student`; reglas idénticas a los listados por curso; ayudantes sin eventos.
- Auditoría: lectura pura, sin cambios en registros académicos → sin evento de auditoría nuevo.
- Historias independientes: US1 (FAB) y US2 (página/sidebar) reutilizan el mismo endpoint.
- Complejidad: una consulta UNION; sin caché, colas ni proveedores nuevos.
- Documentos < 150 líneas.

## Project Structure

```text
backend/src/calendar/            calendar.controller.ts, calendar.service.ts
backend/test/integration/        calendar.test.mjs
docs/reference/openapi/          paths/calendar.yaml, components/schemas/calendar.yaml
frontend/src/lib/                api/calendar.ts, calendar/calendar.ts
frontend/src/components/calendar calendar-fab, calendar-page, month-grid, month-nav, day-agenda, use-calendar
frontend/src/app/calendar/       layout.tsx, page.tsx (ProtectedInstitution)
frontend/src/styles/calendar.css
e2e/specs/calendar.spec.ts       E2E-CALENDAR-001
```

## Design & Delivery

- `ProtectedInstitution` decide `showsCalendarButton()` y pasa el FAB como `floating` al shell.
- El popover es un `role="dialog"` no modal: Escape devuelve el foco, clic externo cierra.
- Tonos: inicio `--primary-ink`, entrega `--warning`, cierre `--danger`, pasado `--text-3`; ámbar no se usa (reservado a notas).
- Rango pedido = grilla visible ± 1–2 días para cubrir UTC−3/−4.

## Security & Failure Handling

- Parámetros validados con `timestamp()`; claves desconocidas → 400; `Cache-Control: no-store`.
- El cliente rechaza eventos no publicados con `viewerRole=student` (`ApiResponseError`).
- Errores: estado de reintento en popover y `ErrorState` en la página.

## Validation & Rollout

- `pnpm -C backend test:integration` (calendar.test.mjs), `pnpm -C frontend test:coverage`, typecheck, lint, `pnpm docs:api:lint`.
- E2E `E2E-CALENDAR-001 @regression` en GitHub Actions; catálogo OpenAPI pasa a 98 operaciones.
- Revisión visual claro/oscuro, 1440 px y 390 px con datos demo locales.

## Complexity Tracking

Sin desviaciones.
