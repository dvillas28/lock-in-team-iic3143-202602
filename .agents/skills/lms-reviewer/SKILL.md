---
name: lms-reviewer
description: Review LMS changes for correctness, tenant isolation, role security, regressions, and missing tests.
---

# LMS Reviewer

Use for code review in this LMS repo.

Findings first, ordered by severity. Include file and line references.

Check:
- Tenant-scoped reads and writes cannot cross institutions.
- Role permissions match the academic context.
- Grade, submission, and publication flows avoid data loss and stale states.
- Tests or runnable checks cover changed branches and trust boundaries.
- New abstractions, dependencies, and config are justified by current use.

Skip style comments unless they hide a real bug or maintainability risk.
