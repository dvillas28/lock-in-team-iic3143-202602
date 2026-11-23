# Respaldo local de la demo

**21/11/2026, 15:25–15:38 de Chile.** Se probó el cambio desde una pestaña con fallo de red simulado a una sesión local ya abierta. La persona que opera puede continuar con datos sintéticos separados, incluso sin acceso a Render.

## Entorno y versión

Compose levantó PostgreSQL 17 y construyó ambas imágenes desde el checkout de la PR en `6cf28e3`. Los árboles Git de backend (`cc0c4e0`) y frontend (`001aea5`) coinciden con los de `7d4b666`. También coincide el [Compose](../../../../docker-compose.yml). La API local devuelve `0.1.0` y commit nulo por configuración. La equivalencia se verificó con Git. GitHub registra el [despliegue frontend](evidencia/deploys-render.json) en ese mismo SHA.

Se creó una base independiente. El bootstrap creó cinco cuentas por institución, el superadmin local delegó administración por la API y la seed de presentación pasó por `check`, `preview`, `apply` y `verify`. Quedaron tres cursos y cuatro secciones por institución. PostgreSQL solo se expone a la red interna de Compose. Los puertos web y API escuchan en el loopback de esta máquina. Los archivos se almacenan en un volumen local y el correo está desactivado. [Seed y controles](../../../DEMO_SEED_RENDER.md).

## Comprobaciones por navegador

Chrome visible con Playwright. El navegador del ensayo bloqueó destinos HTTP(S) externos y permitió localhost. Cada rol usó un contexto independiente. Los tiempos corresponden a una pasada automatizada e incluyen esperas de pantalla.

| Caso | Procedimiento y resultado | Tiempo |
| --- | --- | --- |
| Acceso, módulos y notas · CU-01/06/12/16 | UC docente y estudiante ingresaron, abrieron un curso desde la tarjeta y llegaron al libro o notas personales. La tabla mostró 5 y 4 filas respectivamente. | 1,42 y 1,32 s |
| Misma secuencia en UTFSM | Docente y estudiante abrieron módulos y notas. La tabla mostró 5 y 4 filas. | 1,31 y 3,28 s |
| Cancelación y corrección · CU-08/09/15 | En UC y UTFSM, cada estudiante canceló un intento nuevo (204, cero notas), envió otro vacío (1,0) y respondió correctamente las dos preguntas del tercero (7,0). El registro local conservó los tres intentos. | Login hasta envío con respuestas, UC 3,41 s y UTFSM 3,20 s |
| Publicación y auditoría · CU-11/12/13 | Ambos docentes publicaron la selección de un estudiante. Ambos estudiantes vieron 7,0. Se abrió el detalle de auditoría filtrado por `grade.published`. En UTFSM se comprobó en la misma pasada la ausencia previa de esa fila. | UTFSM 5,32 s. UC requirió una segunda pasada para consultar el detalle. |
| Tareas y entregas · CU-22/23 y revisión | UC docente publicó una tarea nueva de respuesta escrita. Estudiante entregó el intento 1. Docente calificó 8/10 y publicó la selección. El estudiante leyó 80 % y nota 5,5. | Publicada a 2,95 s, entregada a 4,33 s, visible a 6,22 s |
| Altas CSV y perfil | UC admin validó una fila inválida y comprobó bloqueo. Confirmó dos altas pendientes válidas (HTTP 200, dos registros). Ayudante local editó su descripción, subió un PNG (200), cambió su clave (204) y volvió a ingresar con la nueva (200). | 4,59 s en conjunto |
| Conmutación · #209 | La pestaña dirigida a UC remota recibió un error de desconexión simulado. Se cambió al estudiante UC local ya autenticado y se abrió el módulo. | 0,85 s desde el fallo |
| Archivo · CU-05/06 | Tras la conmutación, docente UC subió un TXT como borrador y lo publicó. Estudiante abrió el recurso y descargó los 27 bytes originales, comparados byte a byte. | 5,05 s incluido acceso y conmutación |

El tramo de respaldo verifica ventanas, lectura y escritura locales. Quedan fuera de esta medición el tiempo oral, volver a autenticar sesiones caducadas, migrar datos productivos, la entrega de correo y el servicio S3 remoto. Durante los preparativos se observó HTTP 429 por repetición de logins. Escalonar los accesos antes de exponer.

## Operación en este equipo

1. Desde la raíz del repositorio, ejecutar el comando de abajo. Conserva la base y los archivos en los volúmenes del proyecto de ensayo.
2. Verificar `http://localhost:3001/ready` y abrir `http://uc.localhost:3000/login` y `http://utfsm.localhost:3000/login` en perfiles separados. El archivo privado del operador contiene únicamente credenciales locales. Usar las correspondientes al rol y a la institución.
3. Preparar el curso de presentación en pestañas separadas. Cuando falle la ventana remota, cambiar a la local y anunciar el cambio de entorno. Si se creó un dato durante la demo remota, recrearlo con otro identificador en la base de ensayo.
4. El quiz local «Práctica abierta» de cada institución ya tiene nota publicada para el estudiante demo. Crear un quiz con otro título para volver a demostrar cancelación o publicación.
5. Mantener las sesiones activas. La recarga de una vista privada exige volver a ingresar.

```bash
respaldo="$HOME/.academix-demo/e4-respaldo"
docker compose -p academix-e4-ensayo -f docker-compose.yml \
  -f "$respaldo/loopback.yml" --env-file "$respaldo/local.env" up -d
curl --fail --silent http://localhost:3001/ready
```

Los archivos privados anteriores están preparados en el equipo del ensayo. En otro equipo hacen falta las imágenes, los datos sintéticos y credenciales locales propias antes de presentar.
