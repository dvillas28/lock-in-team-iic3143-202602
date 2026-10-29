## CU-10 — Configurar libro de notas

### Descripción

El docente establece el peso de las evaluaciones del curso. **Meta:**
dejar un libro de notas coherente para publicar resultados y calcular el
promedio parcial.

### Actores

- Docente.

### Stakeholders

- Equipo docente: necesita ponderaciones conocidas para interpretar notas.
- Estudiantes: dependen de un promedio calculado con pesos correctos.

### Precondiciones

- Se cumplen las reglas comunes de autenticación y pertenencia institucional.
- El actor tiene rol `teacher` activo en un curso existente con elementos de nota vinculados a quizzes publicados.
- Todavía no existe una nota publicada del curso.

### Postcondiciones

- El conjunto completo de ponderaciones del curso queda guardado, suma 100 % y tiene un evento de auditoría; no se altera una nota ya calculada o publicada.

### Trigger

- El docente solicita configurar las ponderaciones del libro de notas.

### Flujo básico

1. El docente abre los elementos de nota del curso y su suma actual de ponderaciones.
2. El sistema muestra los elementos asociados a quizzes del mismo curso.
3. El docente asigna un peso a cada elemento y confirma el conjunto completo.
4. El sistema verifica que los elementos correspondan al curso y que la suma sea 100 %.
5. El sistema guarda las ponderaciones en conjunto, registra la modificación y muestra la configuración vigente.

### Flujos alternativos

#### FA-01 — Suma o conjunto inválido

**Se origina en:** Paso 4 del flujo básico, cuando faltan elementos, se referencia uno ajeno o la suma difiere de 100 %.

1. El sistema señala la inconsistencia de los pesos o elementos.
2. El docente corrige el conjunto antes de volver a confirmarlo.

**Resultado:** No se guarda una configuración parcial o inválida.

#### FA-02 — Ponderaciones bloqueadas

**Se origina en:** Paso 4 o 5 del flujo básico, cuando ya se publicó alguna nota del curso.

1. El sistema informa que la primera publicación bloqueó cambios de pesos y nuevos elementos.
2. El docente conserva la configuración previa.

**Resultado:** Las ponderaciones publicadas no cambian silenciosamente.

#### FA-03 — Curso no visible o falta de rol `teacher`

**Se origina en:** Paso 1 o 5 del flujo básico, cuando el curso no pertenece al contexto o el actor deja de ser docente.

1. El sistema no entrega elementos ajenos ni acepta la modificación.
2. El actor permanece en los cursos que puede consultar.

**Resultado:** El libro de notas queda sin cambios.
