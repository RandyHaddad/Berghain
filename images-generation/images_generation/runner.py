from __future__ import annotations

import asyncio
from dataclasses import asdict
import io
from pathlib import Path
from typing import Dict, List, Tuple

from tqdm import tqdm

from .config import AppConfig
from .abbreviations import make_attribute_tokens, encode_combo
from .combos import enumerate_bit_combos, plan_assignments, analyze_celebrity_distribution
from .fileio import (
    filename_for,
    read_manifest,
    scenario_dir,
    slugify_celeb,
    write_manifest,
)
from .openai_client import OpenAIImageClient
from .prompt_builder import build_structured_prompt, structured_to_text_prompt
from .utils import utc_now_iso, build_rect_mask_and_preview, normalize_mask_to_alpha
import json


def json_dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


async def _generate_one(
    sem: asyncio.Semaphore,
    client: OpenAIImageClient,
    cfg: AppConfig,
    scenario_path: Path,
    celeb: str,
    bits: List[int],
    tokens_ordered: List[str],
    attr_ids: List[str],
    attr_visuals: Dict[str, str],
    dry_run: bool,
) -> Tuple[str, str, Dict[str, bool], bool, str]:
    """
    Returns: (filename, celeb, attributes, skipped, error_message)
    """
    attributes = {aid: bool(b) for aid, b in zip(attr_ids, bits)}
    code = encode_combo(bits, tokens_ordered)
    celeb_slug = slugify_celeb(celeb)
    out_path = filename_for(scenario_path, celeb_slug, code, cfg.image.format)

    if out_path.exists() and not cfg.override:
        return (str(out_path.name), celeb, attributes, True, "")

    structured = build_structured_prompt(
        celebrity=celeb,
        attributes=attributes,
        image_cfg={
            **cfg.image.model_dump(),
            "__attr_visuals__": attr_visuals,
        },
    )
    prompt = structured_to_text_prompt(structured)

    async with sem:
        try:
            if dry_run:
                return (str(out_path.name), celeb, attributes, False, "DRY_RUN")
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                lambda: client.generate(
                    prompt=prompt,
                    size=str(cfg.image.size),
                    out_format=cfg.image.format,
                    model=cfg.image.model,
                    # Keep legacy single reference for style if provided
                    reference_image_path=cfg.image.attach_image_path,
                    # New background support (no masking)
                    background_image_path=cfg.image.background_image_path,
                    quality=cfg.image.quality,
                    input_fidelity=cfg.image.input_fidelity,
                    background=cfg.image.background,
                    moderation=cfg.image.moderation,
                ),
            )
            # Save the result directly (no post-processing needed with new API)
            out_path.write_bytes(result.content)
            return (str(out_path.name), celeb, attributes, False, "")
        except Exception as e:  # noqa: BLE001
            return (str(out_path.name), celeb, attributes, False, str(e))


async def run(cfg: AppConfig, *, dry_run: bool = False, verbose: bool = False) -> None:
    scenario_path = scenario_dir(cfg.output_dir, cfg.scenario)

    # Note: Masking logic removed - using new multi-image API without masks

    # Tokens and combos
    attr_ids = cfg.attr_ids
    tokens_map = make_attribute_tokens(attr_ids)
    tokens_ordered = [tokens_map[a] for a in attr_ids]
    
    # Calculate required attribute indices
    required_indices = []
    for req_attr in cfg.required_attributes:
        if req_attr in attr_ids:
            required_indices.append(attr_ids.index(req_attr))
    
    combos = enumerate_bit_combos(len(attr_ids), required_indices)

    # Plan assignments (deterministic)
    pairs = plan_assignments(
        total_images=cfg.total_images,
        combos=combos,
        celebrities=cfg.celebrities,
        seed=cfg.seed,
        attr_ids=attr_ids,
    )
    
    # Show celebrity distribution in verbose mode
    if verbose:
        distribution = analyze_celebrity_distribution(pairs)
        print(f"Celebrity distribution for {cfg.total_images} images:")
        for celeb, count in distribution.items():
            print(f"  {celeb}: {count} image(s)")
        print()

    # Dry run: print planned filenames and exit without API calls or manifest writes
    if dry_run:
        attr_visuals = {aid: (cfg.attributes.get(aid, {})).get("visual", "") for aid in attr_ids}
        print("Planned outputs:")
        for bits, celeb in pairs:
            code = encode_combo(bits, tokens_ordered)
            celeb_slug = slugify_celeb(celeb)
            out_path = filename_for(scenario_path, celeb_slug, code, cfg.image.format)
            print(f"- {out_path}")
        print(f"Total planned: {len(pairs)}")
        return

    # Client and semaphore
    client = OpenAIImageClient(
        api_key=None,
        attempts=cfg.retry.attempts,
        base_seconds=cfg.retry.base_seconds,
        max_seconds=cfg.retry.max_seconds,
        debug=verbose,
    )
    sem = asyncio.Semaphore(cfg.concurrency)

    # Build visuals lookup for attributes
    attr_visuals = {aid: (cfg.attributes.get(aid, {})).get("visual", "") for aid in attr_ids}

    # Existing manifest
    manifest = read_manifest(scenario_path)
    items = {item["filename"]: item for item in manifest.get("items", [])}

    tasks = []
    for bits, celeb in pairs:
        tasks.append(
            _generate_one(
                sem,
                client,
                cfg,
                scenario_path,
                celeb,
                bits,
                tokens_ordered,
                attr_ids,
                attr_visuals,
                dry_run,
            )
        )

    generated = 0
    skipped = 0
    errors = 0
    error_items: List[dict] = []
    results: List[Tuple[str, str, Dict[str, bool], bool, str]] = []
    for coro in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="images"):
        fn, celeb, attrs, was_skipped, err = await coro
        if err and err != "DRY_RUN":
            errors += 1
            error_items.append({
                "filename": fn,
                "celebrity": celeb,
                "error": err,
            })
            if verbose:
                print(f"[ERROR] {fn} ({celeb}): {err}")
        elif was_skipped:
            skipped += 1
            if verbose:
                print(f"[SKIP] {fn} already exists (override={cfg.override})")
        else:
            generated += 1
            if verbose:
                print(f"[OK]   {fn}")
        results.append((fn, celeb, attrs, was_skipped, err))

    # Update manifest
    for fn, celeb, attrs, was_skipped, err in results:
        if err and err != "DRY_RUN":
            continue
        items[fn] = {
            "filename": fn,
            "celebrity": celeb,
            "attributes": attrs,
            "scenario": cfg.scenario,
            "size": cfg.image.size,
            "format": cfg.image.format,
            "createdAt": utc_now_iso(),
        }

    manifest = {
        "scenario": cfg.scenario,
        "items": sorted(items.values(), key=lambda x: x["filename"]),
    }
    write_manifest(scenario_path, manifest)

    # Write error log if any
    if error_items:
        (scenario_path / "errors.json").write_text(
            json_dumps(error_items), encoding="utf-8"
        )

    print(
        f"Summary: generated={generated}, skipped={skipped}, errors={errors}, total_planned={len(tasks)}"
    )
    if not verbose and error_items:
        # Show first few errors to help debugging
        print("Sample errors (first 5):")
        for it in error_items[:5]:
            print(f" - {it['filename']}: {it['error']}")
