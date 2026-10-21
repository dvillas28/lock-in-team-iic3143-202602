# Definición de proveedor, seguridad y criterios para el Bot PR Reviewer

Fecha: 2026-10-11

## Estado

Propuesto para revisión del equipo (Tarea PREP-07 / Issue #23).

## Contexto

El plan de trabajo de la Entrega 3 contempla la incorporación de un bot automatizado que revise los Pull Requests del equipo en GitHub (`PREP-07`, `CI-09`, `CI-11`, `CI-13`, `CI-14`).

El objetivo es automatizar la detección temprana de riesgos críticos en el código antes de la revisión humana, enfocado en el dominio de AcademiX: aislamiento multi-tenant, permisos según rol académico, consistencia de notas y cobertura de pruebas.

Asimismo, la matriz de riesgos del proyecto ([07-risks.md](../deliveries/2/07-risks.md)) identifica el riesgo **R-16: "Bot PR reviewer genera ruido o bloquea flujo"**, lo que exige definir una integración no obstructiva, con reglas claras y mínimo privilegio en permisos.

## Decisión

### 1. Proveedor y Modelo de IA

Se adopta una integración **nativa y liviana basada en GitHub Actions + LLM API**, descartando plataformas SaaS externas cerradas (como CodeRabbit o servicios de pago) para mantener el repositorio *stack-light* y sin dependencias operacionales externas.

- **Proveedor principal:** Google Gemini API (modelo `gemini-2.5-flash` o `gemini-1.5-flash`).
- **Alternativas soportadas:** OpenAI API (`gpt-4o-mini` / `gpt-4o`) o Anthropic API (`claude-3-5-haiku` / `claude-3-5-sonnet`).
- **Mecanismo de ejecución:**
  - Un job en GitHub Actions que extrae el `git diff` contra la rama destino (`main` o `dev`).
  - Un script ligero en `.github/scripts/pr-reviewer.mjs` (ejecutado con Node.js 24 ya disponible en el runner) que estructura el prompt, consulta la API del LLM y publica los comentarios mediante el GitHub CLI (`gh pr comment`) o la API REST de GitHub.
- **Comparación de alternativas evaluadas:**

| Criterio | Google Gemini 1.5/2.5 Flash | OpenAI GPT-4o-mini | Anthropic Claude 3.5 Haiku / Sonnet | GitHub Models (Preview) |
| :--- | :--- | :--- | :--- | :--- |
| **Costo y acceso** | **Gratuito en AI Studio** (sin requerir tarjeta de crédito para uso estándar). | Pago por uso (requiere cargar saldo prepago con tarjeta). | Pago por uso (requiere cargar saldo prepago con tarjeta). | Gratuito en preview público (sujeto a cuotas por usuario). |
| **Ventana de contexto** | **1.000.000 tokens** (permite diffs completos sin recortar). | 128.000 tokens. | 200.000 tokens. | 128.000 tokens. |
| **Latencia / Velocidad** | Muy baja (~1–3 s). | Muy baja (~1–3 s). | Baja (~2–4 s en Haiku). | Variable según runner y cuota. |
| **Compatibilidad** | API REST simple (`fetch`) y SDK oficial `@google/genai`. | Estándar de facto en la industria y librerías open-source. | API REST y SDK `@anthropic-ai/sdk`. | Integrado directamente con tokens de GitHub. |
| **Evaluación para AcademiX** | **Recomendado por defecto:** Cero costo para el equipo estudiantil y contexto suficiente para PRs extensos. | **Excelente alternativa:** Adopción inmediata si algún miembro del equipo cuenta con saldo en OpenAI. | **Recomendado por máxima precisión:** Mejor adherencia a reglas estrictas si el equipo cuenta con saldo en Anthropic. | Alternativa futura cuando salga de preview. |

- **Diseño agnóstico:**
  La implementación en el script `.github/scripts/pr-reviewer.mjs` mantendrá una estructura desacoplada del proveedor: el consumo se realizará mediante una solicitud HTTP estándar (`fetch`), de modo que alternar entre Gemini, OpenAI o Anthropic solo requiera cambiar la URL del endpoint y la variable de entorno del secreto (`GEMINI_API_KEY`, `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`), sin reescribir la lógica de revisión.

---

### 2. Permisos del Token y Seguridad

Para mitigar riesgos de seguridad y respetar el principio de mínimo privilegio (*least privilege*):

- **Permisos del `GITHUB_TOKEN`:**
  ```yaml
  permissions:
    contents: read          # Solo lectura para clonar el repositorio y obtener el diff
    pull-requests: write    # Escritura para publicar comentarios o reviews en el PR
    issues: write           # Escritura para interactuar con el hilo del PR
  ```
- **Restricciones de seguridad estrictas:**
  - Se prohíben permisos de escritura sobre el código (`contents: write` denegado) para evitar que una potencial inyección en el prompt o código externo intente alterar ramas.
  - El trigger del workflow será exclusivamente `on: pull_request` sobre ramas internas del repositorio (`main`, `dev`).
- **Filtros de ejecución y exclusión de bots:**
  - Se excluyen PRs generados por herramientas automáticas para evitar consumo innecesario de cuota y ruido:
    `if: github.actor != 'dependabot[bot]' && !endsWith(github.actor, '[bot]')`.
- **Filtro de archivos en el `git diff` (optimización de tokens y reducción de ruido):**
  - El script extraerá únicamente diffs de archivos de código fuente, excluyendo archivos ruidosos o no analizables lógicamente:
    - Lockfiles (`pnpm-lock.yaml`, `package-lock.json`).
    - Archivos binarios y multimedia (`.png`, `.jpg`, `.svg`, `.ico`, `.pdf`).
    - Artefactos estáticos de mockups o builds compilados.
- **Gestión de credenciales:**
  - La clave de la API del proveedor se almacena como secreto de repositorio en GitHub: `GEMINI_API_KEY` (o `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`).
  - Ninguna credencial ni endpoint sensible se versiona en el código.

---

### 3. Criterios de Revisión adaptados de `lms-reviewer` y Arquitectura AcademiX

El bot tomará como base directa las reglas de la skill local [`.agents/skills/lms-reviewer/SKILL.md`](../../.agents/skills/lms-reviewer/SKILL.md) y los ADRs vigentes del proyecto (`CI-11`). Evaluará los siguientes ejes obligatorios:

1. **Aislamiento Multi-Tenant (Crítico):**
   - **Regla Path vs. Body:** La institución se resuelve exclusivamente desde el path HTTP (`/api/v1/institutions/{institutionSlug}/...`). **El frontend o cliente jamás debe enviar `institution_id` en el body** de los requests académicos; el backend debe inyectarlo a partir de la institución resuelta y validada.
   - **Alcance de consultas:** Toda consulta o mutación tenant-owned debe aplicar el filtro de institución correspondiente. Alerta máxima ante posibles fugas entre instituciones (UC vs. UTFSM).
   - **Modelo de persistencia:** Toda tabla o entidad académica tenant-owned debe incluir la columna `institution_id` y restricciones/FKs compuestas cuando corresponda.
2. **Control de Roles y Autorización (Crítico):**
   - El backend debe validar una `InstitutionMembership` activa antes de autorizar permisos de curso o sección.
   - Validar permisos por operación y alcance: `coordinator` a nivel de curso; `teacher`, `assistant` y `student` a nivel de sección.
   - Prohibir incompatibilidades de rol (ej. quien tenga acceso a la pauta de corrección no puede rendir ese quiz como estudiante).
3. **Auditoría Inmutable (`AuditEvents`) (Requisito Constitucional):**
   - Toda mutación académica crítica (publicación de notas, cancelación de intentos de quiz, cambios de ponderación, modificaciones de membresías o roles) **debe emitir un `AuditEvent` inmutable y sanitizado en la misma transacción de base de datos** (`logEvent(...)`).
   - Alertar si una operación de cambio de estado omite el registro de auditoría.
4. **Flujos Académicos y Consistencia de Calificaciones:**
   - **Cálculo en Backend:** La escala y los promedios parciales/finales se calculan exclusivamente en el backend; el cliente no realiza cálculos oficiales.
   - **Congelamiento de ponderaciones:** Tras la primera nota publicada de un curso, se bloquea la creación de nuevos ítems evaluativos y cualquier alteración de ponderaciones.
   - **Pauta protegida:** La pauta de corrección jamás se expone en endpoints accesibles para estudiantes y no puede modificarse una vez que existan intentos iniciados.
   - **Intentos y estados terminales:** Los intentos cancelados o notas publicadas son terminales e inmutables (no se reabren ni sobrescriben).
5. **Presencia de Pruebas Automatizadas:**
   - Cambios en endpoints, lógica de negocio o esquemas deben incluir tests unitarios o pruebas de integración que verifiquen el aislamiento y las fronteras de seguridad.
6. **Complejidad y Filosofía Stack-Light:**
   - Señalar dependencias, frameworks, cachés o abstracciones no justificadas por los requerimientos inmediatos del proyecto.

- **Borrador de System Prompt propuesto (plantilla para el script):**

  ```text
  Eres el revisor automatizado de Pull Requests para AcademiX, una plataforma universitaria LMS multi-tenant.
  Tu misión es auditar riesgos críticos de arquitectura, aislamiento, roles, auditoría y consistencia antes de la revisión humana.

  REGLAS DE REVISIÓN ESTRICTAS:
  1. AISLAMIENTO MULTI-TENANT (CRÍTICO):
     - La institución se resuelve exclusivamente desde el path URL (/api/v1/institutions/{slug}/...). Alerta si un endpoint o DTO recibe 'institution_id' en el body desde el cliente.
     - Toda consulta, mutación y entidad tenant-owned debe incluir y filtrar por 'institution_id'. Bajo ninguna circunstancia permitas mezclar datos entre instituciones (ej. UC vs. UTFSM).
  2. CONTROL DE ROLES (CRÍTICO):
     - Exige validación de 'InstitutionMembership' activa y permisos específicos según alcance (coordinador en curso; docente/ayudante/estudiante en sección).
     - Prohíbe que usuarios con acceso a la pauta de un quiz puedan rendirlo como estudiantes.
  3. AUDITORÍA INMUTABLE (CRÍTICO):
     - Operaciones críticas (publicar o modificar notas, cancelar intentos de quiz, alterar membresías o ponderaciones) DEBEN registrar un AuditEvent inmutable y sanitizado en la misma transacción de DB.
  4. CONSISTENCIA ACADÉMICA Y CALIFICACIONES (ALTO):
     - Cálculo de notas y promedios DEBE ocurrir en backend, nunca en frontend.
     - Bloquea cambios de ponderaciones o creación de ítems si ya existe una nota publicada en el curso.
     - La pauta de corrección jamás debe exponerse a estudiantes ni modificarse si ya hay intentos iniciados.
     - Notas publicadas e intentos cancelados son terminales e inmutables.
  5. TESTS (ALTO):
     - Exige tests unitarios o de integración ante cambios en lógica de dominio, endpoints o aislamiento.
  6. STACK-LIGHT (MEDIO):
     - Alerta si se introducen dependencias o abstracciones no justificadas por el requerimiento actual.

  REGLAS DE FORMATO Y PREVENCIÓN DE RUIDO (ESTRICTO):
  - NO comentes sobre estilo, indentación, formato, comillas ni orden de imports (ESLint y Prettier ya se encargan).
  - Si NO detectas observaciones relevantes, responde ÚNICAMENTE con:
    ✅ **AcademiX Bot Reviewer:** No se detectaron observaciones de aislamiento multi-tenant, roles, auditoría ni consistencia académica en este diff.
  - Si detectas observaciones, repórtalas estructuradas de mayor a menor severidad:
    - `[CRÍTICO|ALTO|MEDIO]` `ruta/al/archivo:línea`: Explicación concisa del riesgo y sugerencia de corrección según la arquitectura de AcademiX.
  ```

### 4. Mitigación de Ruido y Modo de Operación (Riesgo R-16)

Para evitar que el bot entorpezca el flujo de desarrollo del equipo:

- **Modo informativo no bloqueante:**
  - El check del bot se ejecuta con `continue-on-error: true` o como un job informativo.
  - Una falla técnica de la API del LLM o una observación del bot **nunca impedirá el merge** de un PR. La aprobación humana sigue siendo el único criterio vinculante.
- **Política de comentario único por PR (actualización vs. duplicación):**
  - Para evitar saturar el PR con múltiples comentarios cuando el autor hace nuevos commits (`push`), el script buscará si ya existe un comentario emitido por el bot identificado con un marcador HTML oculto (`<!-- academix-pr-reviewer -->`).
  - Si ya existe, el bot **editará el comentario existente** con el análisis actualizado del último commit; si no existe, publicará el comentario inicial.
- **Filtro anti-ruido (No cosmético):**
  - El prompt instruye explícitamente al LLM: *"Ignorar cuestiones de formato, indentación, estilo o comentarios cosméticos, ya que son cubiertos por ESLint y Prettier en el CI."*
- **Formato de salida conciso:**
  - Si no se detectan problemas relevantes: publica un único comentario corto de aprobación (ej: `✅ Sin observaciones de aislamiento, roles ni consistencia en este diff`).
  - Si hay observaciones: lista priorizada por severidad (`[CRÍTICO]`, `[ALTO]`, `[MEDIO]`, `[BAJO]`), indicando siempre ruta de archivo y número de línea con sugerencia accionable.

## Consecuencias

- **Habilita `CI-09`:** Base definida para implementar el workflow `.github/workflows/pr-reviewer.yml` y el script consumidor de la API.
- **Habilita `CI-11` y `CI-13`:** Reglas estructuradas para calibrar prompts y eliminar falsos positivos observados durante los primeros PRs del equipo.
- **Evidencia para E3 y E4:** Cumple con la documentación requerida para la justificación de herramientas automáticas de calidad en las entregas académicas.
