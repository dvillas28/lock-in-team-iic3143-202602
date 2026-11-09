# Archivos académicos en módulos

[Issue #242](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/242) ·
[Guía para habilitar S3](s3.md) · [Decisión de arquitectura](../../adr/s3-for-academic-files.md) · [OpenAPI](../../reference/openapi/openapi.yaml)

## Alcance

Esta entrega amplía CU-05, CU-06 y CU-14 de la [Entrega 2](../../deliveries/2/03-use-cases-and-requirements.md).
Implementa el soporte binario previsto en RF14–15 y RNF8. Conserva los
controles de módulo, consulta, aislamiento y auditoría de RF13, RF16, RF25–26
y RNF1–4, RNF6, RNF9–10. Usa el módulo académico, PostgreSQL y AWS SDK v3 que
el proyecto ya emplea. Las tareas y entregas se abordarán en su propia entrega.

## Modelo y permisos

`materials` representa tres tipos de fila en el módulo. Las filas existentes
siguen siendo Markdown. Los archivos guardan nombre original, nombre visible,
MIME, tamaño y una referencia privada. Los enlaces a cuestionarios apuntan
al quiz existente, con FK que exige la misma institución y curso. Una posición
única por módulo ordena los tres tipos. La migración mantiene el orden
anterior de Markdown y asigna nuevas posiciones al agregar recursos.
Los contratos Markdown previos siguen atendiendo clientes de Markdown. La
reversión de la migración exige retirar previamente los archivos y enlaces
activos para preservar sus referencias.

| Acción | Docente activo en el curso | Estudiante o ayudante activo en el curso |
| --- | --- | --- |
| Ver archivos | Publicados y borradores | Requiere módulo y archivo publicados |
| Abrir visor o descargar | Revalida el mismo permiso | Revalida el mismo permiso |
| Cargar, ordenar, renombrar, publicar, reemplazar y eliminar | Sí | Consulta |
| Enlazar o retirar un quiz | Requiere además su permiso de autoría de quiz | Consulta según su sección |

La capacidad docente deriva de la matrícula docente activa. Las banderas
institucionales de administración por sí solas carecen de acceso a contenido.
Las políticas RLS vigentes en `materials` y las claves foráneas compuestas
refuerzan el aislamiento. Los enlaces a quizzes respetan la publicación del
módulo y las reglas del quiz. El acceso desde la pestaña Quizzes conserva su
propia autorización.

## Transferencia y persistencia

El navegador envía multipart al backend con progreso por archivo. El backend
limita el número de cargas simultáneas y el tamaño, verifica extensión, MIME
y firma o estructura disponible, y guarda cada archivo como borrador. Las
cargas de varios archivos se envían secuencialmente. La clave idempotente de
cada carga permite recuperarse de una respuesta perdida sin crear otra fila
para el mismo intento.

El adaptador local y el adaptador S3 implementan la misma interfaz de objetos.
Las reglas de fotos de perfil viven en su proveedor actual. La API autoriza
cada solicitud y transmite el archivo desde el almacenamiento al cliente.
La capa HTTP ofrece rutas independientes para contenido en línea y adjuntos.
Así se evita conceder al navegador una credencial o una URL de acceso directo
al bucket. La interfaz obtiene el PDF completo dentro del límite configurado
y lo renderiza con PDF.js y sus recursos locales, con página, zoom y texto
seleccionable. Las imágenes respetan sus proporciones. TXT y Markdown se
muestran como texto inerte. Los demás formatos ofrecen información y descarga.

Cada reemplazo escribe una clave nueva. La transacción vuelve a validar
la autorización y comprueba que el objeto que se va a sustituir sigue vigente.
El cambio de referencia y la auditoría se confirman juntos. Después se
retira el objeto anterior. El historial conserva metadatos de los cambios y
eliminar un recurso retira su referencia. El comando de mantenimiento recupera
objetos que quedan sin referencia tras una escritura fallida, confirmación
incierta o fallo de borrado. Los objetos se consideran después de 24 horas y
el operador comprueba las referencias vigentes en PostgreSQL antes de borrar.

## Prueba local

Con un entorno local configurado, usa `ACADEMIC_STORAGE_DRIVER=local` y aplica
la nueva migración. Compose usa el volumen de datos existente. Entra como
docente a un módulo publicado y sube un PDF de varias páginas desde **Agregar
archivo**. Verifica la fila en borrador, ordénala y publícala. Entra con una
matrícula de estudiante y abre la misma fila. Comprueba la segunda página, el
zoom, la acción **Descargar archivo** y el enlace de retorno al módulo.

La prueba repetible inicia sus propios Next.js, NestJS y PostgreSQL 17 con
datos sintéticos y almacenamiento local:

```bash
pnpm --dir e2e exec playwright install chromium
pnpm --dir e2e run test --project=chromium --grep E2E-CONTENT-008
```

Para aislar el backend, ejecuta `academic-storage.test.mjs` y la integración
`academic-files.test.mjs` con las URLs PostgreSQL de prueba indicadas en
[la guía de pruebas](../../guides/login-session-testing.md). El transporte S3 simulado
cubre los comandos y fallos del adaptador. La prueba real de S3 sigue
pendiente de la habilitación de permisos por Daniel.

## Evidencia de la aplicación

Capturas de Chromium con datos sintéticos en PostgreSQL y archivos locales.

- [Docente con PDF publicado y archivo en borrador](evidence/01-docente-modulos.png)
- [Estudiante con los recursos autorizados](evidence/02-estudiante-modulos.png)
- [PDF real renderizado y acción de descarga](evidence/03-visor-pdf.png)
- [Visor móvil en tema oscuro](evidence/04-visor-movil-oscuro.png)

## Resultados del 9 de noviembre de 2026

| Comprobación | Resultado |
| --- | --- |
| Builds, lint y TypeScript | Aprobados para frontend y backend. |
| OpenAPI y catálogo | Contrato válido con 3 avisos previos, tipos sincronizados y 4 pruebas del catálogo aprobadas. |
| Backend unitario | 52 de 52. Incluye almacenamiento local y transporte S3 simulado. |
| PostgreSQL 17 | 189 de 193 en la regresión inicial. Los 4 casos pendientes pasaron en una ejecución posterior de 27 pruebas, que incluyó la nueva prueba de backfill y reversión. Se actualizaron los recuentos por la migración 17 y se ejecutó desde `backend/` para el caso de correo. |
| Frontend unitario | 386 de 387. La prueba de cambio horario de quizzes falla al importar un módulo con Node 24.9.0 y tsx. Se reprodujo en una copia limpia de HEAD. |
| Chromium | 2 de 2. Flujo de archivos y regresión de Markdown. Incluye lectura en dos páginas, zoom, descarga con bytes idénticos, imagen, formato sin visor, teclado, tema oscuro y ancho de 375 px. |
| Docker Compose | Configuración validada. El recorrido funcional usó servicios locales de prueba. |
| Bucket S3 real | Pendiente de habilitación por Daniel. |
