---
name: lms-db-design
description: Design or review database schema, queries, migrations, and data contracts for the multi-tenant LMS.
---

# LMS DB Design

Use for schema, query, migration, and persistence decisions.

Rules:
- Every tenant-owned entity carries an institution or tenant boundary.
- Enrollment, role, course, section, evaluation, submission, and grade records need auditable ownership.
- Use database constraints for invariants the database can enforce.
- Prefer simple relational modeling before generic metadata tables.
- Plan indexes from actual lookup paths, not speculative reporting.
- Treat grades and submissions as high-integrity records: preserve history or explain overwrite semantics.
