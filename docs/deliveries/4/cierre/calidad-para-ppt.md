# Calidad — Contenido listo para 2 diapositivas E4

Este contenido atiende #212 y el feedback E3. La integración visual al PPT/PDF
permanece en #208. Referencias extensas y límites se dejan en anexos.

## Slide 1 · Qué mejoró y cómo lo verificamos

| Dimensión | Antes | Después | Evidencia |
| --- | --- | --- | --- |
| SonarQube | 25 issues | 0 issues; gate OK; cobertura global reportada 91,7 % | [Auditoría y commits](../sonarqube/README.md). |
| Trivy repositorio | 3 MEDIUM y 2 LOW de configuración | 0 hallazgos en el alcance auditado | [Auditoría y alcance](../trivy/README.md). |
| Trivy imágenes | Backend 4 MEDIUM; frontend 1 MEDIUM | 0 hallazgos en ambas imágenes auditadas | Mismo informe Trivy. |
| Flujo y aislamiento | Requerían comprobación final | E2E extended aprobado sobre `7d4b666`; 527 instancias en tres navegadores | [Run 16/11](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/43852844221). |

**Mensaje oral:** las mejoras son correcciones verificadas sobre cortes identificados,
no una afirmación de ausencia de defectos. Usamos pruebas de integración con PostgreSQL,
RLS y permisos por rol, pruebas frontend y E2E. CI/review complementan esas capas.

**Límites para explicar si preguntan:** Trivy omite dependencias de desarrollo en este
alcance; el informe registra hallazgos al incluirlas. Sonar conserva cuatro supresiones
justificadas de accesibilidad. No atribuir 91,7 % a una medición nueva del 21/11.
Los análisis no son todos del mismo SHA: conservar commits y fechas de cada tabla fuente.

**CI no está completamente verde:** en el [run de #329](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/43773395044), `CI result`, integración/coverage y frontend aprobaron, pero **SonarCloud quality gate falló**. No confundir el gate de la auditoría manual con el de SonarCloud en esa PR. [API del gate](evidencia/sonarcloud-pr329-gate.json): mantenibilidad nueva rating D (4), exigida A (1); cobertura nueva 90,9 % supera 80 %, fiabilidad y seguridad A. [Consulta de issues](evidencia/sonarcloud-pr329-issues.json): 99 hallazgos abiertos en ese corte. Pendiente resolver o explicar la diferencia de análisis/perfil; no extrapolar «0 issues» manuales a SonarCloud.

## Slide 2 · Rendimiento y operación del producto

- **Lighthouse móvil UC:** mediana de tres muestras, performance 100, accesibilidad 100,
  LCP 1,05 s, TBT 47 ms, CLS 0. [Captura](evidencia/lighthouse-login-mobile.png).
- **Vista autenticada:** navegación cursos → módulos sin perder sesión; 1,63 s hasta
  red inactiva, TBT 0, CLS 0 e interacción observada ~101 ms. No equivale a métricas de campo.
- **Producto remoto comprobado:** UC/UTFSM, nota automática 7,0, ocultación previa,
  publicación, promedio, auditoría, aislamiento y archivo descargado con bytes idénticos.
- **Riesgo operativo concreto:** primer acceso API ~27 s; warm health 171 ms y ready
  199 ms. Abrir/verificar los servicios antes de exponer y ensayar respaldo local.

**Mensaje oral:** el login rápido no demuestra el rendimiento de toda la aplicación;
por eso medimos también un recorrido privado y probamos el ciclo remoto por API.
Las capturas Lighthouse muestran buenas prácticas 96 por `/favicon.ico` 404.
No se afirma mejora histórica de Lighthouse: no existe un «antes» comparable.

## Anexos disponibles

- [Rendimiento: método, HTML/JSON y límites](rendimiento.md).
- [Operación: pruebas, datos, riesgos y guion](operacion-demo.md).
- [Alcance y capacidad demostrada](alcance-final.md).
- [SonarQube](../sonarqube/README.md), [Trivy](../trivy/README.md), [workflow CI](../../../../.github/workflows/ci.yml).
- Feedback de Tom: commits y PRs en español, según la [guía vigente](../../../guides/git-flow.md).
