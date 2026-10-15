# Tablero y métricas de avance

Las métricas de las Entregas 3 y 4 (burnup, lead time, cycle time, estimado vs.
real, distribución por tipo y área) salen del GitHub Project
[lock-in-LMS](https://github.com/users/dvillas28/projects/3). Para que sean
confiables, el tablero se usa con las reglas de esta guía.

## Reglas del tablero

- **Una tarjeta por tarea del plan**, con `Semana`, `Tipo`, `Área`, `Priority`,
  `Estimate (h)` y responsable.
- **Un solo `Tipo` por tarjeta.** El campo admite varios valores, pero las
  métricas asumen uno; el snapshot avisa si encuentra más.
- **`Real (h)` es obligatorio antes de mover una tarjeta a Done.** Son las horas
  efectivamente invertidas, sumando a todas las personas que trabajaron en ella.
  Sin este campo no hay estimado vs. real.
- **Los drafts se convierten en issues al inicio de su semana.** Una issue
  registra cuándo se creó y cuándo se cerró; un draft no.
- **Mover la tarjeta a In progress al empezar a trabajarla**, no al terminarla.
  El cycle time se mide desde ese cambio.
- **Los PR no se agregan como tarjetas.** Se vinculan a la issue que resuelven.

Las iteraciones `Semana 0 E2` y `Semana 1` son anteriores a estas reglas y las
métricas las excluyen, igual que cualquier PR presente en el tablero.

## Snapshot diario

El workflow [`Board snapshot`](../../.github/workflows/board-snapshot.yml)
corre todos los días a las 23:00 (hora de Chile) y se puede lanzar a mano desde
Actions. Exporta el tablero con
[`board-snapshot.sh`](../../.github/scripts/board-snapshot.sh) y lo guarda en
la rama huérfana `metrics`, fuera del flujo de PR:

```text
metrics
├── README.md          reporte de métricas actualizado en cada corrida
├── snapshots/
│   └── AAAA-MM-DD.csv una fila por tarjeta con su estado ese día
└── derived/
    ├── burnup.csv     alcance y terminado por día (tarjetas y horas)
    └── cfd.csv        Todo / In progress / Done por día
```

GitHub Projects no guarda un historial consultable de cambios de estado; los
snapshots lo reconstruyen. Un día sin snapshot no se puede recuperar después.

El workflow lee el Project con el secret `PROJECT_READ_TOKEN`, un PAT classic
con scope `read:project`: el `GITHUB_TOKEN` de Actions no puede leer Projects
de usuario. Si el PAT expira, el workflow falla y hay que renovarlo.

## Métricas

| Métrica | Definición |
| --- | --- |
| Burnup | Tarjetas y horas estimadas terminadas vs. alcance total, por día. |
| Lead time | Desde que se crea la tarjeta hasta que se cierra la issue. |
| Cycle time | Desde el primer snapshot en In progress hasta Done. |
| Real / estimado | Suma de `Real (h)` sobre suma de `Estimate (h)` de tarjetas terminadas; sobre 1 indica subestimación. |
| Por tipo y área | Tarjetas, terminadas y horas estimadas por grupo. |
| CFD | Tarjetas en cada estado por día; muestra WIP y cuellos de botella. |

Para regenerar el reporte localmente:

```bash
git fetch origin metrics
git worktree add ../metrics metrics
node scripts/board-metrics.mjs ../metrics/snapshots --csv ../metrics/derived
```
