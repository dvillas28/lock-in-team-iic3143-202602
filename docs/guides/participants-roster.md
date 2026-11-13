# Listado de participantes de una sección

Cada persona puede recibir un solo rol activo por sección. Para cambiarlo, usa
«Gestionar» en la matrícula actual. Historial conserva las matrículas revocadas
o reemplazadas, con su rol original y sin acciones de gestión.

Si la sección tiene matrículas activas de antes de esta regla, Activas muestra
cada una por separado para que se pueda decidir cuál conservar. La aplicación
rechaza nuevas asignaciones y reactivaciones que sumarían otro rol activo.

«Anterior» y «Siguiente» recorren los cursores de la vista actual. El indicador
«Página» indica la posición recorrida y no presupone un total. Cambiar de vista o
sección vuelve al inicio; una asignación, un cambio de rol o una revocación
confirmados actualizan Activas desde la primera página.

La vista de estudiantes y ayudantes tiene un contrato distinto: devuelve la
lista completa de su sección, con una fila por persona y un arreglo de roles
por compatibilidad. Por eso puede filtrar por rol localmente.

Para incorporar búsqueda o filtros por rol a la administración, la recomendación
es hacerlo en el servidor antes de paginar. Deben evaluarse por separado con
consultas y pruebas de autorización, orden estable y cursores ligados al filtro.
Filtrar una página de matrículas no representa el listado completo.
