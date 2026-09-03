# Agent Instructions

## Project

Build **AcademiX**, a university LMS multi-tenant platform focused on the critical academic
flow: courses, modules, material, evaluations, submissions, correction, grade
publication, and gradebook.

## Working Rules

- Keep the repo skeleton stack-light until a Spec Kit plan chooses the stack.
- Use `pnpm` for JavaScript/TypeScript package management.
- Put durable docs in `docs/`; deliveries go under `docs/deliveries/<n>/`.
- Record long-lived architecture decisions in `docs/adr/`.
- Do not add frameworks, services, queues, caches, or providers without a spec
  or plan that needs them now.
- Branches should be separate per feature for PR clarity, but branch names must
  not block working with an existing spec.
- Branch names should follow `<type>/<short-name>` using `feat`, `fix`, `docs`,
  `test`, `refactor`, `chore`, `style`, `perf`, `ci`, or `build`.
- `.specify/feature.json` is a local-only pointer and must not be committed.

## CodeGraph

If `.codegraph/` exists and the task involves understanding code flow, use
CodeGraph before `rg`, `find`, or manual file reads:

```bash
codegraph explore "<symbols, files, or flow question>"
```

Use `rg` next for docs, config, or files not covered by CodeGraph.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan.

Specs use timestamp prefixes: `YYYYMMDD-HHMMSS-feature-name`.
Git branches use `<type>/<short-name>`.

When a task targets a specific spec from any branch, prefer:
`SPECIFY_FEATURE_DIRECTORY=specs/<timestamp>-<short-name>`.

Constitution gates:
- Tenant isolation must be explicit.
- Role permissions must be explicit.
- Academic records need an audit/history decision.
- User stories should remain independently deliverable.
- Complexity must be justified in the plan.
<!-- SPECKIT END -->

## UI & Design

Before writing any frontend code, read:

- **[DESIGN.md](DESIGN.md)** — design system: color tokens, typography, component specs, layout rules.
- **[mockups/README.md](mockups/README.md)** — map of high-fidelity wireframes by role and user story.

The canonical style sources are:

- `mockups/assets/tokens.css` — all color and metric tokens; do not hardcode values that exist here.
- `mockups/assets/app.css` — shared shell components (sidebar, header, cards, chips, table, buttons, forms, tabs, modal). Build new views on top of these; do not duplicate styles.

Design language constraints:

- Typography: EB Garamond for headings (academic voice), Inter for UI. Use `tabular-nums` on grades and numeric tables.
- Colors: navy as primary, amber reserved for grades and highlights. See `tokens.css` for exact values.
- Icons: Lucide SVG only. No emoji as icons.
- Accessibility: contrast ≥ 4.5:1 in both themes, `:focus-visible` for keyboard, `aria-label` on icon-only buttons, respect `prefers-reduced-motion`.
- Theme: light-first; dark theme via `[data-theme="dark"]` on `tokens.css`. No hardcoded colors outside `tokens.css`.

The product name is **AcademiX**.

## Local Skills

Use repo-local skills from `.agents/skills/` when relevant:

- `lms-reviewer`
- `lms-db-design`
- `lms-ui-ux` — invoke before designing or reviewing any UI surface.
