# Manifest: actores y entidades

Toda variante de test recibe su propio conjunto de actores. Sufijo del namespace evita colisiones.
No nombres/correos de producción. `BASE` denota presencia de relaciones, no estado mutable compartido.
Flags y roles se consultan en /me y se revalidan en API en cada operación.

## Actores UC (todos User/membership activos salvo indicación)

| Alias | Flags / roles / scope | Uso |
| --- | --- | --- |
| ANON | Sin token | Portal/login/denegación401 |
| SA | isSuperAdmin true, isAdmin false, sin Enrollment | Delegar; no academia |
| AO | isAdmin true, dueño C1/C2, teacher solo S1 | Expansión por ownership+teacher |
| AO-ONLY | En su variante es dueño isAdmin sin roles C1 | Administrativos sí; academia no |
| AO-ST | En su variante dueño isAdmin y student S1, sin teacher | Privacidad grade audit |
| AX | isAdmin true, dueño C3, sin roles C1 | Admin ajeno |
| T1 | teacher S1, no admin, también teacher C2/S21 | Autoría/sección propia, curso padre incoherente |
| T2 | teacher S2, no admin | Contenido compartido, sección histórica |
| AS1 | assistant S1 | Seguimiento sin pauta ni escritura |
| ST1 | student S1 | Propietario de intentos/notas, elegible para Q1 |
| ST2 | student S2; sin S1 en tests asignación | Identidad ajena y target inscripción |
| TS-SAME | teacher+student S1; no admin | Acceso a pauta impide rendir Q1 |
| TS-CROSS | teacher S2+student S1; no admin | Puede rendir Q1 S1 sin acceder pauta |
| AS-ST | assistant+student S1 | Proyección propia vs staff |
| MULTI | User global: studentS1 UC, teacherFS1 UTFSM | Cambios de tenant/roles sin duplicar User |
| MEMBER | Membership UC sin roles/flags | Vacío de cursos; delegación futura |
| NONE | User activo sin memberships | Login global válido, contexto404 |
| INACTIVE | User.active false, membership preexistente | Login/token401 |
| REVOKED | User activo, membership UC.active false | Institución invisible404 |
| OPERATOR | Credencial DB de preparación, sin rol UI implícito | Seed/onboarding/oráculo SQL |
| runtime | DB academix_runtime sin owner/bypass/DDL | Comprobar barrera RLS |

UTFSM replica SA/AO/T1/AS1/ST1 como identidades diferentes y todos los permisos contextuales.
MULTI es la excepción explícita de identidad compartida. Actor solo UTFSM para relación cruzada
carece de membership UC; no usar MULTI para esa denegación porque legítimamente pertenece a ambas.
AO-ONLY/AO-ST son variantes aisladas donde createdBy coincide con ese actor; no varios owners C1.
User puede acumular más roles; nunca «perfil visual» que sustituya filas Enrollment.

## Grafo de entidades por variante

| Alias | Contenido mínimo y relación |
| --- | --- |
| UC/UTFSM | institutions activas slug uc/utfsm; UUID distintos |
| C1 | code E2E-C1, term2026-2, createdByAO; sections S1/S2 codes1/2 |
| C2 | code E2E-C2, otro curso UC visible a T1; S21; Q2/M2-C2 de padre diferente |
| C3 | code E2E-C3, ownerAX, sin Enrollment T1/ST1; no visible a ellos |
| CEMPTY | Curso visible sin módulos/quizzes/Grades; matrículas según ficha |
| COPEN | Curso nuevo por caso, sin freeze, ítems/pesos se preparan por perfil |
| CNEW | Nombre lógico de curso que crea el test; no insertado previamente |
| CFROZEN | Curso con Grade publicada real y grade_items_locked_at fijado |
| S1/S2 | Secciones de C1; capacity30/null inicial, modificable por test |
| M1/M2 | Módulos C1 posiciones1/2; flags según VISIBILITY; no confundir M2 con M2-C2 |
| R1/R2 | Material Markdown de M1; # Tema, lista, tabla, código; createdByT1 |
| Q1/QOPEN | Quiz S1 publicado y abierto; dos preguntas6/4 puntos; correctas a/a, distractores b/b |
| QD/Q-DRAFT | Quiz borrador S1; questions vacías o6/4 según ficha; sin GradeItem |
| Q2 | Quiz distinto para IDs cruzados/clave; pertenencia curso definida en manifest |
| QFUTURE/QCLOSED | Ventana futura/cerrada; timestamps anclados a T de DB |
| I1/I2/I0 | GradeItems de Q1/Q2/Q0, uno por quiz publicado; títulos coinciden al publicar |
| A1 | Intento ST1 Q1 S1 número1; status según perfil, ID retenido por runner |
| A2 | Número2 mismo quiz/student; nunca crear sin terminal del anterior |
| A-ST2 | Intento ajeno ST2 en sección autorizada de su variante |
| G1 | Grade vigente Q1/ST1, section históricaS1, attemptId último graded |
| F1/FS1/FM1/FR1/FQ1/FA1/FG1 | Equivalentes UTFSM de curso/sección/módulo/material/quiz/intento/Grade |
| UUID-AUSENTE | UUID válido reservado manifest, no insertado en ninguna tabla |
| K/K1/K2 | Claves de operación sintéticas distintas por namespace/acción, nunca token |

No Grade GET por ID aislado: FG1 se prueba por libro/my-grades/selección según operación existente.
Cuando la ficha dice leer grade por API, usar libro o my-grades, no inventar endpoint `/grades/{id}`.
Las preguntas de cada quiz reciben UUID servidor; alternativas IDs a/b son locales a cada pregunta.
Renderizar nombre/ID del manifest en fixtures y resolverlo por respuesta, sin secretos en archivos versionados.

## Oráculos numéricos independientes

Puntos6+4: [a,a]10/10=100%=7; [a,b]6/10=60%=4; [b,a]4/10=40%=3;
[b,b] o[]0%=1; una pregunta sin responder suma0. Una respuesta válida no requiere todas las preguntas.
Puntos1+2: acertar1=>33.33%=>2.7; acertar2=>66.67%=>4.5.
Porcentaje primero HALF_UP2decimales; usar ese porcentaje para curva1–4 al60% y4–7 al100%, HALF_UP1decimal.
Promedio: Q1 nota4 peso30, Q2 nota7 peso70; solo Q1 publicado=>4.0/peso30/parcial;
ambos=>6.1/peso100/no parcial. Ítem peso0 publicado solo=>promedio null, no0.
Comparar literal esperado/declaración decimal independiente y SQL persistido; no recalcular esperado con grading.ts.
