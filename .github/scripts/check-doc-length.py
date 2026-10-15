#!/usr/bin/env python3
"""Enforce bounded authored Markdown on the current change, including new files."""

import argparse
from pathlib import Path
import re
import subprocess
import tempfile


def git(*args):
    return subprocess.check_output(["git", *args]).decode().rstrip("\n")


def authored(name):
    return name.endswith(".md") and (
        name.startswith(("docs/", "specs/", ".specify/memory/", ".specify/templates/"))
        or name in {"README.md", "AGENTS.md", "DESIGN.md"}
    )


def violation(path):
    content = path.read_text(encoding="utf-8")
    count = len(content.splitlines())
    if count > 200:
        return f"{count} lines: maximum 200; split and link from an index"
    if count >= 150 and not re.search(
        r"<!-- length-exception: [^\r\n]*\S[^\r\n]* -->", content
    ):
        return f"{count} lines: target <150; add a length-exception justification"
    return None


def self_test():
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "doc.md"
        for count, exception, rejected in (
            (149, False, False), (150, False, True), (200, False, True),
            (150, True, False), (200, True, False), (201, True, True),
        ):
            first = "<!-- length-exception: required reference -->" if exception else "x"
            path.write_text(first + "\n" + "x\n" * (count - 1))
            assert bool(violation(path)) == rejected, (count, exception)
        path.write_text("<!-- length-exception:  -->\n" + "x\n" * 149)
        assert violation(path)
        path.write_text("x\n" * 149 + "x")
        assert violation(path)  # Count a final line even without newline.
    assert authored("specs/mission/spec.md")
    assert not authored(".agents/skills/imported/SKILL.md")
    assert not authored("docs/report.pdf")
    print("Documentation length self-check passed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Compare a committed change against this revision")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    root = Path(git("rev-parse", "--show-toplevel"))
    revision = git("rev-parse", "--verify", args.base + "^{commit}") if args.base else "HEAD"
    diff_args = ["diff", "--name-only", "-z", "--diff-filter=ACMR", revision]
    if args.base:
        diff_args.append("HEAD")
    names = set(git(*diff_args).split("\0"))
    if not args.base:
        names.update(git("ls-files", "--others", "--exclude-standard", "-z").split("\0"))
    failures = []
    checked = 0
    for name in sorted(names):
        path = root / name
        if authored(name) and path.is_file():
            checked += 1
            error = violation(path)
            if error:
                failures.append(f"{name}: {error}")
    print("\n".join(failures) if failures else f"Documentation length passed ({checked} files)")
    raise SystemExit(bool(failures))


if __name__ == "__main__":
    main()
