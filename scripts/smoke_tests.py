#!/usr/bin/env python3
"""
Basic smoke tests for NWSL services.

Usage:
    ./scripts/smoke_tests.py --target api --target mcp --target viz
"""

import argparse
import sys
import requests

TARGETS = {
    "api": "https://nwsl-api-<region>-a.run.app/health",
    "mcp": "https://nwsl-mcp-<region>-a.run.app/health",
    "viz": "https://nwsl-viz-<region>-a.run.app/health",
}


def check(url: str) -> bool:
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        print(f"✓ {url} OK")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"✗ {url} failed: {exc}", file=sys.stderr)
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", action="append", choices=TARGETS.keys(), help="Service(s) to test")
    args = parser.parse_args()

    targets = args.target or TARGETS.keys()
    success = all(check(TARGETS[name]) for name in targets)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
