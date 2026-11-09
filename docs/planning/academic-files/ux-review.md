# Ajustes de experiencia en módulos y archivos

## Actualización de las listas

Las operaciones ya consultaban el estado al guardar. Algunas conciliaciones
hacían dos lecturas seguidas y actualizar los módulos también volvía a consultar
el curso. El curso y la lista de módulos ahora tienen consultas independientes.
Cada operación vuelve a consultar una vez la colección afectada. Una carga
por lote consulta después de procesar sus archivos. Las filas conservan sus
identificadores, los módulos desplegados y los borradores de edición.

Volver a la pestaña vuelve a consultar la lista de módulos y las listas de los
módulos desplegados. Los eventos de foco y visibilidad que llegan juntos se
agrupan. Al volver a desplegar un módulo se consulta su contenido. Ante un
fallo de lectura aparece **Reintentar** y se distingue de una escritura rechazada
o de resultado incierto.

## Confirmaciones

Una región `role="status"` anuncia el último éxito confirmado. La notificación
usa los tokens actuales, vive fuera de la lista y se retira a los cinco segundos.
La eliminación se coordina en la lista, por lo que puede confirmar la operación
aunque la fila haya desaparecido. Los errores y avisos de conciliación permanecen
junto al control correspondiente.

## Barra lateral

El caso anterior reprodujo en Chromium 3.329 píxeles de desborde vertical del
documento al recorrer un curso largo con archivos. El layout exterior tenía una
altura fija con `overflow: hidden` y carecía de un bloque contenedor para
descendientes absolutos, como las etiquetas visualmente ocultas de los archivos.
El desborde permitía desplazar el documento fuera del panel central.

En escritorio, el shell compartido acota su altura a la ventana dinámica.
El contenido y la lista de navegación se desplazan en sus propios contenedores.
El encabezado y el pie de la barra lateral quedan fuera del scroll de la lista.
En móvil, la navegación desplegable se superpone y el foco se mueve con
`preventScroll`. Abrirla o cerrarla conserva la posición del contenido.

## Prueba de cambio horario

`nonexistent DST local time cannot silently normalize to another hour` fallaba
al importar `configuration` desde un eval ESM, porque tsx cargaba el archivo
TypeScript como CommonJS en el proceso hijo con Node 24.9.0. La aserción sobre la
hora nunca se ejecutaba. El proceso hijo ahora usa CommonJS para cargar el
mismo código de producción con tsx. La prueba comprueba el salto de la hora
local en `America/New_York` y exige un error de validación en `opensAt`.

## Archivos de esta revisión

- Componentes de contenido en `frontend/src/components/content/`: `modules-panel.tsx`,
  `module-resources.tsx`, `module-form.tsx`, `material-form.tsx`, `publication-toggle.tsx`,
  `file-editor.tsx`, `file-upload-form.tsx`, `content-notices.tsx` y
  `use-refresh-on-return.ts`.
- `frontend/src/components/courses/use-mutation.ts`,
  `frontend/src/components/institutions/institution-shell.tsx`,
  `frontend/src/styles/content.css` e `institution-layout.css`.
- Pruebas `academic-markdown.test.ts`, `transient-feedback.test.ts` y
  `quiz-form-values.test.ts`. Casos Chromium en `e2e/specs/academic-files.spec.ts`,
  `e2e/specs/content.spec.ts` y catálogo en `e2e/data/phase-four.ts`.

## Evidencia

- [Confirmación de publicación en la vista docente](evidence/05-docente-confirmacion.png)
- [Barra lateral al final del curso, a 1024 px y en tema oscuro](evidence/06-sidebar-escritorio-oscuro.png)
- [Menú móvil superpuesto a 375 px](evidence/07-menu-movil-oscuro.png)
- [Lista de recursos en la vista estudiante](evidence/08-estudiante-listado.png)

## Verificación

| Comprobación | Resultado |
| --- | --- |
| ESLint y TypeScript | Aprobados en frontend y E2E. |
| Build | Next.js de producción compiló en el entorno de Chromium. |
| Suite completa del frontend | 388 de 388, incluida la comprobación de cambio horario. |
| Chromium | 41 de 42 en la ejecución amplia. El caso pendiente usaba el retorno de login para abrir el enlace entre instituciones y llegaba a «Mis cursos». Con la sesión UTFSM ya autenticada, la API respondió 404 al abrir el archivo UC. La repetición de archivos y layout pasó 2 de 2. |
| Layout | Páginas cortas y largas, inicio y final del curso, escritorio de 1440 y 1024 px, menú a 375 px, teclado y temas claro y oscuro. |
| Archivos | Carga, orden, publicación, cambio de nombre, reemplazo, eliminación, visor PDF, imagen, descarga y visibilidad por rol. |

Para repetir archivos y layout en Chromium:

```bash
pnpm --dir e2e run test --project=chromium --grep 'academic-files|academic-layout'
```
