# Tasks: [FEATURE NAME]

**Input**: `specs/YYYYMMDD-HHMMSS_descripcion-mision/`
**Prerequisites**: spec.md, plan.md, applicable contracts and data model.
**Organization**: Group by independently testable user story; retain backlog owners.
**Documentation**: Target <150 physical lines per file; justify 150–200 with a
length-exception comment; split above 200 and link child task files here.

## Format

`- [ ] T001 [P?] [US1] Action with exact file path and acceptance reference`

- `[P]` means different files and no unresolved dependency.
- Each task references a spec requirement or acceptance scenario.
- Tests are required for non-trivial behavior, isolation, permissions and integrity.
- Use actual repository paths: `backend/src/`, `frontend/src/`, applicable tests.
- Replace examples with feature-specific tasks; do not retain sample scaffolding.

## Phase 1: Setup

- [ ] T001 Confirm source CU/RF/RNF, backlog references, prerequisites and exclusions.
- [ ] T002 Confirm plan-selected stack, migrations and local verification commands.

## Phase 2: Foundation

- [ ] T003 Define tenant scope and persisted authorization for shared data paths.
- [ ] T004 Define transactional audit/history for sensitive writes.
- [ ] T005 Add only shared prerequisites needed by the current stories.

**Checkpoint**: Resolve permission clarifications before implementing dependent flows.

## Phase 3: User Story 1 - [title] (Priority: P1)

**Goal**: [user outcome]
**Independent Test**: [observable result with prerequisite fixtures]

### Verification

- [ ] T006 [US1] Cover accepted/rejected inputs and role scopes in [test path].
- [ ] T007 [US1] Cover UC/UTFSM crossed reads, writes and relations in [test path].
- [ ] T008 [US1] Cover atomic rollback, retry and concurrency when applicable.

### Implementation

- [ ] T009 [US1] Implement required persistence and constraints in [path].
- [ ] T010 [US1] Implement domain behavior and authorization in [path].
- [ ] T011 [US1] Expose agreed contract and sanitized output in [path].
- [ ] T012 [US1] Run story checks and demonstrate its acceptance scenarios.

**Checkpoint**: Story delivers its own outcome on the declared foundation.
Repeat this phase for each remaining story, with unique task IDs.

## Phase N: Integration and delivery

- [ ] TXXX Verify affected contracts, callers, fixtures and exports.
- [ ] TXXX Verify migrations and bootstrap in an empty and populated environment.
- [ ] TXXX Update relevant OpenAPI, operational instructions and evidence.
- [ ] TXXX Run required lint, tests and documentation length check.
- [ ] TXXX Record implemented vs. deferred requirements without marking pending work done.

## Dependencies & Execution Order

- Setup precedes foundation; story implementation starts after its prerequisites.
- Each story declares dependencies; do not invent independence between required specs.
- Shared migrations have one owner; parallel tasks must avoid conflicting files.
- Audit generation ships with the first sensitive write, including onboarding and privilege delegation.
- Publication and grading require concurrency and visibility checks before merge.

## Implementation Strategy

1. Complete foundation without adding future infrastructure.
2. Implement the highest-priority story and run its acceptance checks.
3. Deliver subsequent stories incrementally and preserve prior behavior.
4. Close with traceability, negative tests and operational evidence.
