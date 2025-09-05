from __future__ import annotations

from typing import Dict, List


def build_structured_prompt(
    *,
    celebrity: str,
    attributes: Dict[str, bool],
    image_cfg: dict,
) -> dict:
    true_attr_visuals: List[str] = []
    for aid, flag in attributes.items():
        if flag is True:
            # image_cfg may not include visuals mapping; caller can compile visuals
            visual = image_cfg.get("__attr_visuals__", {}).get(aid)
            if visual:
                true_attr_visuals.append(visual)
    ref_note = None
    if image_cfg.get("attach_image_path"):
        ref_note = f"REFERENCE IMAGE: Use the attached reference image for {celebrity}'s exact physical appearance, facial structure, hair, and distinctive features. Draw the caricature to clearly resemble this person while maintaining the caricature style."
    bg_rule = None
    if image_cfg.get("background_image_path"):
        bg_rule = (
            "BACKGROUND CONSTRAINT: Do not alter the provided background image. Only draw the subject within the masked area; "
            "match the caricature style and lighting already present in the background."
        )

    data = {
        "setting": "queue outside Berghain nightclub, night, moody light, visible line",
        "style": image_cfg.get(
            "style",
            "stylized caricature, bold lines, high contrast, subtle feature emphasis",
        ),
        "celebrity": celebrity,
        "attributes": attributes,
        "visual_instructions": (
            [
                "playful caricature style, emphasized distinctive features, recognizable likeness",
                image_cfg.get("framing", "waist-up portrait, facing camera, slight 3/4 angle"),
            ]
            + true_attr_visuals
        ),
        "background": image_cfg.get("background", None),
        # carry through any negative constraints provided by config
        "negative": image_cfg.get("negative", None),
        # optional free-form note from config
        "note": image_cfg.get("note", None),
        # optional background rule if background_image_path provided
        "background_rule": bg_rule,
        "reference_note": ref_note,
    }
    return data


def structured_to_text_prompt(data: dict) -> str:
    celebrity = data.get("celebrity")
    setting = data.get("setting")
    style = data.get("style")
    background = data.get("background")
    vis_list = data.get("visual_instructions", [])
    vis_text = ", ".join(v for v in vis_list if v)
    ref_note = data.get("reference_note")
    negative = data.get("negative")
    note = data.get("note")
    bg_rule = data.get("background_rule")
    prompt = (
        f"Caricature portrait of {celebrity}, waiting in line outside Berghain at night; "
        f"setting: {setting}; style: {style}; visual cues: {vis_text};"
    )
    if background:
        prompt += f" background: {background};"
    prompt += "."
    if negative:
        prompt += f" Avoid: {negative}."
    if ref_note:
        prompt += f" Use reference: {ref_note}"
    if bg_rule:
        prompt += f" Constraint: {bg_rule}"
    if note:
        prompt += f" Note: {note}"
    return prompt
