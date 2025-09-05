from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import random
from typing import Any
from pathlib import Path


def build_rect_mask_and_preview(
    *,
    background_path: Path,
    box_xywh: tuple[int, int, int, int],
    inset_px: int = 0,
    out_mask_path: Path,
    out_preview_path: Path,
) -> None:
    """
    Creates a PNG mask where the box area is transparent (editable) and the rest is opaque black
    (kept). Also writes a preview image overlaying a semi-transparent black box on top of the background
    to visualize the editable region.
    """
    from PIL import Image, ImageDraw

    with Image.open(background_path) as bg:
        w, h = bg.size
        x, y, bw, bh = box_xywh
        inset = max(0, int(inset_px))
        x += inset
        y += inset
        bw = max(0, bw - 2 * inset)
        bh = max(0, bh - 2 * inset)
        # Clamp box to image bounds
        x = max(0, min(x, w))
        y = max(0, min(y, h))
        bw = max(0, min(bw, w - x))
        bh = max(0, min(bh, h - y))

        # Mask: RGBA with WHITE opaque outside (kept), TRANSPARENT inside box (editable)
        # Some backends are stricter about white=keep; using white avoids ambiguity.
        mask = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        if bw > 0 and bh > 0:
            draw = ImageDraw.Draw(mask)
            draw.rectangle([x, y, x + bw, y + bh], fill=(255, 255, 255, 0))
        out_mask_path.parent.mkdir(parents=True, exist_ok=True)
        mask.save(out_mask_path)

        # Preview: overlay semi-transparent black rectangle on the background
        preview = bg.convert("RGBA").copy()
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw2 = ImageDraw.Draw(overlay)
        alpha = 140  # visible but not overpowering
        if bw > 0 and bh > 0:
            draw2.rectangle([x, y, x + bw, y + bh], fill=(0, 0, 0, alpha))
        composed = Image.alpha_composite(preview, overlay)
        out_preview_path.parent.mkdir(parents=True, exist_ok=True)
        composed.save(out_preview_path)


def normalize_mask_to_alpha(
    *,
    raw_mask_path: Path,
    background_path: Path,
    out_mask_path: Path,
    threshold: int = 128,
) -> None:
    """
    Ensures a mask image is a proper RGBA mask for OpenAI edits:
    - Output RGB is solid white; alpha channel defines transparency.
    - If the input already has an alpha channel with some transparency, we keep its alpha.
    - Otherwise, we derive alpha from luminance: pixels darker than `threshold` become transparent (0),
      others opaque (255). Useful when the provided mask is a painted black shape over the background.
    - The output is resized to match the background size if needed.
    """
    from PIL import Image, ImageOps

    with Image.open(background_path) as bg:
        bg_size = bg.size

    with Image.open(raw_mask_path) as m:
        # Resize to background size if different
        if m.size != bg_size:
            m = m.resize(bg_size, Image.NEAREST)

        # If image has alpha with any transparency, keep it
        has_alpha = m.mode in ("LA", "RGBA")
        if has_alpha:
            alpha = m.split()[-1]
            # Check if any pixel is transparent
            bbox = alpha.getbbox()
            any_transparent = bbox is not None and alpha.getextrema()[0] < 255
        else:
            any_transparent = False

        if any_transparent:
            alpha_out = m.split()[-1]
        else:
            # Derive alpha from luminance (black -> transparent, white/bright -> opaque)
            lum = m.convert("L")
            # Binary threshold
            alpha_out = lum.point(lambda v: 0 if v < threshold else 255, mode="L")

        # Compose final white RGBA with derived alpha
        mask_out = Image.new("RGBA", m.size, (255, 255, 255, 255))
        mask_out.putalpha(alpha_out)

        out_mask_path.parent.mkdir(parents=True, exist_ok=True)
        mask_out.save(out_mask_path)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def seeded_random(seed: int) -> random.Random:
    return random.Random(seed)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
