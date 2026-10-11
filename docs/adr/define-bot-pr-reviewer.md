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
- **Alternativa / Fallback:** OpenAI API (`gpt-4o-mini`).
- **Mecanismo de ejecución:**
  - Un job en GitHub Actions que extrae el `git diff` contra la rama destino (`main` o `dev`).
  - Un script ligero en `.github/scripts/pr-reviewer.mjs` (ejecutado con Node.js 24 ya disponible en el runner) que estructura el prompt, consulta la API del LLM y publica los comentarios mediante el GitHub CLI (`gh pr comment`) o la API REST de GitHub.
- **Comparación de alternativas evaluadas:**

| Criterio | Google Gemini 1.5/2.5 Flash | OpenAI GPT-4o-mini | Anthropic Claude 3.5 Haiku | GitHub Models (Preview) |
| :--- | :--- | :--- | :--- | :--- |
| **Costo y acceso** | **Gratuito en AI Studio** (sin requerir tarjeta de crédito para uso estándar). | Pago por uso (requiere cargar saldo prepago con tarjeta). | Pago por uso (requiere cargar saldo prepago con tarjeta). | Gratuito en preview público (sujeto a cuotas por usuario). |
| **Ventana de contexto** | **1.000.000 tokens** (permite diffs completos sin recortar). | 128.000 tokens. | 200.000 tokens. | 128.000 tokens. |
| **Latencia / Velocidad** | Muy baja (~1–3 s). | Muy baja (~1–3 s). | Baja (~2–4 s). | Variable según runner y cuota. |
| **Compatibilidad** | API REST simple (`fetch`) y SDK oficial `@google/genai`. | Estándar de facto en la industria y librerías open-source. | API REST y SDK `@anthropic-ai/sdk`. | Integrado directamente con tokens de GitHub. |
| **Evaluación para AcademiX** | **Recomendado:** Cero costo para el equipo estudiantil y contexto suficiente para PRs extensos. | **Excelente alternativa:** Adopción inmediata si algún miembro del equipo cuenta con saldo en OpenAI. | Descartado inicialmente por mayor costo y requerimiento de tarjeta. | Alternativa futura cuando salga de preview. |

- **Diseño agnóstico:**
  La implementación en el script `.github/scripts/pr-reviewer.mjs` mantendrá una estructura desacoplada del proveedor: el consumo se realizará mediante una solicitud HTTP estándar (`fetch`), de modo que cambiar entre Gemini y OpenAI solo requiera alternar la URL del endpoint y la variable de entorno del secreto (`GEMINI_API_KEY` o `OPENAI_API_KEY`), sin reescribir la lógica de revisión.

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
- **Gestión de credenciales:**
  - La clave de la API del proveedor se almacena como secreto de repositorio en GitHub: `GEMINI_API_KEY`.
  - Ninguna credencial ni endpoint sensible se versiona en el código.

---

### 3. Criterios de Revisión adaptados de `lms-reviewer`

El bot tomará como base directa las reglas definidas en la skill local [`.agents/skills/lms-reviewer/SKILL.md`](../../.agents/skills/lms-reviewer/SKILL.md). El system prompt evaluará los siguientes ejes obligatorios:

1. **Aislamiento Multi-Tenant (Prioridad P0 - Bloqueante lógico):**
   - Verificar que toda consulta, mutación o endpoint filtre obligatoriamente por el scope institucional (`institution_id` / slug de institución).
   - Alertar inmediatamente si existe riesgo de fuga de datos entre instituciones (ej. UC vs UTFSM).
2. **Control de Roles y Autorización (Prioridad P0):**
   - Verificar que los endpoints validen el rol académico (`STUDENT`, `PROFESSOR`, `ADMIN`) en el contexto de la institución y sección antes de permitir mutaciones.
3. **Flujos Académicos y Consistencia de Datos (Prioridad P1):**
   - Asegurar que transacciones de notas, intentos de quiz y publicaciones no generen inconsistencias, estados huérfanos o carreras.
   - Respetar decisiones previas del proyecto (ej. intentos de quiz cancelados como estado terminal, notas inmutables tras publicación).
4. **Presencia de Pruebas Automatizadas (Prioridad P1):**
   - Verificar que los cambios en lógica de negocio o endpoints vengan acompañados de sus respectivos tests automatizados.
5. **Complejidad Justificada (Prioridad P2):**
   - Señalar nuevas dependencias o abstracciones no justificadas por el alcance inmediato.

---

### 4. Mitigación de Ruido y Modo de Operación (Riesgo R-16)

Para evitar que el bot entorpezca el flujo de desarrollo del equipo:

- **Modo informativo no bloqueante:**
  - El check del bot se ejecuta con `continue-on-error: true` o como un job informativo.
  - Una falla técnica de la API del LLM o una observación del bot **nunca impedirá el merge** de un PR. La aprobación humana sigue siendo el único criterio vinculante.
- **Filtro anti-ruido (No cosmético):**
  - El prompt instruye explícitamente al LLM: *"Ignorar cuestiones de formato, indentación, estilo o comentarios cosméticos, ya que son cubiertos por ESLint y Prettier en el CI."*
- **Formato de salida conciso:**
  - Si no se detectan problemas relevantes: publica un único comentario corto de aprobación (ej: `✅ Sin observaciones de aislamiento, roles ni consistencia en este diff`).
  - Si hay observaciones: lista priorizada por severidad (`[CRÍTICO]`, `[ALTO]`, `[MEDIO]`, `[BAJO]`), indicando siempre ruta de archivo y número de línea con sugerencia accionable.

## Consecuencias

- **Habilita `CI-09`:** Base definida para implementar el workflow `.github/workflows/pr-reviewer.yml` y el script consumidor de la API.
- **Habilita `CI-11` y `CI-13`:** Reglas estructuradas para calibrar prompts y eliminar falsos positivos observados durante los primeros PRs del equipo.
- **Evidencia para E3 y E4:** Cumple con la documentación requerida para la justificación de herramientas automáticas de calidad en las entregas académicas.

