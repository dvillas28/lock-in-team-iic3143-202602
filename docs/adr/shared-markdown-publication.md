# Contenido markdown compartido y publicación independiente

Fecha: 2026-10-16. Estado: implementado; lector enriquecido actualizado el 2026-10-25.

## Contexto

FR-003/004/006/007 de módulos-material exige contenido común a secciones,
publicación padre/ítem, historial y consumo sin acciones ejecutables.
[Permisos existentes](ui-admin-non-admin-experiences.md) ya permiten autoría al docente no admin.

## Decisión

- CourseModule pertenece a Course; Material a CourseModule. Ambos llevan
  institution_id y FK compuestas; ninguno pertenece a Section.
- Teacher activo en cualquier sección puede gestionar contenido común.
  Assistant/student requieren publicación del módulo y material. Flags admin
  sin Enrollment no conceden acceso al contenido.
- published_at es independiente en cada recurso. Ocultar padre conserva hijos,
  contenido e historial; publicar/ocultar repetido es no-op.
- Edición conserva publicación; auditoría before/after atómica conserva versiones
  anteriores del markdown bajo los permisos del historial académico existente.
- Fuente markdown viaja solo como string JSON inerte con nosniff/no-store.
  Esta misión backend no incorpora renderizador HTML ni modifica mockups.
- Orden serializado mediante lock del curso y UNIQUE diferible por posición.
  El reemplazo completo evita posiciones parciales y conserva publicación.

## Consecuencias y alternativas

Dos secciones reciben los mismos IDs; no se pueden mantener variantes por sección.
Edición publicada aparece inmediatamente; no existe workflow de revisión adicional.
No eliminar contenido para ocultarlo ni despublicar en cascada a los hijos.
El consumidor React usa `react-markdown` + `remark-gfm`, sin HTML habilitado,
rehype-raw ni dangerouslySetInnerHTML. No se implementa parser/sanitizador con regex.
La política central valida URLs con URL y rechaza entradas ambiguas antes de normalizar;
solo HTTP(S) absolutos sin credenciales y fragmentos no vacíos. No hay resolución relativa.
Enlaces HTTP(S) abren con noopener/noreferrer y no-referrer; sin prefetch ni tokens.
Imágenes se sustituyen por texto alternativo inerte; ningún recurso remoto se monta.
Código conserva texto literal. Encabezados comienzan en h2 dentro del h1 de la página.
[Guía y pruebas](../guides/frontend-content.md) detallan límites y evidencia.
Binarios/RF15 y parte de RF14 permanecen P2, sin storage/provider en este plan.

Detalles: [plan](../../specs/20261014-234944_modulos-material/plan.md),
[modelo](../../specs/20261014-234944_modulos-material/data-model.md),
[contrato](../../specs/20261014-234944_modulos-material/contracts/authorization.md).
