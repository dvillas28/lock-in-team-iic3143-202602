---
name: speckit-git-validate
description: Validate current branch follows feature branch naming conventions
metadata:
  author: github-spec-kit
  source: git:commands/speckit.git.validate.md
---

# Validate Feature Branch

Validate that the current Git branch follows the expected feature branch naming conventions.

## Prerequisites

- Check if Git is available by running `git rev-parse --is-inside-work-tree 2>/dev/null`
- If Git is not available, output a warning and skip validation:
  ```
  [specify] Warning: Git repository not detected; skipped branch validation
  ```

## Validation Rules

Get the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

The branch name must match one of these patterns:

1. **Team GitFlow**: `<type>/<short-name>` (e.g., `feat/course-sections`, `fix/grade-publication`)
2. **Legacy Sequential**: `^[0-9]{3,}-` (e.g., `001-feature-name`, `042-fix-bug`)
3. **Legacy Timestamp**: `^[0-9]{8}-[0-9]{6}-` (e.g., `20260319-143022-feature-name`)

## Execution

If on a valid branch:
- Output: `✓ On feature branch: <branch-name>`
- Check if the corresponding spec directory exists under `specs/`:
  - For Team GitFlow branches, do not require a matching spec directory. Use
    `SPECIFY_FEATURE_DIRECTORY` when targeting a specific spec.
  - For sequential branches, look for `specs/<prefix>-*` where prefix matches the numeric portion
  - For timestamp branches, look for `specs/<prefix>-*` where prefix matches the `YYYYMMDD-HHMMSS` portion
- If spec directory exists: `✓ Spec directory found: <path>`
- If spec directory missing: `⚠ No spec directory found for prefix <prefix>`

If NOT on a valid branch:
- Output: `✗ Branch does not follow team GitFlow. Current branch: <branch-name>`
- Output: `Feature branches should be named like: feat/short-name or fix/short-name`

## Graceful Degradation

If Git is not installed or the directory is not a Git repository:
- Check the `SPECIFY_FEATURE` environment variable as a fallback
- If set, validate that value against the naming patterns
- If not set, skip validation with a warning
