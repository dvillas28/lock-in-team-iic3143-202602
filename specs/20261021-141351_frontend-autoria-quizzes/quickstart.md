# Quickstart: Validar autoría frontend de quizzes

Guía de implementación futura; todavía no representa pruebas ejecutadas del producto.
Contrato: [contracts/quiz-authoring.md](contracts/quiz-authoring.md).
Datos/límites: [data-model.md](data-model.md).

## Prerrequisitos

- Node 24 y pnpm 9.15.9; dependencias frontend instaladas con lockfile existente.
- Sesión/cursos operativos y API compatible con OpenAPI; no requiere módulos/material.
- Para navegador real: configurar API, orígenes institucionales y CORS según
  `docs/guides/frontend-api-client.md` y bootstrap `docs/backend/demo-tenant-bootstrap.md`.
- Fixtures aisladas UC/UTFSM: teacher sección A; teacher otra sección B; teacher admin
  dueño; admin no dueño; admin/superadmin aislados; assistant; student; teacher+student.
- Recursos: draft vacío, draft válido, publicado y curso con primera nota publicada.
  Preparar datos sin alterar cursos/credenciales reales; no commitear secretos.

## Comandos desde raíz

```bash
rtk pnpm --dir frontend install --frozen-lockfile
rtk pnpm --dir frontend api:check
rtk pnpm --dir frontend lint
rtk pnpm --dir frontend typecheck
rtk pnpm --dir frontend test
rtk pnpm --dir frontend test:coverage
rtk pnpm --dir frontend build
rtk pnpm --dir frontend dev
```

Scripts actuales de package.json; ejecutar después de implementar cada incremento.
La ruta local depende del origen institucional configurado, con API de desarrollo
por defecto en localhost:3001; no inferir autorización desde Host del servidor API.

## US1: consulta y creación independiente

1. Con fixture teacher sección A abrir `/courses/{courseId}/quizzes`; verificar drafts
   propios, publicados permitidos y ausencia de isCorrect en red/DOM/estado seguro.
2. Crear draft con título y sección A, preguntas vacías; respuesta 201 y estado draft.
   Verificar configuración opcional y retorno a lista/detalle sin pauta.
3. Teacher ordinario no ofrece curso completo/B; teacher admin dueño sí.
   Admin no dueño no amplía alcance; admin aislado/assistant/student no crean ni piden pauta.
4. En UC solicitar IDs de UTFSM por URL/API: error seguro, nunca datos cruzados.
5. Simular carga/vacío, 401/403/404/413/422/503 y red; errores no contienen pauta.
6. Perder respuesta POST: un solo envío, consulta de lista y bloqueo de repetición,
   incluso con título duplicado, lista vacía o fallo al reconciliar.

## US2: edición independiente con draft fixture

1. Abrir editor explícito; Network solo solicita /authoring después de autorización
   sobre quiz.courseId y destino. Detalle seguro no precarga esa respuesta.
2. Cambiar configuración y preguntas; guardar PATCH; UUID retenidos, nuevas preguntas
   omiten id, alternativas conservan IDs string únicos y una sola correcta.
3. Probar título 200/201, instrucciones 10000/10001, NUL, posiciones/UUID duplicados,
   cero/dos correctas, menos de dos alternativas, puntajes 0/negativos/tres decimales,
   suma >999999.99, intentos 0/2147483648 y JSON UTF-8 4096/4097 bytes.
4. Probar fechas inválidas/invertidas, nulos ilimitados, zona explícita y fecha intacta.
   sectionId omitido conserva destino; null solo para teacher admin dueño.
5. Cambiar origen/destino fuera de alcance; publicado devuelve 409; no duplica quiz,
   no reemplaza destino ni descarta texto autorizado silenciosamente.
6. Logout/expiración/cambio de usuario/tenant y revocación limpian pauta y formulario;
   resolver una respuesta vieja después no restaura nada. Teacher+student ve restricción.

## US3: publicación independiente con draft válido fixture

1. Abrir confirmación; revisar destino, fechas, irreversibilidad y peso inicial cero.
   Cancelar no envía; cambios sin guardar impiden publicar versión antigua.
2. Confirmar una vez: POST sin cuerpo → published; consultar grade-items y mostrar
   exactamente el asociado por quizId, con peso actual recibido y estado confirmado.
3. Repetir publish autorizado en API/fixture: mismo publishedAt y único item.id;
   no duplicar representación. Verificar evento único con checks backend existentes.
4. Publicar draft nuevo en curso congelado → 409, sin éxito ni ítem local inventado.
   Guardar draft continúa posible; publish del ya publicado sigue repetible.
5. Perder respuesta publish → consultar estado sin retry automático; lectura fallida
   mantiene incertidumbre. Lectura GradeItem fallida tras POST 200 conserva publicado.

## Revisión transversal y evidencia

- Recorrido completo crear → editar → publicar con backend real UC/UTFSM.
- Teclado: labels, radio, agregar/quitar/reordenar, foco de errores/dialog y Escape.
- 375 px y escritorio, ambos temas, contraste ≥4.5:1, reduced motion y cifras tabulares.
- Inspeccionar logs/storage/URL: sin pauta persistida ni contenido de errores servidor.
- Registrar comandos, fecha, resultados, capturas sin secretos y limitaciones en
  `docs/guides/frontend-quiz-authoring.md`; distinguir mocks de backend real.
- No declarar RLS, atomicidad o ausencia de eventos duplicados probadas por mocks UI;
  referenciar checks backend existentes cuando se ejecuten, sin modificar SQL.
