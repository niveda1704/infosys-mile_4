"""Loads the skills dictionary once and provides normalization + matching."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "skills.json"
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9+#./\- ]{1,60}")


class SkillEntry:
    __slots__ = ("normalized", "category", "aliases")

    def __init__(self, normalized: str, category: str, aliases: list[str]) -> None:
        self.normalized = normalized
        self.category = category
        self.aliases = aliases


@lru_cache
def _load_entries() -> tuple[list[SkillEntry], dict[str, SkillEntry]]:
    with open(_DATA_PATH, "r", encoding="utf-8") as fh:
        raw: list[dict[str, Any]] = json.load(fh)
    entries = [
        SkillEntry(
            normalized=item["normalized"],
            category=item.get("category", "other"),
            aliases=[a.lower() for a in item.get("aliases", [])],
        )
        for item in raw
    ]
    lookup: dict[str, SkillEntry] = {}
    for entry in entries:
        lookup[entry.normalized.lower()] = entry
        for alias in entry.aliases:
            lookup[alias.lower()] = entry
    return entries, lookup


def all_skills() -> list[SkillEntry]:
    return _load_entries()[0]


def lookup(text: str) -> SkillEntry | None:
    return _load_entries()[1].get(text.strip().lower())


def extract_skills(text: str) -> list[tuple[SkillEntry, float]]:
    """Word-boundary regex matching against the curated dictionary.

    Returns list of (entry, confidence 0-1). Confidence is 1.0 for exact
    normalized matches, 0.85 for alias matches, and 0 otherwise.
    """
    if not text:
        return []
    lowered = text.lower()
    found: dict[str, tuple[SkillEntry, float]] = {}
    # Look up by normalized and alias tokens
    entries, lookup_map = _load_entries()
    # Ensure longer names are matched first so "machine learning" beats "ml"
    keys = sorted(lookup_map.keys(), key=len, reverse=True)
    for key in keys:
        # Escape regex specials in the key, then anchor with word boundaries
        pattern = r"(?<![A-Za-z0-9])" + re.escape(key) + r"(?![A-Za-z0-9])"
        if re.search(pattern, lowered):
            entry = lookup_map[key]
            is_alias = key != entry.normalized.lower()
            confidence = 0.85 if is_alias else 1.0
            existing = found.get(entry.normalized)
            if existing is None or confidence > existing[1]:
                found[entry.normalized] = (entry, confidence)
    # Preserve dictionary order (roughly: most common first)
    return [found[e.normalized] for e in entries if e.normalized in found]