# Riesgos actualizados

## Riesgos principales

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Sobrealcance funcional | No llegar a demo usable | Mantener fuera IA, chat, calendario, auditoría y corrección manual. |
| Complejidad de sharding | Errores de conexión o migración | Registry mínimo, dos tenants demo y schema igual por tenant. |
| Fuga entre tenants | Riesgo académico y reputacional | Ruta por tenant, `x-tenant` obligatorio, conexión por tenant y tests de aislamiento. |
| Railway free tier insuficiente | No desplegar arquitectura completa | Ajuste mínimo documentado; mantener migración posterior a Google Cloud. |
| Object storage no disponible | Material con archivos bloqueado | Walking skeleton puede partir con markdown; archivos entran después. |
| Falta de tiempo real del equipo | Funciones incompletas | Priorizar walking skeleton, quizzes, notas y publicación. |
| CI/CD subestimado | Pauta pierde evidencia | Crear pipeline temprano y versionar `railway.toml`. |
| Notas sin auditoría | Cambios no trazables | No editar notas publicadas silenciosamente; auditoría queda como deuda explícita. |
| Auth mock demasiado largo | Seguridad insuficiente | Limitarlo al walking skeleton y planificar auth real en Spec Kit posterior. |

## Decisiones de riesgo aceptado

- Se acepta portal home + rutas `/uc` y `/utfsm` en vez de subdominios porque
  valida tenancy sin comprar dominio ni configurar wildcard DNS.
- Se acepta no implementar auditoría histórica porque el MVP prioriza flujo
  completo y modelo de datos.
- Se acepta Railway antes que Google Cloud porque la evidencia de despliegue
  vale más para Entrega 2 que una arquitectura cloud ideal.
- Se planifica migración posterior a Google Cloud usando free tier/créditos de
  la cuenta asociada.
- Se acepta una DB por tenant demo aunque aumente migraciones, porque el objetivo
  académico es demostrar sharding real.

## Señales de alerta

- El frontend funciona pero no consume backend.
- El backend usa una sola DB académica para todos los tenants.
- El CI solo corre para una parte del monorepo.
- El deploy requiere pasos no documentados.
- La nota se calcula en frontend en vez de backend.
- Las queries no validan sección/rol antes de exponer datos.

## Riesgos removidos respecto a Entrega 1

- IA costosa: fuera del MVP.
- Redis/workers: fuera hasta tener procesos lentos reales.
- Réplicas/load balancer: fuera hasta necesitar escala real.
- Recorrecciones: fuera por complejidad de flujo.
- Chat/calendario/anuncios: fuera por no aportar al skeleton evaluable.
