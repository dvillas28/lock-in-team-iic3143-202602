# Ciclo temporal y calificación de intentos

Fecha: 2026-10-19. Estado: implementado y validado, con deuda temporal aceptada.

## Decisión

Iniciar, guardar y enviar por primera vez exige ventana [opensAt, closesAt).
Cada límite ausente es ilimitado. Evaluar reloj PostgreSQL después de adquirir
locks. Fuera de ventana: conflicto sin modificar respuestas ni estado.
El cierre temporal no cancela intentos; siguen activos y bloquean publicación
hasta cancelación explícita. Lectura y cancelación no exigen ventana abierta.
Esta decisión concreta FR-004 y complementa el
[ADR de cancelación](close-abandoned-quiz-attempts.md), sin agregar scheduler.
Teacher activo de sección histórica puede cancelar; teacher activo más admin
dueño amplía alcance al curso, según [permisos](institution-admin-and-course-ownership.md).

Envío y corrección son una transacción: no persistir submitted como trabajo
pendiente. Calcular porcentaje NUMERIC HALF_UP a dos decimales y, usando ese
porcentaje, nota a un decimal con exigencia 60 %. Guardar resultado/corrección
por intento y actualizar Grade no publicada desde último graded por número.
No seleccionar mejor nota. Grade publicada y terminales son inmutables.

Reusar lock Course existente para coordinar inicio, edición de pauta, envío,
cancelación y publicación. Mantener orden de locks en todos los consumidores.
Persistir claves de inicio/envío en intento; replay no recalifica ni audita otra
vez y siempre revalida acceso. Envío ya graded solo admite replay con clave
original; otra clave da 409 sin alias. GET usa anyOf de vistas permitidas, que
pueden coincidir sin corrección. No exige ventana ni ausencia de publicación
si devuelve un éxito previamente confirmado.

## Consecuencias

Un intento abandonado al cierre exige intervención explícita; si el estudiante
pierde permiso, teacher autorizado conserva capacidad de cancelarlo.
No existe entrega tardía implícita ni tarea periódica de limpieza.
La serialización por curso limita concurrencia; cambiar solo ante medición real.
Vista student nunca revela corrección; assistant tiene seguimiento agregado sin
isCorrect/pointsAwarded; teacher conserva corrección dentro de su alcance.

## Alternativas

Permitir envío tardío fue descartado por usuario. Autocancelación cambia semántica
y necesitaría otra decisión. Float JS introduce errores de redondeo; SQL decimal
existente evita dependencia nueva. Ledger genérico y locks por serie no aportan
valor actual frente a dos columnas de clave y el protocolo de curso compartido.

Artefactos: [plan](../../specs/20261014-235144_intentos-calificacion/plan.md)
y [modelo](../../specs/20261014-235144_intentos-calificacion/data-model.md).

## Deuda temporal aceptada tras auditoría

El usuario acepta conservar la resolución efectiva de milisegundos en intentos:
pg convierte timestamptz a Date y descarta la fracción inferior a 1 ms antes de
comparar con el reloj DB. Un límite puede adelantarse menos de 1 ms; las ventanas
submilisegundo no se garantizan. Es una excepción conocida de precisión a FR-004,
no un cambio de [opensAt,closesAt), de permisos ni de cancelación explícita.
Reutilizar quizColumns o comparar columnas originales en SQL si se necesita esa
precisión. La corrección queda diferida por decisión explícita del usuario.
