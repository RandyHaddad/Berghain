from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import yaml
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
import os


class RetryConfig(BaseModel):
    attempts: int = 3
    base_seconds: float = 1.0
    max_seconds: float = 8.0


class ImageConfig(BaseModel):
    # Allowed sizes now per OpenAI: 1024x1024, 1024x1536, 1536x1024, or 'auto'.
    # Back-compat: if an int is provided (e.g., 1024), it will be coerced to '1024x1024'.
    size: str | int = Field(
        "1024x1024",
        description="Image size: 1024x1024 | 1024x1536 | 1536x1024 | auto",
    )
    format: str = Field("webp", description="Output format: webp/png/jpg")
    model: str = Field("gpt-image-1", description="OpenAI image model name")
    style: str = "exaggerated caricature, bold lines, high contrast, consistent character sheet"
    framing: str = "waist-up portrait, facing camera, slight 3/4 angle"
    negative: str = "no logos, no brand names, no text overlays"
    # Optional free-form note to append to the prompt for extra guidance
    note: str | None = None
    # Output tuning per OpenAI Images API
    quality: str | None = Field(
        default=None, description="Rendering quality: low|medium|high|auto (optional)"
    )
    input_fidelity: str | None = Field(
        default=None, description="Input fidelity for edits: low|high|auto (optional)"
    )
    background: str | None = Field(
        default=None, description="Background handling: auto|keep|replace (optional)"
    )
    moderation: str | None = Field(
        default=None, description="Moderation level: low|medium|high (optional)"
    )
    attach_image_path: str | None = Field(
        default=None,
        description="Optional reference image path to attach to the request",
    )
    # Background control for edits
    background_image_path: str | None = Field(
        default=None,
        description="Optional background image to keep fixed (used as base for edits)",
    )
    background_mask_box: List[int] | None = Field(
        default=None,
        description="Optional [x,y,w,h] box where the subject may be drawn (transparent area)",
    )
    background_mask_path: str | None = Field(
        default=None,
        description="Optional path to a PNG mask (alpha=0 = editable). Overrides mask_box if set.",
    )
    # Post-process options
    lock_background_pixels: bool = Field(
        default=False,
        description="If true, re-composite the original background outside the mask after the edit to ensure pixel-exact fidelity.",
    )
    mask_inset_px: int = Field(
        default=0,
        description="Inset (px) applied to the rectangular mask box on all sides to reduce edge bleed.",
        ge=0,
    )


class AppConfig(BaseModel):
    scenario: int = 1
    output_dir: str = "./output"
    override: bool = False
    total_images: int = 64

    seed: int = 42
    concurrency: int = 3
    retry: RetryConfig = Field(default_factory=RetryConfig)
    image: ImageConfig = Field(default_factory=ImageConfig)

    attributes: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    # Optional: list of attribute IDs that must always be True
    required_attributes: List[str] = Field(default_factory=list)
    celebrities: List[str] = Field(default_factory=list)

    @property
    def attr_ids(self) -> List[str]:
        return list(self.attributes.keys())


def load_config(path: str | Path = "config.yaml") -> AppConfig:
    load_dotenv()  # loads OPENAI_API_KEY if present
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    try:
        cfg = AppConfig(**data)
    except ValidationError as e:
        raise SystemExit(f"Invalid config: {e}")

    # Normalize/validate size
    allowed_sizes = {"1024x1024", "1024x1536", "1536x1024", "auto"}
    if isinstance(cfg.image.size, int):
        if cfg.image.size == 1024:
            cfg.image.size = "1024x1024"
        else:
            raise SystemExit(
                "image.size integer must be 1024; or use one of: 1024x1024, 1024x1536, 1536x1024, auto"
            )
    size_lower = str(cfg.image.size).lower()
    if size_lower not in allowed_sizes:
        raise SystemExit(
            "image.size must be one of: 1024x1024, 1024x1536, 1536x1024, auto"
        )
    cfg.image.size = size_lower
    if cfg.image.format.lower() not in ("webp", "png", "jpg", "jpeg"):
        raise SystemExit("image.format must be webp/png/jpg")
    if not cfg.celebrities:
        raise SystemExit("No celebrities configured")
    if not cfg.attributes:
        raise SystemExit("No attributes configured")

    # Validate attach_image_path if provided
    if cfg.image.attach_image_path:
        p = Path(cfg.image.attach_image_path)
        if not p.exists():
            raise SystemExit(f"attach_image_path not found: {p}")

    # Validate background controls
    if cfg.image.background_image_path:
        bp = Path(cfg.image.background_image_path)
        if not bp.exists():
            raise SystemExit(f"background_image_path not found: {bp}")
        # If a mask path is given, ensure it exists
        if cfg.image.background_mask_path:
            mp = Path(cfg.image.background_mask_path)
            if not mp.exists():
                raise SystemExit(f"background_mask_path not found: {mp}")
        # If a mask box is given, ensure it is valid
        if cfg.image.background_mask_box is not None:
            box = cfg.image.background_mask_box
            if not (isinstance(box, list) and len(box) == 4 and all(isinstance(v, int) and v >= 0 for v in box)):
                raise SystemExit("background_mask_box must be a list of four non-negative integers: [x, y, w, h]")

    # Validate quality / input_fidelity
    if cfg.image.quality is not None:
        if cfg.image.quality not in ("low", "medium", "high", "auto"):
            raise SystemExit("image.quality must be one of: low|medium|high|auto")
    if cfg.image.input_fidelity is not None:
        if cfg.image.input_fidelity not in ("low", "high", "auto"):
            raise SystemExit("image.input_fidelity must be one of: low|high|auto")

    return cfg
