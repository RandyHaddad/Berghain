from __future__ import annotations

import re
from typing import Dict, List


def _initial_token(attr_id: str) -> str:
    parts = re.split(r"[_\-\s]+", attr_id.strip())
    parts = [p for p in parts if p]
    if not parts:
        return attr_id[:3].upper()
    initials = "".join(p[0] for p in parts).upper()
    return initials


def make_attribute_tokens(attr_ids: List[str]) -> Dict[str, str]:
    tokens: Dict[str, str] = {}
    used: set[str] = set()
    for aid in attr_ids:
        base = _initial_token(aid)
        token = base
        if token not in used:
            tokens[aid] = token
            used.add(token)
            continue
        # Resolve collisions by extending letters from parts
        parts = re.split(r"[_\-\s]+", aid.strip())
        parts = [p for p in parts if p]
        extended = list(base)
        idxs = [1] * len(parts)  # next letter index per part
        MAX_TRIES = 10
        tried = 0
        while tried < MAX_TRIES:
            for pi, part in enumerate(parts):
                if idxs[pi] < len(part):
                    extended.append(part[idxs[pi]].upper())
                    idxs[pi] += 1
                    candidate = "".join(extended)
                    if candidate not in used:
                        token = candidate
                        break
            if token not in used:
                break
            tried += 1
        if token in used:
            token = aid[:3].upper()
            suffix = 1
            while token in used and suffix < 100:
                token = (aid[:3] + str(suffix)).upper()
                suffix += 1
        tokens[aid] = token
        used.add(token)
    return tokens


def encode_combo(bits: List[int], tokens_ordered: List[str]) -> str:
    parts = []
    for bit, tok in zip(bits, tokens_ordered):
        parts.append(f"{tok}{int(bit)}")
    return "_".join(parts)

