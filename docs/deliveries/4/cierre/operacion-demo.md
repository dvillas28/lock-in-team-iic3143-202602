# Operación y preparación de la demo E4

Comprobaciones del **21/11/2026**, UTC en los JSON; hora de Chile UTC−3.
[Alcance](alcance-final.md) · [Rendimiento](rendimiento.md) · [Presentación](../ppt/README.md).

## Resultado comprobado

| Control | Evidencia | Resultado |
| --- | --- | --- |
| Backend y esquema operativo | [Endpoints](evidencia/endpoints.json), [segunda lectura](evidencia/warm-cors.json). | `/health` y `/ready` 200; v0.13.1, SHA `7d4b666`. |
| Inicio público | [Navegador](evidencia/browser-public.json). | UC/UTFSM login 200, sin errores JS observados. |
| Acceso de roles | [Accesos](evidencia/access.json). | Docente y estudiante de ambas instituciones autenticados por UI; cursos/material/quizzes/notas consultados por API. |
| Ciclo académico | [Ejercicio remoto](evidencia/remote-cycle.json). | Ambas instituciones: creación, matrícula, material, quiz, intento, nota 7,0, publicación y auditoría. |
| Visibilidad de nota | Mismo ejercicio. | Sin nota estudiantil antes de publicar; nota/promedio 7,0 después. |
| Autorización | Mismo ejercicio. | Estudiante sin autoría ni libro docente (403); IDs de la otra institución rechazados (404). |
| Archivos | Mismo ejercicio. | TXT de 52 bytes cargado/publicado/descargado por tenant; SHA-256 y bytes idénticos. |
| CORS | [Preflight](evidencia/warm-cors.json). | UC/UTFSM permitidos; origen ajeno sin `Access-Control-Allow-Origin`. |

La prueba transaccional se ejecutó por **API real**. Los logins se hicieron por UI;
la lectura visual de resultados se registra separadamente. No se atribuye un ensayo
completo de autoría/rendición/publicación con clics a las llamadas API.

## Datos reservados para validación

No se modificaron cursos ni notas anteriores. Se añadieron datos sintéticos identificables:

| Institución | Código | Curso / sección |
| --- | --- | --- |
| UC | `E4-VALID-20261121-UC` | `13d99c92-59a6-4545-b19a-9e966d6e3376` / `ea7a218e-493e-4f73-b47b-2fc7d8d2b0a6` |
| UTFSM | `E4-VALID-20261121-UTFSM` | `964fec5a-b7fb-4c6c-85e5-d79c5d126bc0` / `a6b1998b-bdac-49f2-93e7-c8844aff9914` |

Nombre: «Validación E4 · datos sintéticos · 21/11». Admin institucional es dueño/docente;
Student está matriculado. Existe un módulo, Markdown, TXT, quiz y nota publicada por curso.
Las claves se mantienen fuera de Git. Los IDs de recursos están en el JSON del ejercicio.
No reutilizar la misma nota publicada para demostrar una publicación nueva: preparar otra evaluación.

## Secuencia por rol

1. **D1 · Acceso:** abrir UC y UTFSM; sesiones independientes de docente/admin, estudiante y ayudante.
2. **D2 · Estructura:** abrir el curso de demo elegido, sección y participantes. Confirmar roles antes de comenzar.
3. **D3 · Material:** crear/publicar un módulo y recurso nuevos; estudiante los consulta y descarga archivo.
4. **D4 · Quiz:** crear/publicar evaluación nueva; estudiante guarda/envía; docente ve corrección. Probar cancelación en otro intento.
5. **D5 · Notas:** mostrar pesos y libro; ayudante solo lee; publicar selección explícita.
6. **D6 · Resultado:** estudiante ve nota/promedio; docente/admin muestra auditoría.
7. **D7 · Aislamiento:** mostrar UTFSM y rechazo controlado de un recurso UC; nunca cambiar permisos principales para esta prueba.
8. **Ampliaciones:** recorrer perfil/altas y tareas/entregas incluidas en el alcance entregado; registrar sus resultados en la matriz.

## Riesgos y acciones antes de exponer

| Riesgo observado o no acreditado | Acción concreta | Responsable sugerido |
| --- | --- | --- |
| Primera respuesta API ~27 s; frontend inicial ~12,7 s. | Abrir ambos dominios y consultar health/ready antes de empezar; verificar otra vez justo antes de la demo. No prometer un tiempo fijo de despertar. | Presentador de demo. |
| Tras calentamiento: health 171 ms y ready 199 ms, muestras únicas. | Conservar como observación; no presentarlo como SLA ni prueba de carga. | Dani. |
| `api.dvillasc.me` no resuelve DNS. | Usar `https://academix-backend-lr8x.onrender.com`; no cambiar DNS a última hora. | Equipo. |
| La guía antigua espera códigos/datos que han cambiado. | Usar IDs/códigos observados hoy y revisar el curso seleccionado antes del ensayo. No resembrar ni sobrescribir datos. | Presentador de demo. |
| Sesión en memoria y límite de login. | No recargar vistas privadas; reservar sesiones por rol y evitar más de cinco logins por minuto/IP. | Presentadores. |
| El equipo confirmó Neon. El envío de correo quedó fuera del recorrido. | Operador confirma configuración y prueba opt-in si se va a demostrar envío. Sin destinatario autorizado no enviar correo. | Dani. |
| Respaldo local comprobado con el árbol funcional de la release. | Abrir [instrucciones y resultados](respaldo-local.md) y practicar el cambio de ventana durante la exposición. | Equipo. |
| SonarCloud quality gate de #329 falló aunque CI result aprobó. | Revisar causas; no presentar todo CI como verde. Auditoría manual y E2E tienen sus propios resultados. | Dani / calidad. |
| Frontend y backend registrados en 7d4b666. | [Registro de despliegues](evidencia/deploys-render.json), ambos con estado success. | Dani. |

El [ensayo UI remoto](ensayo-remoto.md) y el [ensayo local](respaldo-local.md) registran los pasos ejecutados después del ciclo API inicial. Queda cronometrar la presentación conjunta.
No se ejecutaron redeploys, migraciones productivas, purgas ni envíos de correo.
