# Revisión automática de PR y calibración manual

Corte del 21/11/2026 antes de actualizar #331. Daniel Fierro figura como responsable de #173 y #203.

## Alcance observado · #203

Desde la incorporación del workflow (#157, 29/10 a las 18:30:01 UTC), **59 PR** de los cinco integrantes se abrieron contra `dev` o `main`. Encontramos un run del reviewer con el SHA final consultado en **58/59** y un comentario identificable en **28/59**. El comentario puede corresponder a una revisión anterior de la misma PR. [Conciliación por PR con enlaces](evidencia/reviewer-pr.csv).

Consultamos PR abiertas y cerradas, runs paginados del workflow y comentarios paginados con el marcador `<!-- academix-pr-reviewer -->`. La asociación usa SHA y número de PR cuando Actions lo entrega. #246 carece de coincidencia para el SHA consultado. En #330, el job terminó con éxito tras errores 503/404 de los proveedores y sin comentario visible. [PR #246](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/246) · [run #330](https://github.com/dvillas28/lock-in-team-iic3143-202602/actions/runs/44114071728).

El workflow atiende apertura, actualización y reapertura en esas dos ramas y excluye actores bot. El script omite lockfiles y diversos archivos binarios, recorta el diff a 100.000 caracteres y actualiza un comentario por PR. La revisión humana sigue siendo obligatoria. [Workflow](../../../../.github/workflows/pr-reviewer.yml) · [implementación](../../../../.github/scripts/pr-reviewer.mjs).

## Calibración · #173

Se eligió una observación repetida en tres cambios de dominio y se cotejó la ruta denunciada con OpenAPI. La unidad de análisis es la observación sobre el prefijo.

| PR | Observación del bot | Contraste y dictamen |
| --- | --- | --- |
| [#238, invitaciones](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/238#issuecomment-6728121581) | Marca crítico el singular en el controlador. | El contrato declara `/api/v1/institution/{institutionSlug}/invitations`. Falso positivo. |
| [#252, calificaciones](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/252#issuecomment-6754380628) | Afirma que el patrón singular de la API excluye el prefijo requerido. | El libro y sus publicaciones tienen prefijo singular. Falso positivo sobre esa supuesta discrepancia. |
| [#320, calendario](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/320#issuecomment-6871695889) | Pide cambiar el controlador a plural. | El contrato del calendario usa singular. Falso positivo. |
| [#326, aviso del calendario](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/326#issuecomment-6901584227) | Comentario sin observaciones. | Confirma que hubo respuesta publicada. La sensibilidad requiere otra prueba. |

**Resultado:** tres falsas alarmas entre tres observaciones seleccionadas por ese patrón. La instrucción del reviewer especifica erróneamente el plural. La selección intencional impide estimar la tasa general de falsos positivos. Las demás observaciones de esas PR requieren evaluación independiente. [Contrato](../../../reference/openapi/openapi.yaml) · [instrucción vigente](../../../../.github/scripts/pr-reviewer.mjs).

Queda pendiente en #173 ajustar la referencia al contrato y verificarla con casos de regresión en una PR separada. Mantener la comprobación de pertenencia institucional y la prohibición de elegir tenant mediante el cuerpo. #203 conserva la brecha de cobertura efectiva por PR.
