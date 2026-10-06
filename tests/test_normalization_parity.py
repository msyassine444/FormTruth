"""Backend↔extension normalization parity.

The same shared case file (tests/parity_cases.json) is also consumed by the
extension test `formtruth-extension/tests/parity.test.js`. Both sides must
produce the same status for every case. Empty-value handling is intentionally
excluded: MATCH/CONFLICT/UNKNOWN/EMPTY semantics of the extension's EMPTY
status have no backend counterpart yet (documented in README).
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

from backend.services import compare_data  # noqa: E402


def _load_cases():
    with (ROOT / "tests" / "parity_cases.json").open(encoding="utf-8") as fh:
        return json.load(fh)["cases"]


def test_parity_cases_agree_with_backend_engine():
    for case in _load_cases():
        result = compare_data(case["truth"], case["form"])
        actual = {r.field: r.status for r in result.results}
        assert actual == case["expected"], f"case failed: {case['name']}"
