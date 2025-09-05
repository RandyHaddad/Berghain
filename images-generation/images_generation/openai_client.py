from __future__ import annotations

import base64
import io
import os
from typing import Optional

from tenacity import stop_after_attempt, wait_exponential_jitter, Retrying

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

from PIL import Image
import httpx


class ImageResult:
    def __init__(self, content: bytes, mime: str):
        self.content = content
        self.mime = mime


def _to_format(content: bytes, fmt: str) -> bytes:
    fmt = fmt.lower()
    if fmt in ("png", "jpg", "jpeg", "webp"):
        with Image.open(io.BytesIO(content)) as im:
            out = io.BytesIO()
            save_fmt = "JPEG" if fmt in ("jpg", "jpeg") else fmt.upper()
            im.save(out, format=save_fmt)
            return out.getvalue()
    return content


def _download_url(url: str) -> bytes:
    with httpx.Client(timeout=60.0) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.content


class OpenAIImageClient:
    def __init__(self, *, api_key: Optional[str], attempts: int, base_seconds: float, max_seconds: float, debug: bool = False):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY missing; set in environment or .env")
        self.attempts = attempts
        self.base_seconds = base_seconds
        self.max_seconds = max_seconds
        self._client = OpenAI() if OpenAI else None
        self.debug = debug

    def generate(
        self,
        *,
        prompt: str,
        size: str,
        out_format: str,
        model: str = "gpt-image-1",
        # Legacy single reference image (kept for backward compat)
        reference_image_path: str | None = None,
        # New: background base image for edits and optional mask
        background_image_path: str | None = None,
        mask_path: str | None = None,
        # Optional list of extra reference images (style/context only)
        reference_image_paths: list[str] | None = None,
        # Optional rendering controls
        quality: str | None = None,
        input_fidelity: str | None = None,
        background: str | None = None,
        moderation: str | None = None,
    ) -> ImageResult:
        out_format = out_format.lower()
        target_size = size
        for attempt in Retrying(
            stop=stop_after_attempt(self.attempts),
            wait=wait_exponential_jitter(initial=self.base_seconds, max=self.max_seconds),
            reraise=True,
        ):
            with attempt:
                # 1) If both background and reference images are provided, use new multi-image API
                if background_image_path and reference_image_path:
                    if self._client is None:
                        raise RuntimeError("OpenAI SDK client not available for image edits; install/openai or set up environment correctly.")
                    if self.debug:
                        print(f"[images] SDK edits (multi-image): model={model}, size={target_size}, bg={background_image_path}, ref={reference_image_path}")

                    # Open both images - background first, then reference
                    bg_f = open(background_image_path, "rb")
                    ref_f = open(reference_image_path, "rb")
                    try:
                        # Set target size to match background
                        try:
                            with Image.open(background_image_path) as _bg_im:
                                target_size = f"{_bg_im.size[0]}x{_bg_im.size[1]}"
                        except Exception:
                            pass

                        kwargs = {
                            "model": model,
                            "prompt": prompt,
                            "image": [bg_f, ref_f],  # Background first, reference second
                            "size": target_size,
                        }
                        if quality is not None:
                            kwargs["quality"] = quality
                        if input_fidelity is not None:
                            kwargs["input_fidelity"] = input_fidelity
                        if background is not None:
                            kwargs["background"] = background
                        if moderation is not None:
                            kwargs["moderation"] = moderation
                        
                        resp = self._client.images.edit(**kwargs)
                    finally:
                        try:
                            bg_f.close()
                        except Exception:
                            pass
                        try:
                            ref_f.close()
                        except Exception:
                            pass

                    data0 = resp.data[0]
                    if hasattr(data0, "b64_json") and data0.b64_json:  # type: ignore[attr-defined]
                        raw = base64.b64decode(data0.b64_json)  # type: ignore[attr-defined]
                    elif hasattr(data0, "url") and data0.url:  # type: ignore[attr-defined]
                        raw = _download_url(data0.url)  # type: ignore[attr-defined]
                    else:
                        raise RuntimeError("Image response missing b64_json and url")
                    content = _to_format(raw, out_format)
                    mime = "image/webp" if out_format == "webp" else (
                        "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                    )
                    return ImageResult(content=content, mime=mime)

                # 2) If only background image is provided, use it for editing
                elif background_image_path:
                    if self._client is None:
                        raise RuntimeError("OpenAI SDK client not available for image edits; install/openai or set up environment correctly.")
                    if self.debug:
                        print(f"[images] SDK edits (background-only): model={model}, size={target_size}, bg={background_image_path}")

                    bg_f = open(background_image_path, "rb")
                    try:
                        # Set target size to match background
                        try:
                            with Image.open(background_image_path) as _bg_im:
                                target_size = f"{_bg_im.size[0]}x{_bg_im.size[1]}"
                        except Exception:
                            pass

                        kwargs = {
                            "model": model,
                            "prompt": prompt,
                            "image": bg_f,
                            "size": target_size,
                        }
                        if quality is not None:
                            kwargs["quality"] = quality
                        if input_fidelity is not None:
                            kwargs["input_fidelity"] = input_fidelity
                        if background is not None:
                            kwargs["background"] = background
                        if moderation is not None:
                            kwargs["moderation"] = moderation
                        
                        resp = self._client.images.edit(**kwargs)
                    finally:
                        try:
                            bg_f.close()
                        except Exception:
                            pass

                    data0 = resp.data[0]
                    if hasattr(data0, "b64_json") and data0.b64_json:  # type: ignore[attr-defined]
                        raw = base64.b64decode(data0.b64_json)  # type: ignore[attr-defined]
                    elif hasattr(data0, "url") and data0.url:  # type: ignore[attr-defined]
                        raw = _download_url(data0.url)  # type: ignore[attr-defined]
                    else:
                        raise RuntimeError("Image response missing b64_json and url")
                    content = _to_format(raw, out_format)
                    mime = "image/webp" if out_format == "webp" else (
                        "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                    )
                    return ImageResult(content=content, mime=mime)

                # 3) Otherwise, if a single reference image is provided, prefer SDK edits; fallback to HTTP edits
                elif reference_image_path:
                    if self._client is not None:
                        if self.debug:
                            print(f"[images] SDK edit: model={model}, size={target_size}, image={reference_image_path}")
                        try:
                            with open(reference_image_path, "rb") as f:
                                resp = self._client.images.edit(
                                    model=model,
                                    prompt=prompt,
                                    image=f,
                                    size=target_size,
                                )
                            data0 = resp.data[0]
                            if hasattr(data0, "b64_json") and data0.b64_json:  # type: ignore[attr-defined]
                                raw = base64.b64decode(data0.b64_json)  # type: ignore[attr-defined]
                            elif hasattr(data0, "url") and data0.url:  # type: ignore[attr-defined]
                                raw = _download_url(data0.url)  # type: ignore[attr-defined]
                            else:
                                raise RuntimeError("Image response missing b64_json and url")
                            content = _to_format(raw, out_format)
                            mime = "image/webp" if out_format == "webp" else (
                                "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                            )
                            return ImageResult(content=content, mime=mime)
                        except Exception as e:
                            if self.debug:
                                print(f"[images] SDK edit failed; falling back to HTTP edits: {e}")

                    # HTTP edits (single image, no mask)
                    with httpx.Client(timeout=60.0) as client:
                        url = "https://api.openai.com/v1/images/edits"
                        headers = {"Authorization": f"Bearer {self.api_key}"}
                        data = {"model": model, "prompt": prompt, "size": target_size}
                        with open(reference_image_path, "rb") as f:
                            files = {"image": (os.path.basename(reference_image_path), f, "application/octet-stream")}
                            if self.debug:
                                print(f"[images] HTTP edits: model={model}, size={target_size}, image={reference_image_path}")
                        r = client.post(url, headers=headers, data=data, files=files)
                        r.raise_for_status()
                        j = r.json()
                        item0 = j["data"][0]
                        if "b64_json" in item0 and item0["b64_json"]:
                            raw = base64.b64decode(item0["b64_json"])
                        elif "url" in item0 and item0["url"]:
                            raw = _download_url(item0["url"])
                        else:
                            raise RuntimeError("Image response missing b64_json and url")
                        content = _to_format(raw, out_format)
                        mime = "image/webp" if out_format == "webp" else (
                            "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                        )
                        return ImageResult(content=content, mime=mime)

                # 3) Otherwise, try SDK generate
                if self._client is not None:
                    if self.debug:
                        print(f"[images] SDK generate: model={model}, size={target_size}")
                    resp = self._client.images.generate(
                        model=model,
                        prompt=prompt,
                        size=target_size,
                    )
                    data0 = resp.data[0]
                    if hasattr(data0, "b64_json") and data0.b64_json:  # type: ignore[attr-defined]
                        raw = base64.b64decode(data0.b64_json)  # type: ignore[attr-defined]
                    elif hasattr(data0, "url") and data0.url:  # type: ignore[attr-defined]
                        raw = _download_url(data0.url)  # type: ignore[attr-defined]
                    else:
                        raise RuntimeError("Image response missing b64_json and url")
                    content = _to_format(raw, out_format)
                    mime = "image/webp" if out_format == "webp" else (
                        "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                    )
                    return ImageResult(content=content, mime=mime)

                # 4) Fallback HTTP generate
                with httpx.Client(timeout=60.0) as client:
                    url = "https://api.openai.com/v1/images/generations"
                    headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                    payload = {"model": model, "prompt": prompt, "size": target_size}
                    if self.debug:
                        print(f"[images] HTTP generate: keys={list(payload.keys())}, size={target_size}")
                    r = client.post(url, headers=headers, json=payload)
                    r.raise_for_status()
                    j = r.json()
                    item0 = j["data"][0]
                    if "b64_json" in item0 and item0["b64_json"]:
                        raw = base64.b64decode(item0["b64_json"])
                    elif "url" in item0 and item0["url"]:
                        raw = _download_url(item0["url"])
                    else:
                        raise RuntimeError("Image response missing b64_json and url")
                    content = _to_format(raw, out_format)
                    mime = "image/webp" if out_format == "webp" else (
                        "image/jpeg" if out_format in ("jpg", "jpeg") else "image/png"
                    )
                    return ImageResult(content=content, mime=mime)
