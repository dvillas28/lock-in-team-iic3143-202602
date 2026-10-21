# Modelo documental de la fundación frontend

Este modelo describe archivos y relaciones de trazabilidad. No crea tablas,
contratos HTTP nuevos ni datos de usuarios.

## Misión hija

- Identidad: número 1–6, US correspondiente, nombre y directorio reservado.
- Contenido: actores, escenarios, FR, SC, supuestos, CU/RF/RNF, backlog y exclusiones.
- Relaciones: consume contratos backend y enlaza misiones prerrequisito.
- Artefactos: `spec.md` y `checklists/requirements.md` en su directorio.
- Estado: pendiente → redactada → validada; bloqueada documentalmente si falta
  una decisión de alcance/permisos que impide criterios verificables.
- Regla: validada no significa implementada ni desplegada; conservar evidencia.

## Entrada de cobertura

- Identidad: ID de CU, tarea FE o vista/acción del inventario de mockups.
- Campos: misión responsable, clasificación, justificación y fuente local.
- Clasificación: incluida, reutilizada, parcial o excluida.
- Cada CU-01–16 y FE-01–20 tiene al menos una entrada justificada;
  cada acción tiene un responsable aunque varias compartan pantalla.
- FE-20 es transversal y misión 6 consolida el cierre; FE-21 es exclusión.
  Una pantalla parcial enumera acciones incluidas/excluidas del MVP.

## Dependencia

- Campos: misión origen, requerida y tipo (documental o implementación futura).
- Regla: no ciclos; redacción acepta fixtures sin depender de UI implementada.
- Orden runtime: `1 → 2 → {3,4}; 4 → 5 → 6`.
- Specs hijas enlazan directorios reservados; cierre verifica su existencia.

## Contexto institucional y capacidades

Conceptos del producto, no nuevas entidades persistidas: dominio reconocido →
slug solicitado; JWT identifica User; pertenencia activa y permisos backend
autorizan institución/curso/sección. CORS admite orígenes.
La spec hija define estado de sesión y cambio entre dominios sin asumir SSO.
Mantener isAdmin, ownership, isSuperAdmin y Enrollment como conceptos distintos.

## Integridad e historial

Git conserva cambios documentales; editar specs no genera AuditEvent.
Specs de producto deben conservar historial/auditoría backend en matrículas,
contenido, quizzes, intentos, publicación y cambios de permisos.
No hay migraciones, seed, credenciales ni recuperación de DB en esta misión.
