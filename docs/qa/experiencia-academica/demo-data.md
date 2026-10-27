# Demo académica local

Datos ficticios agregados al ambiente Docker del usuario el 2026-10-27.
Operación registrada: `demo-experiencia-academica-v1`, estado `complete`.
Los cursos y cuentas anteriores se conservaron. Las contraseñas nuevas se
entregaron por separado; no se versionan credenciales.

## Inventario agregado

| Institución | Curso | Estudiantes | Notas | Publicadas |
| --- | --- | ---: | ---: | ---: |
| UC | DEMO-IIC3143 · Desarrollo de software | 25 | 57 | 45 |
| UC | DEMO-IIC2233 · Programación orientada a objetos | 13 | 29 | 0 |
| UTFSM | DEMO-INF245 · Arquitectura de software | 25 | 57 | 45 |
| UTFSM | DEMO-INF236 · Análisis y diseño de software | 13 | 29 | 0 |

Cada curso tiene dos secciones, tres módulos, seis materiales Markdown y cinco
quizzes: tres con resultados, uno publicado con apertura futura y un borrador.
Los módulos e ítems incluyen publicaciones independientes y contenido oculto.
Hay intentos repetidos, en progreso y cancelados, con calificaciones variadas
calculadas por el backend. Auditoría y libro contienen suficientes filas para paginar.

Las ponderaciones son 20/25/25/30 %. IIC3143 e INF245 tienen publicación parcial
de 45 % y ponderaciones bloqueadas; IIC2233 e INF236 permiten probar pesos y
publicación. Total nuevo: 172 notas, 90 publicadas y 82 pendientes de publicación.

## Cuentas nuevas

Sustituir `{institucion}` por `uc` o `utfsm`:

- `profesor.{institucion}@academix.example`: docente administrador y propietario.
- `ayudante.{institucion}@academix.example`: ayudante de ambas secciones.
- `estudiante01.{institucion}@academix.example` hasta `estudiante24...`: estudiantes.
- `disponible01.{institucion}@academix.example` hasta `disponible10...`: sin matrículas.

Son 72 cuentas nuevas, aisladas por institución. Las veinte personas disponibles
no pertenecen a ningún curso, incluyendo matrículas históricas. `demo-multi`
también está matriculado en los cuatro cursos; conserva su contraseña anterior.

## Cómo asignar un estudiante

1. Entrar como `profesor.uc@academix.example` en `http://uc.localhost:3000`.
2. Abrir un curso, **Secciones y participantes**, y la sección de destino.
3. Abrir **Asignar participante**, buscar `disponible` y seleccionar una persona.
4. Elegir **Estudiante** y pulsar **Asignar rol**.
5. Comprobar la matrícula activa en la tabla de participantes.

Repetir en UTFSM usando su subdominio y profesor. La búsqueda solo muestra
personas de la institución activa. Asignar la misma persona/rol no duplica matrículas.

## Comprobaciones realizadas

- API real con perfiles nuevos: directorio devuelve diez disponibles por institución.
- Libro de IIC3143/INF245: páginas de veinte y cinco estudiantes.
- `estudiante01`: dos notas publicadas y 45 % en el curso principal; vacío en el segundo.
- Consulta SQL: diez disponibles por institución sin ninguna matrícula.
- Reejecución de la operación: informa completa sin volver a crear registros.

Usuarios y memberships se aprovisionaron con acceso operador y auditoría.
Cursos, matrículas, contenido, quizzes, respuestas, envíos, ponderaciones y
publicaciones se crearon mediante API real, sin insertar notas manualmente.
Este inventario describe el volumen Docker actual; los datos no son migraciones
ni se reconstruyen al clonar el repositorio.
