# Fichas GRADE · 04

[Índice GRADE](GRADE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-grade-016"></a>

## E2E-GRADE-016 — Rango precisión y tipo de ponderación

- Módulo / flujo: GRADE; [FL-GRADE-03](../audit/FLOWS.md#fl-grade-03).
- Requisito: CU-10; RF21/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [gradebook.service.ts](../../../backend/src/gradebook/gradebook.service.ts); [grading.ts](../../../backend/src/attempts/grading.ts); [course-gradebook.tsx](../../../frontend/src/components/gradebook/course-gradebook.tsx); [grade-publication.tsx](../../../frontend/src/components/gradebook/grade-publication.tsx); [weights-form.tsx](../../../frontend/src/components/gradebook/weights-form.tsx).
- Objetivo: Rango precisión y tipo de ponderación; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: borde,contrato.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WEIGHTS; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/gradebook`; `updateGradebookWeights; listCourseGradeItems; getCourseGradebook`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. PUT pesos -0.01/100.01/0.001/string/null.
2. Enviar0 y100 con total100.
3. Consultar.

- Interfaz esperada: Inválidos rechazados;0 permitido.
- API esperada: 400 rangos/tipo/decimales;200 valores válidos.
- Persistencia / consistencia: Sin truncar ni normalizar peso inválido.
- Denegación: No aceptar NaN por cuerpo JSON no válido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F5](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).

<a id="e2e-grade-017"></a>

## E2E-GRADE-017 — Ajustar ponderaciones con notas publicadas

- Flujo FL-GRADE-03. CU-10/12, RF21/26 y RNF3. Docente AO en UC.
- Publicar las notas de dos quizzes y consultar el promedio del estudiante.
- En el editor, cambiar los pesos, confirmar el recálculo y guardar.
- El promedio cambia y las notas individuales conservan sus valores.
- Nivel regression. [Decisión de cálculo](../../adr/gradebook-groups-and-revisions.md).

<a id="e2e-grade-018"></a>

## E2E-GRADE-018 — Publicación y corrección en móvil

- Flujos FL-GRADE-03/04. CU-10/11/12/16, RF21–26/29 y RNF3.
- En 390 px, abrir el editor y verificar que el diálogo cabe en el viewport.
- Publicar un quiz en una sección. Conservar otra nota registrada y oculta.
- Corregir a 0,9 de 1 punto y comprobar que la vista previa y el resultado
  publicado muestran 90 % y nota 6,3. El motivo queda en Auditoría.
- Los avisos flotantes permiten cierre manual y conservan la altura de la cabecera.
- Los intentos son idénticos antes y después. Nivel regression.

<a id="e2e-grade-019"></a>

## E2E-GRADE-019 — Guardado obsoleto tras otra edición

- Flujo FL-GRADE-03. CU-10, RF26 y RNF3. Docente AO en UC.
- Abrir el editor, guardar otra configuración por API y enviar el borrador.
- La API devuelve 409. La interfaz ofrece cargar la configuración vigente.
- Nivel extended.

<a id="e2e-grade-020"></a>

## E2E-GRADE-020 — Conciliar el guardado de grupos tras pérdida de respuesta

- Flujo FL-GRADE-03. CU-10, RF26 y RNF3. Docente AO en UC.
- Guardar grupos y descartar la respuesta después del commit real.
- El editor comprueba automáticamente el plan guardado y cierra el diálogo.
- Un PUT y un evento de auditoría. Nivel extended.
