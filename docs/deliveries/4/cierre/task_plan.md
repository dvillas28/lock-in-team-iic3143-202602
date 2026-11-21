# Cierre E4 — Prioridades 1–3

Fecha: 21/11/2026. Entrega informada: 22/11/2026.

## Objetivo

Conciliar alcance y versión, comprobar operación remota y medir rendimiento frontend con evidencia revisable.

## Fases

- [x] Preparar rama y preservar archivos del usuario.
- [x] Conciliar fuentes de compromisos E3, capacidades agregadas y versión backend desplegada.
- [x] Comprobar endpoints, accesos UI, ciclo académico API y lectura UI de material/notas en ambos tenants.
- [x] Medir Lighthouse público y autenticado; conservar HTML/JSON y capturas.
- [x] Publicar evidencia revisada y actualizar seguimiento con límites explícitos.

## Decisiones

- No agregar funcionalidades; corregir solo bloqueos demostrados.
- No modificar producción ni datos académicos existentes sin necesidad del recorrido autorizado.
- Distinguir implementación, prueba automatizada y comprobación remota.
- Conservar estimaciones separadas de horas efectivas.

## Dependencias

- Cuentas de prueba: solicitadas al usuario; permiten recorrido privado y Lighthouse autenticado.
- No hay permisos Project en el token local; seguimiento posible en issues.

## Errores

- Lighthouse timespan no admite filtro de categoría accessibility: se retira el filtro y se reintenta con categorías propias de cada modo.
- main y dev no permiten fast-forward por historia de merge; se reutilizan solo los seis documentos de #330 sin alterar main remoto.
- Herramientas disponibles desde sus directorios; instalación temporal fuera del repo.

- Lectura UI inicial: import expect no exportado por playwright; se corrige con esperas de locator y URL explícita. No era fallo del producto.

- Creación inicial de PR falló por alias remoto: origin redirige al repositorio de dvillas28, no es un fork. PR #331 creada con head sin propietario.
- Rama reajustada sobre dev para evitar historia ajena; resueltos tres add/add conservando documentos de #330 y actualización operativa.

- diff-check detectó espacios finales en HTML generado por Lighthouse; se normalizan sin cambiar JSON ni resultados.

## Estado

Prioridades 1–3 ejecutadas y publicadas para revisión en [PR #331](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/331). Seguimiento actualizado en #205, #206, #209, #212, #213 y #216. Quedan ensayo, PPT, horas y decisiones del equipo.
