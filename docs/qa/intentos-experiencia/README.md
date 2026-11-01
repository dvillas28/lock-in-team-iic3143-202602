# Validación visual de intentos

Fecha: 2026-10-30. Rama: `feat/quizzes-experiencia-usuario`.
[Diseño y límites](../../frontend/intentos-experiencia.md).

## Entorno y recorrido

Se reutilizó el entorno local de [quizzes con backend real](../quizzes-real-backend/README.md):
PostgreSQL 17 en 55432, API NestJS en 3001 y Next.js en `uc.localhost:3000`.
Chromium headless de Linux se ejecutó desde `/tmp`, sin dependencias nuevas del producto.
Los recorridos usan cuentas demo y registros de la base local `academix_quizzes_dev`.
No se usaron respuestas de API simuladas.

1. Estudiante abre un intento en progreso del quiz de validación existente.
2. Selecciona una alternativa y comprueba el avance del borrador.
3. Guarda respuestas y recibe confirmación de la API.
4. Abre la confirmación de envío, verifica foco en Volver y cierra con Escape.
5. Comprueba retorno al botón Enviar intento, móvil y tema oscuro.
6. Docente consulta listado y revisión con corrección autorizada.
7. Ayudante consulta revisión sin corrección ni cancelación.

El intento de pruebas se conserva en progreso con una respuesta guardada.
La automatización no envía ni cancela ese intento en la base local.
Las transiciones terminales e incertidumbre se verifican con las suites existentes.

## Evidencia

- [Resultado estructurado](evidence.json).
- [Preguntas y acciones en escritorio](estudiante-escritorio.png).
- [Móvil claro](estudiante-movil.png).
- [Móvil oscuro](estudiante-movil-oscuro.png).
- [Revisión docente](revision-docente.png).

Las capturas muestran datos ficticios de validación. No contienen credenciales.
Sin errores JavaScript ni desborde horizontal de página móvil observados.
Esto no valida producción ni constituye una auditoría WCAG completa.
