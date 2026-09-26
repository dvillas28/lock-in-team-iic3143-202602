# Riesgos Actualizados

## Riesgos principales

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Sobrealcance funcional | No llegar a demo usable | Mantener fuera IA, chat, calendario, auditoria y correccion manual. |
| Complejidad de sharding | Errores de conexion o migracion | Registry minimo, dos tenants demo y schema igual por tenant. |
| Fuga entre tenants | Riesgo academico y reputacional | Ruta por tenant, `x-tenant` obligatorio, conexion por tenant y tests de aislamiento. |
| Railway free tier insuficiente | No desplegar arquitectura completa | Ajuste minimo documentado; mantener migracion posterior a Google Cloud. |
| Object storage no disponible | Material con archivos bloqueado | Walking skeleton puede partir con markdown; archivos entran despues. |
| Falta de tiempo real del equipo | Funciones incompletas | Priorizar walking skeleton, quizzes, notas y publicacion. |
| CI/CD subestimado | Pauta pierde evidencia | Crear pipeline temprano y versionar `railway.toml`. |
| Notas sin auditoria | Cambios no trazables | No editar notas publicadas silenciosamente; auditoria queda como deuda explicita. |
| Auth mock demasiado largo | Seguridad insuficiente | Limitarlo al walking skeleton y planificar auth real en Spec Kit posterior. |

## Decisiones de riesgo aceptado

- Se acepta portal home + rutas `/uc` y `/utfsm` en vez de subdominios porque
  valida tenancy sin comprar dominio ni configurar wildcard DNS.
- Se acepta no implementar auditoria historica porque el MVP prioriza flujo
  completo y modelo de datos.
- Se acepta Railway antes que Google Cloud porque la evidencia de despliegue
  vale mas para Entrega 2 que una arquitectura cloud ideal.
- Se planifica migracion posterior a Google Cloud usando free tier/creditos de
  la cuenta asociada.
- Se acepta una DB por tenant demo aunque aumente migraciones, porque el objetivo
  academico es demostrar sharding real.

## Senales de alerta

- El frontend funciona pero no consume backend.
- El backend usa una sola DB academica para todos los tenants.
- El CI solo corre para una parte del monorepo.
- El deploy requiere pasos no documentados.
- La nota se calcula en frontend en vez de backend.
- Las queries no validan seccion/rol antes de exponer datos.

## Riesgos removidos respecto a Entrega 1

- IA costosa: fuera del MVP.
- Redis/workers: fuera hasta tener procesos lentos reales.
- Replicas/load balancer: fuera hasta necesitar escala real.
- Recorrecciones: fuera por complejidad de flujo.
- Chat/calendario/anuncios: fuera por no aportar al skeleton evaluable.
