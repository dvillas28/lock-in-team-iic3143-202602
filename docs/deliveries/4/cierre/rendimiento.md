# Rendimiento frontend — Evidencia E4

Medición **21/11/2026**, producción, Lighthouse **13.6.0**, Chrome **157**, Linux.
[Resultados JSON](evidencia/lighthouse-summary.json) · [Flujo privado](evidencia/authenticated-flow-summary.json).
Feedback atendido: métricas de página, rendimiento frontend y captura Lighthouse.

## Login público

Navegaciones Lighthouse independientes, emulación móvil predeterminada y preset desktop.
Se guardan HTML/JSON originales. Backend/frontend ya habían recibido tráfico: no es
una medición de cold start del proveedor. UC móvil: **3 muestras**, reportadas por mediana.
UC desktop y UTFSM móvil: **1 muestra cada uno**; no se generalizan a toda la plataforma.

| Escenario | Performance / A11y / buenas prácticas / SEO | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| UC móvil, mediana de 3 | 100 / 100 / 96 / 100 | 1,05 s | 1,05 s | 47 ms | 0 | 1,20 s |
| UC desktop | 100 / 100 / 96 / 100 | 0,62 s | 0,62 s | 0 ms | 0,0022 | 0,85 s |
| UTFSM móvil | 100 / 100 / 96 / 100 | 1,05 s | 1,05 s | 68 ms | 0 | 1,19 s |

- [Captura móvil para PPT](evidencia/lighthouse-login-mobile.png), [reporte de la muestra central](evidencia/lighthouse-uc-login-mobile-2.report.html).
- [Captura desktop](evidencia/lighthouse-login-desktop.png), [reporte desktop](evidencia/lighthouse-uc-login-desktop.report.html).
- [Reporte UTFSM](evidencia/lighthouse-utfsm-login-mobile.report.html).

**Hallazgo menor:** Lighthouse registra `/favicon.ico` 404 y reduce buenas prácticas
a 96. Hay oportunidades de reducir JS/CSS no utilizado; no se identificó un bloqueo
del recorrido medido. No se cambia el producto ni se fuerza un deploy solo por la puntuación.
Los navegadores de acceso no registraron excepciones JS; eso no excluye un 404 de recurso.

## Vista autenticada real

La sesión vive en memoria. Recargar o abrir otra navegación completa lleva al login;
por eso se usa **Lighthouse User Flow**, con snapshots y timespan de navegación SPA,
conservando la sesión real del estudiante UC. No se simula autenticación ni se inyecta JWT.

| Paso | Modo | Resultado |
| --- | --- | --- |
| Mis cursos | Snapshot | Accesibilidad 100, buenas prácticas 100. |
| Abrir módulos de un curso | Timespan desktop, sin throttling artificial | 1633 ms hasta red inactiva; TBT 0 ms; CLS 0; interacción observada ~101 ms. |
| Módulos y material | Snapshot | Accesibilidad 100, buenas prácticas 100. |

- [Captura del resultado privado](evidencia/lighthouse-authenticated-timespan.png).
- [Reporte timespan](evidencia/lighthouse-uc-authenticated-timespan.html), [flujo completo](evidencia/lighthouse-uc-authenticated-flow.html), [captura de la página](evidencia/lighthouse-authenticated-page.png).
- El valor de interacción procede de **una interacción**, no de INP de usuarios reales.
- El tiempo 1633 ms incluye espera de red inactiva; no equivale a LCP.
- No comparar el score performance del timespan con el de navegación pública: sus métricas y pesos difieren.
- Los snapshots no miden rendimiento de carga. El generador muestra score performance 0 sin métricas; no se interpreta como fallo ni como medición comparable.

## Core Web Vitals y reporte por PR

Medición **22/11/2026** del [PR #333](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/333).
Su workflow construye `dev` y el PR con la misma configuración, los mide en el mismo
runner y [comenta la comparación](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/333#issuecomment-7082528370).
Lighthouse 13.6.0, Chrome 157, perfil móvil simulado y mediana de 5 corridas.
Datos: [dev](evidencia/cwv-ci-dev.json) y [PR](evidencia/cwv-ci-pr.json). La interfaz no cambia.

| Métrica | Qué mide | Resultado (PR) | Escenario |
| --- | --- | --- | --- |
| LCP | Cuándo aparece el contenido principal | 1,06 s, bueno | Login UC móvil |
| LCP | Ídem | 3,19 s, mejorable | Portal público: el título se pinta tras hidratar |
| INP | Respuesta a teclado y clics reales | 44 ms, bueno | Login UC móvil, timespan de Lighthouse |
| INP | Ídem, con `web-vitals` | 32 ms, bueno | Sesión de estudiante local, login → curso ([5 muestras](evidencia/cwv-sesion-local.json)) |
| CLS | Desplazamientos inesperados | 0,022, bueno | Login UC móvil: el aviso inferior se acomoda |

- TBT (107 ms en el login) se informa aparte como métrica de laboratorio; no reemplaza a INP.
- Todo es laboratorio: un guion, no usuarios. AcademiX no recolecta métricas de campo.
- La sesión local usa backend Docker y localhost; no mide red ni cold start de producción.
- El reporte también compara JS del cliente (754 kB gzip), axe-core (0 violaciones) y puntajes.

## Disponibilidad y límites

El primer acceso API tardó ~27 s; la lectura posterior dio health 171 ms y ready
199 ms. [Datos completos](evidencia/endpoints.json), [warm](evidencia/warm-cors.json).
Lighthouse del login no mide el coste de despertar la API ni la corrección de notas.
No hay prueba de carga, disponibilidad continua ni métricas de campo. Desde el PR #333
cada PR compara su frontend con `dev`; antes no hay histórico ni se inventa un «antes».

## Reproducción mínima

Usar la misma versión de Lighthouse y navegador; anotar fecha, URL, dispositivo y estado
del servicio. Instalar herramientas en un directorio temporal, no como dependencia del LMS.

```bash
pnpm --dir /tmp/academix-e4-lighthouse exec lighthouse \
  https://uc.academix.dvillasc.me/login \
  --output=html --output=json --output-path=/tmp/academix-login-mobile
```

Para desktop añadir `--preset=desktop`. Para la sesión privada: login real,
snapshot de cursos, timespan al hacer clic en el curso y snapshot de módulos;
guardar el flujo sin headers, cuerpos de login ni tokens. No usar refresh ni persistir JWT.
