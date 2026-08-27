<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Modified principles: template placeholders replaced with LMS principles
Added sections: Product Constraints, Development Workflow
Removed sections: none
Templates requiring updates:
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/tasks-template.md
- updated: .specify/templates/checklist-template.md
Runtime guidance:
- updated: AGENTS.md
- updated: docs/guides/speckit-flow.md
Follow-up TODOs: none
-->

# LMS Multi-Tenant Universitario Constitution

## Core Principles

### I. Tenant Isolation Is Mandatory

Every feature MUST identify the tenant boundary for affected data. Reads,
writes, background jobs, exports, and admin actions MUST NOT cross institutions
unless the feature explicitly defines a cross-tenant operator flow.

### II. Academic Records Are High Integrity

Submissions, corrections, grades, publications, enrollments, and role changes
MUST be auditable. A plan MUST state whether a record is immutable, versioned,
or overwritten with an audit trail before implementation starts.

### III. Specs Before Stack

Feature specs MUST describe user value, actors, data, constraints, and success
criteria without locking framework choices. Stack decisions belong in
`/speckit-plan` and durable decisions belong in `docs/adr/`.

### IV. Small Deployable Core

The default architecture is the simplest deployable app that can satisfy the
current feature. New services, queues, caches, generic repositories, and
external providers MUST be justified by a current requirement, not future scale.

### V. Checked Changes Only

Non-trivial behavior changes MUST leave a runnable check: a unit, integration,
contract, browser, migration, or small self-check appropriate to the risk. Trust
boundaries and data integrity paths require tests before merge.

## Product Constraints

The MVP focuses on university LMS flows: institutions, users, contextual roles,
courses, sections, modules, academic material, evaluations, submissions,
correction, grade publication, and course gradebook.

Out of scope until a spec reintroduces them: calendar integrations, live
quizzes, advanced teacher planning, RAG over all course material, and advanced
analytics.

## Development Workflow

Spec directories use timestamp prefixes: `YYYYMMDD-HHMMSS-feature-name`.
Git branches use `<type>/<short-name>`.

Feature branches are required as a team workflow convention for PR clarity, but
Spec Kit commands MUST NOT fail solely because the current branch name does not
match a spec. `.specify/feature.json` is a local-only pointer and MUST NOT be
committed.

Agents MUST use CodeGraph before manual search when `.codegraph/` exists and
the task involves understanding code flow. If CodeGraph does not cover the file
type, use `rg` next.

Planning MUST keep user stories independently deliverable. Implementation tasks
MUST include tenant isolation, role permissions, and data integrity checks when
the feature touches academic records.

## Governance

This constitution overrides informal repo habits. Changes require updating this
file, syncing affected Spec Kit templates, and recording durable architecture
decisions in `docs/adr/` when behavior or structure changes materially.

Versioning follows semantic versioning: MAJOR for principle removals or
incompatible governance changes, MINOR for new principles or sections, PATCH
for wording and clarification.

Reviews MUST verify constitution compliance before merge. Complexity violations
MUST be documented in the feature plan's Complexity Tracking section.

**Version**: 1.2.0 | **Ratified**: 2026-08-27 | **Last Amended**: 2026-08-27
