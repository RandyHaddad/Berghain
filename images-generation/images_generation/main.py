from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from .config import load_config
from .runner import run


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate caricature images for attribute combinations.")
    parser.add_argument("--config", default="config.yaml", help="Path to YAML config")
    parser.add_argument("--dry-run", action="store_true", help="Plan and print without generating")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print per-file logs and errors")
    args = parser.parse_args(argv)

    cfg = load_config(args.config)
    try:
        asyncio.run(run(cfg, dry_run=args.dry_run, verbose=args.verbose))
        return 0
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
