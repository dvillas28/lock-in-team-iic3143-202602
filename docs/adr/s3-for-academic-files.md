# Almacenamiento privado para archivos académicos

Implementado el 9 de noviembre de 2026. La prueba real de S3 queda pendiente.
[Issue #242](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/242).

## Contexto

Los archivos académicos requieren archivos de hasta 50 MiB, reglas de acceso
por institución y curso, lectura dentro de AcademiX y descarga explícita.
El almacenamiento de avatares resuelve un caso distinto de 2 MiB, identidad
global y normalización a WebP. Extender ese contrato mezclaría reglas de
validación, nombres y permisos con ciclos de vida diferentes.

## Decisión

- Usar una interfaz de objetos con adaptadores local y S3. Reutilizar el SDK,
  el patrón de almacenamiento privado y la separación operativa de avatares.
  El proveedor académico usa configuración propia para driver y bucket.
- Guardar claves inmutables bajo
  `academic/materials/{institutionId}/{materialId}/{objectId}`. PostgreSQL
  conserva metadatos, una referencia y el historial sanitizado de cambios.
  El adaptador puede reutilizarse bajo `academic/submissions/`.
- Autenticar y autorizar cada lectura y escritura en NestJS. Enviar cargas
  multipart limitadas y transmitir las lecturas desde el proveedor. La
  autorización de una URL firmada seguiría vigente hasta su expiración.
  El proxy permite aplicar revocaciones y publicación a cada solicitud.
- Usar PDF.js con recursos servidos por AcademiX. La app puede controlar
  navegación de páginas, zoom y texto accesible con el mismo flujo en
  escritorio y móvil. El componente recibe bytes de la API autenticada.

## Consecuencias

El backend procesa y valida la carga antes de publicar la referencia en
PostgreSQL. Los límites y la concurrencia acotan su consumo de memoria.
El proceso de mantenimiento recupera objetos sin referencia que queden
tras una falla o confirmación incierta. El driver local permite probar todo
el flujo sin dependencias externas. S3 usa cifrado SSE-S3 e IAM por prefijo.

[Diseño y pruebas](../planning/academic-files/implementation.md) ·
[Configuración S3](../planning/academic-files/s3.md)
