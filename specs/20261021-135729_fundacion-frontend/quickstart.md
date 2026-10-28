# Validación: fundación frontend

## Prerrequisitos

Desde raíz del repo: Python 3, Git y fuentes locales. Sin backend, DB ni credenciales.

## Validar planificación ahora

```bash
SPECIFY_FEATURE_DIRECTORY=specs/20261021-135729_fundacion-frontend \
  .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
git diff --check
python3 - <<'PY'
from pathlib import Path
import re
root = Path.cwd()
feature = root / 'specs/20261021-135729_fundacion-frontend'
files = list(feature.rglob('*.md'))
for f in files:
    content = f.read_text()
    assert len(content.splitlines()) < 150, f
    assert not re.search(r'\[NEEDS CLARIFICATION[:\]]', content), f
    for link in re.findall(r'\]\(([^)]+)\)', content):
        if '://' not in link and not link.startswith('#'):
            assert (f.parent / link.split('#')[0]).exists(), (f, link)
tasks = (feature / 'tasks.md').read_text()
rows = re.findall(r'^- \[[ xX]\] (T\d{3}) (.+)$', tasks, re.M)
assert rows and [i for i, _ in rows] == [f'T{i:03d}' for i in range(1, len(rows)+1)]
assert len(re.findall(r'^- \[[ xX]\] ', tasks, re.M)) == len(rows)
for _, body in rows:
    assert '`' in body, body
print(f'OK: {len(files)} documentos; {len(rows)} tareas secuenciales; links y longitud')
PY
```

Resultado: planificación completa, tareas válidas y links existentes.
Futuros specs se muestran como código, sin links rotos hasta crearlos.

## Ejecutar posteriormente la misión documental

Usar `speckit-implement` con este `SPECIFY_FEATURE_DIRECTORY` y [tasks.md](tasks.md).
Generar cada hijo mediante `speckit-specify` con el directorio exacto del plan;
no usar el puntero implícito anterior ni ejecutar implementación de producto.
Este paso no forma parte de la ejecución de plan/tasks.

## Validar cierre cuando existan los seis specs

```bash
python3 - <<'PY'
from pathlib import Path
root = Path.cwd()
names = [
    '20261021-141348_frontend-acceso-multitenant',
    '20261021-141349_frontend-cursos-participacion',
    '20261021-141350_frontend-modulos-material',
    '20261021-141351_frontend-autoria-quizzes',
    '20261021-141352_frontend-rendicion-quizzes',
    '20261021-141353_frontend-notas-seguimiento',
]
for name in names:
    for rel in ['spec.md', 'checklists/requirements.md']:
        f = root / 'specs' / name / rel
        assert f.is_file(), f
        content = f.read_text()
        assert len(content.splitlines()) < 150, f
        assert 'NEEDS CLARIFICATION' not in content, f
        if rel.startswith('checklists/'):
            assert '- [ ]' not in content, f
for rel in ['docs/frontend/README.md', 'docs/frontend/coverage.md']:
    f = root / rel
    assert f.is_file() and len(f.read_text().splitlines()) < 150, f
print('OK: seis specs/checklists e índice presentes')
PY
```

Revisar semánticamente [contracts/spec-delivery.md](contracts/spec-delivery.md):
CU-01–16, FE-01–20, 16 vistas, cero ciclos, permisos y acciones compartidas.
Registrar comando/resultado y revisión en `docs/frontend/coverage.md`.
El cierre se ejecutó al completar las tareas; puede repetirse sobre los archivos entregados.
Los asserts no sustituyen esa revisión ni prueban comportamiento del producto.
