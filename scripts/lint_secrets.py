#!/usr/bin/env python3
"""
Simple scanner that looks for hard-coded secret patterns in repositories.
Extend this script with additional regexes or directory exclusions as needed.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

PATTERNS = [
    re.compile(r"postgresql://[^'\"]+:[^'\"]+@"),
    re.compile(r"sk-[A-Za-z0-9]{20,}"),  # OpenAI-style keys
]


def scan_file(path: pathlib.Path) -> list[str]:
    findings: list[str] = []
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return findings

    for pattern in PATTERNS:
        for match in pattern.finditer(text):
            findings.append(f"{path}:{match.group(0)}")
    return findings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", help="Path to scan", nargs="?", default="..")
    args = parser.parse_args()

    root = pathlib.Path(args.root).resolve()
    findings: list[str] = []

    for path in root.rglob("*"):
        if path.is_file() and path.suffix not in {".png", ".jpg", ".mp4", ".pdf"}:
            findings.extend(scan_file(path))

    if findings:
        print("Potential secrets detected:")
        for item in findings:
            print(f"  {item}")
        sys.exit(1)
    else:
        print("No obvious secrets found.")


if __name__ == "__main__":
    main()
