# Quickstart: Validar el polish del feedback E2

Guía reproducible; [resultados locales](../../docs/backend/feedback-e2-validation.md)
registran pruebas/exportaciones ejecutadas. No acredita despliegue. Ver [contrato](contracts/feedback-e2.md).

## 1. Fuente, corte y atribución (US1)

- Verificar celdas C6/D6/E6/F6/G6 en la planilla original contra la matriz.
- Confirmar fecha/commit/hash y límites de inspección en
  `docs/deliveries/2/15-feedback-e2.md`; conservar el bloque histórico.
- Para cada ID, localizar evidencia previa en el commit de corte y distinguir
  presente en código, prueba histórica, ejecución nueva y entorno desplegado.
- Registrar cambios nuevos en sección posterior, con clase, responsable vigente,
  commit/PR, resultado y limitación. No atribuir trabajo previo al polish.

## 2. Modelos y roles (US2)

Comparar dominio/UML, ER, catálogo y diagramas de informe/PPT. Cada relación
representada debe tener mínimos/máximos en ambos extremos y regla verificable.
Comprobar especialmente identidad/membership, propiedad de curso, matrículas
con varios roles, Quiz con sección opcional y eventos operativos sin actor/curso.
Corregir relaciones obsoletas; no basta con rotular flechas equivocadas.

role ya usa CHECK de dominio cerrado. Revisar que catálogos/contrato expongan
teacher/student/assistant y justificar la decisión sin inventar enum físico.
Ejecutar prueba existente o añadir una aserción de rechazo si no cubre valor
inválido; no duplicar un test que ya prueba el mismo límite.

## 3. Administración y cuentas (US3)

Reutilizar Node 24, pnpm 9.15.9 y PostgreSQL 17. Instalar desde lockfiles si hace
falta. Inyectar TEST_DATABASE_URL operativa y TEST_RUNTIME_DATABASE_URL runtime
en la misma DB descartable `_test`; las fixtures recrean public. No usar DB compartida.

Desde la raíz, con credenciales de prueba configuradas sin imprimirlas:

```bash
pnpm --dir backend build
pnpm --dir backend exec node --test --test-concurrency=1 test/integration/courses-write.test.mjs test/integration/membership-admin.test.mjs test/integration/onboarding.test.mjs test/integration/demo-migration.test.mjs test/integration/enrollments.test.mjs
```

Esperado: creación/delegación autorizadas, rechazo de actor o institución ajena,
role inválido rechazado, provisión inicial atómica y replay sin restaurar permisos
o credenciales. Si la suite no cubre un criterio, añadir solo el caso faltante.
Verificar dataset contra demo-manifest y separar seed académico de identidades.
La guía de entrega debe explicar que no hay alta general/signup en tenant existente;
onboarding no debe usarse para fingir esa capacidad.

## 4. Privacidad asociada (US4)

Seguir [quickstart-audit.md](quickstart-audit.md): regresión antes/después,
revocaciones, filtros/páginas, scope docente y cero escrituras. Revocar teacher
antes de rendir; preparar historia independiente para el cursor previo.
Conservar auditoría administrativa owner y seguimiento assistant existente.

## 5. Arquitectura y formatos (US5 + cierre documental)

Comparar diagrama con render.yaml y ADR vigente. Mantener separado configurado,
comprobado localmente y verificado remotamente. HAProxy/HA/pooling externos no
se muestran como capacidades actuales sin evidencia. No se despliega para este polish.

El catálogo XLSX se edita manualmente; revisar tipos, relaciones y restricciones
contra DDL. Para Mermaid, usar comandos de exportación existentes en
`docs/deliveries/2/data-catalog/README.md`; no incorporar un generador nuevo.
Las fuentes TeX existentes indican pdfLaTeX. Con herramientas disponibles:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error -cd docs/deliveries/2/report/main.tex
latexmk -pdf -interaction=nonstopmode -halt-on-error -cd docs/deliveries/2/ppt/main.tex
```

Revisar visualmente PDFs/SVG: cardinalidades legibles, sin cortes, diagrama y
campos coherentes con fuentes. No versionar aux/log ni presentar PDF anterior
como regenerado. Si falta una herramienta, registrar bloqueo y no cerrar tarea.
Revisar longitud de Markdown modificado: reducir/split 04-architecture.md y
reducir o justificar 150–200 líneas en otros documentos antes de validar CI.

## 6. Checks y evidencia final

Las suites backend se ejecutan en serie; no compilar mientras corre integración.
Después de pruebas focalizadas, ejecutar checks completos de auditoría, OpenAPI,
consumidor y cobertura indicados en la guía focalizada. Para documentos:

```bash
python3 .github/scripts/check-doc-length.py --self-test
python3 .github/scripts/check-doc-length.py
git diff --check
```

Registrar en `docs/backend/feedback-e2-validation.md` fuente/corte, siete IDs,
FR-011–020/SC-006–010, revisión de formatos y comandos/versiones/resultados.
La evidencia de auditoría cubre FR-001–010/SC-001–005 y queda enlazada, no duplicada.
Actualizar solo sección posterior de la matriz; guardar pendientes sin claims de cierre.
Riesgos y planificación conservan valoración positiva y responsables vigentes.
