from __future__ import annotations

from typing import List, Sequence, Tuple, Optional, Set, Dict
import random
from collections import Counter


def enumerate_bit_combos(n: int, required_indices: Optional[List[int]] = None) -> List[List[int]]:
    """Generate all possible bit combinations, with certain positions forced to 1."""
    if n <= 0:
        return [[]]
    
    required_indices = required_indices or []
    combos: List[List[int]] = []
    total = 1 << n
    
    for i in range(total):
        bits = [(i >> k) & 1 for k in range(n)]
        
        # Force required attributes to be True (1)
        for idx in required_indices:
            if 0 <= idx < len(bits):
                bits[idx] = 1
        
        combos.append(bits)
    return combos


def plan_assignments(
    *,
    total_images: int,
    combos: Sequence[List[int]],
    celebrities: Sequence[str],
    seed: int,
    attr_ids: Optional[Sequence[str]] = None,
    international_attr: str = "international",
    forbidden_international_celebrities: Optional[Sequence[str]] = None,
) -> List[Tuple[List[int], str]]:
    if total_images <= 0:
        return []
    n_combos = len(combos)
    rng = random.Random(seed)

    # Ensure fair celebrity distribution: all celebrities appear before any repeats
    # Create shuffled cycles where each celebrity appears once per cycle
    celeb_stream: List[str] = []
    cycles_needed = (total_images + len(celebrities) - 1) // len(celebrities)  # Ceiling division
    
    for cycle_num in range(cycles_needed):
        cycle = list(celebrities)
        rng.shuffle(cycle)
        celeb_stream.extend(cycle)
        if len(celeb_stream) >= total_images:
            break
    
    # Trim to exact number needed
    celeb_stream = celeb_stream[:total_images]

    # Prepare restriction logic (simple and deterministic)
    intl_index: Optional[int] = None
    if attr_ids is not None and international_attr in attr_ids:
        intl_index = list(attr_ids).index(international_attr)
    forbidden: Set[str] = set(forbidden_international_celebrities or ["Angela Merkel", "Olaf Scholz"])

    def violates(bits: List[int], celeb: str) -> bool:
        if intl_index is None:
            return False
        is_international = bool(bits[intl_index])
        return is_international and celeb in forbidden

    pairs: List[Tuple[List[int], str]] = []
    j = 0  # pointer into celeb_stream
    for t in range(total_images):
        bits = list(combos[t]) if t < n_combos else list(combos[t % n_combos])
        # Advance celeb pointer until non-violating
        guard = 0
        while j < len(celeb_stream) and violates(bits, celeb_stream[j]) and guard < len(celebrities) * 2:
            j += 1
            guard += 1
        celeb = celeb_stream[j] if j < len(celeb_stream) else celeb_stream[-1]
        pairs.append((bits, celeb))
        j += 1
    return pairs


def analyze_celebrity_distribution(pairs: List[Tuple[List[int], str]]) -> Dict[str, int]:
    """Analyze how many times each celebrity appears in the planned assignments."""
    celebrity_counts = Counter(celeb for _, celeb in pairs)
    return dict(celebrity_counts)
