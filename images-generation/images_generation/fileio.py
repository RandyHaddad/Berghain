from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def slugify_celeb(name: str) -> str:
    s = name.strip().lower()
    s = s.replace("&", " and ")
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_"):
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    slug = slug.strip("-")
    return slug or "celebrity"


def scenario_dir(output_dir: str, scenario: int) -> Path:
    p = Path(output_dir).expanduser().resolve() / f"scenario_{scenario}"
    p.mkdir(parents=True, exist_ok=True)
    return p


def filename_for(scenario_dir: Path, celeb_slug: str, code: str, ext: str) -> Path:
    ext = ext.lower().lstrip(".")
    return scenario_dir / f"{celeb_slug}__{code}.{ext}"


def manifest_path(scenario_dir: Path) -> Path:
    return scenario_dir / "manifest.json"


def read_manifest(scenario_dir: Path) -> Dict[str, Any]:
    p = manifest_path(scenario_dir)
    if not p.exists():
        return {"items": []}
    try:
        return json.loads(p.read_text("utf-8"))
    except Exception:
        return {"items": []}


def write_manifest(scenario_dir: Path, manifest: Dict[str, Any]) -> None:
    p = manifest_path(scenario_dir)
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(p)

