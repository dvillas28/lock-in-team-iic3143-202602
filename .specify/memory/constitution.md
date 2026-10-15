<!--
Sync Impact Report
Version change: 1.2.0 -> 1.3.0
Modified: Product Constraints aligned with Delivery 2; Development Workflow naming.
Added: VI. Bounded Documentation; backend mission traceability.
Removed: outdated manual-submission/correction MVP scope.
Synced: spec-template.md, plan-template.md, tasks-template.md, checklist-template.md;
AGENTS.md, docs/guides/speckit-flow.md, speckit-specify skill.
Validation: .github/scripts/check-doc-length.py and CI documentation gate.
Command templates: .specify/templates/commands/ absent; local skill updated instead.
Follow-up: course admin capability requires clarification before affected plans.
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

### VI. Bounded Documentation

New or modified authored Markdown documents MUST target fewer than 150 lines.
150–200 lines require a one-line `<!-- length-exception: reason -->` justification.
More than 200 lines MUST fail validation; split by responsibility and link from
an index, preserving requirements and acceptance evidence rather than deleting them.

Scope: `docs/`, `specs/`, `.specify/memory/`, `.specify/templates/`, root README,
AGENTS and DESIGN. Unmodified historical deliveries and imported tool/skill
sources are exempt until edited or regenerated as authored project documents.
Count physical lines, including blank lines and fenced blocks. CI MUST enforce
this rule on added/modified documents.

## Product Constraints

The current MVP is defined by Delivery 2: global identity, institutional
memberships, contextual teacher/student/assistant roles, courses, sections,
shared modules and markdown material, multiple-choice quizzes, automatic grading,
explicit grade publication, gradebook and immutable academic audit.

Manual submissions/correction, institutional administration, AI, chat, calendar,
binary upload/download, RLS, workers and advanced analytics remain outside the
core MVP. Binary material is an optional P2 extension requiring its own spec.
The admin/non-admin UI capability MUST be reconciled with domain permissions
before planning dependent academic features; a URL profile never grants access.

## Development Workflow

Spec directories use timestamp prefixes: `YYYYMMDD-HHMMSS_descripcion-mision`.
Use lowercase ASCII kebab-case for the mission description, without spaces.
Existing sequential or hyphen-separated spec names remain valid; do not rename
historical artifacts. Use explicit `SPECIFY_FEATURE_DIRECTORY` for each mission.
Git branches use `<type>/<short-name>`, independently of the spec directory.

Each backend mission MUST list its CU/RF/RNF coverage, prerequisites, exclusions,
acceptance scenarios and backlog references. Split by deliverable capability,
not by table or technical layer; preserve shared integrity and isolation gates.

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

**Version**: 1.3.0 | **Ratified**: 2026-08-27 | **Last Amended**: 2026-10-14
