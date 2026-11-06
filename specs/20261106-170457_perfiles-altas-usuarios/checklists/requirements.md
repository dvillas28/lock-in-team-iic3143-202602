# Specification Quality Checklist: Perfiles y altas institucionales

**Purpose**: Revisar calidad documental, cobertura y decisiones explícitas, no ejecución de la feature.
**Created**: 2026-11-06
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Spec centrado en valor, comportamiento, actores y resultados; SDK/DDL/rutas técnicas quedan en planes/ADR.
- [x] Cinco historias con prioridad, motivo, escenario independiente y aceptación de éxito/rechazo.
- [x] Secciones obligatorias del template completadas y documentos menores de 150 líneas.
- [x] Entidades y fronteras global/institucional separadas, sin rol global ni copia de identidad por tenant.

## Requirement Completeness

- [x] Sin aclaraciones de producto abiertas: PEND-01/02 cerrados por selección delegada y aprobación del usuario.
- [x] Reglas resueltas son comprobables; límites adoptados desde planificación como supuestos identificados.
- [x] Diez resultados medibles y escenarios negativos cubren privilegios, carreras, archivos, correo y limpieza.
- [x] Matriz completa CU-17–21, RF30–56, RNF11–20, FR/SC y cinco IDs de backlog.
- [x] Dependencias existentes y exclusiones explícitas, sin reabrir misiones o ampliar administración académica.
- [x] Remitente elegido y documentado: PEND-01 cerrado como decisión.
- [x] Política de limpieza 7/30 aprobada: PEND-02 cerrado; campos/recibos/defaults documentados.

## LMS Constitution Checks

- [x] Contexto/actor/pertenencia e isAdmin OR isSuperAdmin se revalidan; no se concede docencia ni cursos ajenos.
- [x] Perfil global solo propio y aceptación por invitación son excepciones de identidad acotadas.
- [x] Archivo CSV efímero confirmado; datos normalizados/recibos se rigen por la política aprobada.
- [x] Historia académica/auditoría preservadas; cambios sensibles con evidencia atómica mínima.
- [x] Complejidad acotada: entidades justificadas, sin nuevos servicios de background ni autorización genérica.
- [x] Constitución 1.6.0 y plantillas sincronizadas con ampliación especificada, no presentada como implementada.

## Feature Readiness

- [x] Documento listo para revisión y continuación del diseño sobre reglas resueltas.
- [ ] USR-01 completamente cerrado: completar diseño técnico de identidad, grants/RLS/readiness y sesiones.
- [ ] DNS/Resend verificados y configurados: tarea operativa de Daniel/Matías, sin evidencia aún.
- [ ] Feature implementada/probada/desplegada: fuera de esta formalización, sin evidencia de ejecución.

## Notas de validación

El usuario aprobó limpieza y delegó el remitente; ambas decisiones quedan registradas.
Publicar documentación no equivale a habilitar correo real, limpiar datos o cerrar historias.
Próxima fase: completar el plan técnico formal y validar capacidad/estimaciones;
este trabajo continúa limitado a documentación hasta nueva instrucción.

## Hooks y límites de ejecución

- Template activo: `.specify/templates/spec-template.md`; CLI/presets locales no disponibles.
- Hook before_specify de rama deshabilitado; rama existente conservada.
- Inicialización de constitución comprobada por script: repositorio ya existente, sin cambios Git.
- Formalización original sin hooks de commit; posteriormente el usuario autorizó commit/push documental en la misma rama.
- Conservar `.specify/feature.json`, backend/frontend, configuración operativa y dependencias.
- Publicar solo documentación; issues remotas, envíos, infraestructura y migraciones siguen fuera de alcance.
