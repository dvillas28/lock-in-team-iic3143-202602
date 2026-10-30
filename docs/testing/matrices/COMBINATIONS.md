# Cobertura combinatoria y exclusiones

## Dimensiones y restricciones de dominio

| Dimensión | Valores relevantes |
| --- | --- |
| Tenant |UC, UTFSM, slug desconocido, inactivo; token miembro uno/ambos/ninguno |
| Actor |SA, adminowner+teacher, owneronly, adminajeno, teacher, assistant, student y cuatro multirol |
| Curso |Propio/inscrito, otro visible, ajeno, UUID inexistente |
| Sección |Actual propia, otra autorizada, otra no autorizada, histórica revocada, destino nullcurso |
| Sesión |Anónima, autenticada, expirada/inválida, revocada, nueva identidad, documento nuevo |
| Recurso |Draft/publicado; oculto/publicado combinado; intentoactivo/graded/cancelled; Grade privada/publicada/freeze |
| Acción |Leer/listar/crear/modificar/ordenar/publicar/cancelar/rendir; sinDELETE vigente |
| Red |Normal, offline, timeout, respuesta tardía, pérdida trascommit,4xx/5xx, DTO inválido |
| Compatibilidad |Chromium/Firefox/WebKit;1440×900 y375×812; light/dark/reducedmotion |

No producto cartesiano completo: combina muchos estados imposibles y repetiría controles idénticos.
Las restricciones se validan antes de generar variantes; un par imposible se registra con justificación.

## Fronteras que requieren expansión exhaustiva

1. Por cada operación institucional inventariada: permitido, mismo tenant sin permiso,
   mismo rol en otro curso/sección, otro tenant ambas direcciones, token inválido/ausente.
2. Por cada write: ID de path ajeno y cada FK/selector de body ajeno relevante, con body válido;
   comprobar no mutación ni evento/receipt. Slug accesible vs inaccesible se separan.
3. Pauta/Grade/audit: todas las proyecciones student/assistant/teacher/owneronly/ownerstudent;
   incluir revocación con JWT y cursor vigentes. No sustituir por pairwise.
4. Módulo/material las4 combinaciones; quiz draft/published y destino propio/ajeno/null;
   multirol teacher+student misma/diferente sección y assistant+student.
5. Cada transición crítica y prohibida de STATES, incluida cancelación/envío/publicación concurrentes,
   replays misma key/diferente key/diferente selección y límites temporal/cuota.

## Pares representativos para dimensiones restantes

Después de fijar frontera crítica, usar cobertura por pares sobre browser/viewport/tema/red/tipo de
acción y datos no críticos. Restricciones: escribir solo con actor permitido salvo caso negativo;
guardar solo inProgress; publicar solo Grade vigente sinactivo; owner no representa teacher automáticamente.
Generar tabla covering-array en rama de infraestructura y validarla contra conjunto de pares factibles.
Cada fila se vincula a ID ficha y sufijo variante; cualquier par no cubierto exige exclusión explícita.
No se afirma que la siguiente muestra sea una covering-array completa: es el conjunto inicial obligatorio.

| Ficha / variante | Tenant/actor | Sesión/curso/sección | Estado/acción | Red / navegador / viewport / tema |
| --- | --- | --- | --- | --- |
|AUTH-001/ST1 |UC/student |Nueva/C1/S1 |Login+leer |Normal/Chromium/1440/light |
|AUTH-001/T1 |UTFSM/teacher |Nueva/F1/FS1 |Login+leer |Normal/Firefox/1440/dark |
|PUBLIC-001/mobile |Portal/anónimo |Sin sesión |Navegarlogin |Normal/WebKit/375/light |
|TENANT-008/reverse |UTFSM/teacher |Activa/UCajeno |GETmaterial |Normal/Chromium/375/dark |
|RBAC-009 |UC/TS-SAME |Activa/C1/S1 |Startprohibido |Normal/Firefox/1440/light |
|RBAC-010 |UC/TS-CROSS |Activa/C1/S1hist |Startpermitido |Normal/WebKit/375/dark |
|CONTENT-009/01 |UC/student |Activa/C1/S1 |Moculto/Rpublicado |Normal/Chromium/1440/dark |
|CONTENT-008 |UTFSM/teacher |Activa/F1/FS1 |Editarpublicar |Normal/Firefox/375/light |
|ATTEMPT-016 |UC/student |Activa/C1/S1 |Saveincierto |Lostresponse/WebKit/1440/light |
|GRADE-029 |UTFSM/teacher |Activa/F1/FS1 |Publicarreplay |Timeout/Chromium/375/dark |
|AUDIT-003 |UC/ownerstudent |Activa/C1/S1 |GETauditgradefiltrado |Normal/Firefox/375/dark |
|NETWORK-008 |UC/ST1→ST2 |Cambioactor |GET401viejo |Delayed401/WebKit/1440/light |

## Exclusiones justificadas

- Coordinador, roladmin Enrollment, superadminglobal, DELETE y binarios: no existen en MVP.
- Curso sinpermiso con éxito200, Grade publicada mutable, dosactivos: estados prohibidos, probar rechazo.
- submitted durable como trabajoasync: imposible por trigger/tx, comprobar ausencia en integración.
- Ventanas<1ms: deuda aceptada; no afirmar precisiónµs, ni imponer timingexacto navegador.
- Todos los bytes/todos los navegadores/versiones/viewport: límites representativos y motores fijados;
  no representa garantía de seguridad/accesibilidad completa.
- Fallo de red en cada endpoint idéntico: cubrir por familia cliente/operación/read vs write y casos
  específicos de idempotencia; no duplicar50timeoutes que solo ejercitan mismo boundary.
- Quizzes UI filtros locales no requieren todas las permutaciones de filtros equivalentes;
  sí reinicio cursor/selección donde afecta publicación o permisos.
- Solo smokecritico en Firefox/WebKit programado inicialmente; regresióncompleta Chromium.
- Producción y caos de proveedores externos: excluidos sin autorización/entorno específico.

La implementación debe publicar ledger de pares factibles/cubiertos/excluidos y de fronteras exhaustivas.
Una ficha parametrizada no obtiene100% cobertura si solo se ejecutó su primera variante.
