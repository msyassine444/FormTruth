"""Ambiguity-aware, deterministic date parsing.

FormTruth never guesses. When a written date can reasonably be read as two
different calendar dates -- for example ``05/12/2009`` meaning either
5 December 2009 (DD/MM) or 12 May 2009 (MM/DD) -- the value is reported as
*ambiguous* instead of being silently resolved.

Callers can then either keep the ambiguity (preserve the raw value) or treat
the field as ``UNKNOWN``, so the consistency engine can never produce a false
MATCH from an ambiguous date.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import List, Optional, Tuple

_SEPARATORS = re.compile(r"[-/. \t]+")


@dataclass(frozen=True)
class DateParse:
    """Result of parsing a written date."""

    raw: str                          # original text
    iso: Optional[str] = None         # canonical YYYY-MM-DD when unambiguous
    ambiguous: bool = False           # True when two valid readings disagree
    candidates: Tuple[str, ...] = ()  # possible ISO dates when ambiguous


def _make_iso(year: str, month: str, day: str) -> Optional[str]:
    try:
        return date(int(year), int(month), int(day)).isoformat()
    except (TypeError, ValueError):
        return None


def _dedupe(items: List[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def parse_date(raw: object) -> Optional[DateParse]:
    """Parse ``raw`` into a :class:`DateParse`, or ``None`` if not a date.

    Supported inputs:
      * year-first  -> ``2009-05-12`` / ``2009/05/12``  (unambiguous)
      * year-last   -> ``25/12/2009`` (unambiguous DD/MM)
                       ``12/25/2009`` (unambiguous MM/DD)
                       ``05/12/2009`` (ambiguous -> ``ambiguous=True``)
    Two-digit years are read as ``20xx``.
    """
    if raw is None:
        return None

    text = str(raw).strip()
    parts = _SEPARATORS.split(text)
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        return None

    first, second, third = parts

    # Year-first: 2009-05-12 / 2009/05/12 -> a single, unambiguous reading.
    if len(first) == 4:
        iso = _make_iso(first, second, third)
        if iso is None:
            return None
        return DateParse(text, iso=iso, ambiguous=False, candidates=(iso,))

    # Year-last: DD/MM or MM/DD.
    if len(third) not in (2, 4):
        return None
    year = third if len(third) == 4 else "20" + third

    dd_mm = _make_iso(year, second, first)  # day=first, month=second
    mm_dd = _make_iso(year, first, second)  # month=first, day=second
    candidates = _dedupe([c for c in (dd_mm, mm_dd) if c])

    if len(candidates) == 1:
        return DateParse(text, iso=candidates[0], ambiguous=False, candidates=tuple(candidates))
    if len(candidates) >= 2:
        return DateParse(text, iso=None, ambiguous=True, candidates=tuple(candidates))
    return None
