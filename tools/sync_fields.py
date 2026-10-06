"""Single source of truth for the FormTruth field vocabulary.

``backend/parsers/fields.json`` is the canonical, machine-readable vocabulary.
Both the Python backend (``backend/parsers/field_mapping.py``) and the browser
extension (``formtruth-extension/lib/fields.js``) consume it, so aliases are
never duplicated by hand.

Usage (run from the repository root):

    python tools/sync_fields.py                 # json -> lib/fields.js
    python tools/sync_fields.py --from-code     # (bootstrap) code -> json
    python tools/sync_fields.py --check         # exit 1 if lib/fields.js is stale
"""

from __future__ import annotations

import argparse
import collections
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

FIELDS_JSON = ROOT / "backend" / "parsers" / "fields.json"
FIELDS_JS = ROOT / "formtruth-extension" / "lib" / "fields.js"

JS_HEADER = (
    "// AUTO-GENERATED FILE - DO NOT EDIT BY HAND.\n"
    "// Source of truth: backend/parsers/fields.json\n"
    "// Regenerate with: python tools/sync_fields.py\n"
)

# Presentation metadata for fields shown in the extension profile ledger.
# Canonical names not listed here default to group "other", in_profile False.
META: dict[str, dict] = {
    "name": {"group": "identity", "label": "Full name", "placeholder": "Sara El Idrissi", "type": "text", "in_profile": True},
    "first_name": {"group": "identity", "label": "First name", "placeholder": "Sara", "type": "text", "in_profile": True},
    "last_name": {"group": "identity", "label": "Last name", "placeholder": "El Idrissi", "type": "text", "in_profile": True},
    "dob": {"group": "identity", "label": "Date of birth", "placeholder": "1995-04-23", "type": "date", "in_profile": True},
    "national_id": {"group": "identity", "label": "ID / passport no.", "placeholder": "AB123456", "type": "text", "in_profile": True},
    "email": {"group": "contact", "label": "Email", "placeholder": "sara@example.com", "type": "email", "in_profile": True},
    "phone": {"group": "contact", "label": "Phone", "placeholder": "+212 600 000 000", "type": "phone", "in_profile": True},
    "website": {"group": "contact", "label": "Website", "placeholder": "https://example.com", "type": "url", "in_profile": True},
    "address": {"group": "address", "label": "Street address", "placeholder": "12 Rue Example", "type": "text", "in_profile": True},
    "city": {"group": "address", "label": "City", "placeholder": "Marrakesh", "type": "text", "in_profile": True},
    "postal_code": {"group": "address", "label": "Postal code", "placeholder": "40000", "type": "text", "in_profile": True},
    "country": {"group": "address", "label": "Country", "placeholder": "Morocco", "type": "text", "in_profile": True},
    "company": {"group": "work", "label": "Company", "placeholder": "Acme Ltd", "type": "text", "in_profile": True},
    "job_title": {"group": "work", "label": "Job title", "placeholder": "Designer", "type": "text", "in_profile": True},
    "university": {"group": "education", "label": "University", "placeholder": "Mohammed V University", "type": "text", "in_profile": True},
    "degree": {"group": "education", "label": "Degree / major", "placeholder": "Computer Science", "type": "text", "in_profile": True},
    "graduation": {"group": "education", "label": "Graduation date", "placeholder": "2027-06-15", "type": "date", "in_profile": True},
    "employment_start": {"group": "employment", "label": "Employment start", "placeholder": "2022-09-01", "type": "date", "in_profile": True},
    "employment_end": {"group": "employment", "label": "Employment end", "placeholder": "2024-06-30", "type": "date", "in_profile": True},
}

GROUP_ORDER = ["identity", "contact", "address", "work", "education", "employment", "other"]


def build_vocabulary(aliases_by_canonical: dict) -> dict:
    fields: dict = {}
    for canonical, aliases in aliases_by_canonical.items():
        meta = META.get(canonical, {})
        fields[canonical] = {
            "aliases": list(aliases),
            "group": meta.get("group", "other"),
            "type": meta.get("type", "text"),
            "label": meta.get("label", canonical.replace("_", " ").title()),
            "placeholder": meta.get("placeholder", ""),
            "in_profile": meta.get("in_profile", False),
        }
    return {"version": 1, "groups": GROUP_ORDER, "fields": fields}


def vocabulary_from_code() -> dict:
    from backend.parsers.field_mapping import FIELD_ALIASES  # type: ignore

    grouped = collections.OrderedDict()
    for alias, canonical in FIELD_ALIASES.items():
        grouped.setdefault(canonical, []).append(alias)
    return build_vocabulary(grouped)


def load_vocabulary() -> dict:
    with FIELDS_JSON.open(encoding="utf-8") as fh:
        return json.load(fh)


def render_js(vocabulary: dict) -> str:
    body = json.dumps(vocabulary, indent=2, ensure_ascii=False)
    return (
        JS_HEADER
        + "\n"
        + f"export const FIELD_VOCABULARY = {body};\n"
        + "\nexport const FIELD_CANONICALS = Object.keys(FIELD_VOCABULARY.fields);\n"
        + "\nexport default FIELD_VOCABULARY;\n"
    )


def write_json(vocabulary: dict) -> None:
    FIELDS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with FIELDS_JSON.open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(vocabulary, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def write_js(vocabulary: dict) -> None:
    FIELDS_JS.parent.mkdir(parents=True, exist_ok=True)
    with FIELDS_JS.open("w", encoding="utf-8", newline="\n") as fh:
        fh.write(render_js(vocabulary))


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync the FormTruth field vocabulary.")
    parser.add_argument("--from-code", action="store_true", help="regenerate fields.json from field_mapping.py")
    parser.add_argument("--check", action="store_true", help="verify lib/fields.js is in sync")
    args = parser.parse_args()

    if args.from_code:
        write_json(vocabulary_from_code())
        print(f"wrote {FIELDS_JSON.relative_to(ROOT)}")

    vocabulary = load_vocabulary()
    expected = render_js(vocabulary)

    if args.check:
        current = FIELDS_JS.read_text(encoding="utf-8") if FIELDS_JS.exists() else ""
        if current != expected:
            print(f"STALE: {FIELDS_JS.relative_to(ROOT)} is out of sync. Run: python tools/sync_fields.py")
            return 1
        print("in sync")
        return 0

    write_js(vocabulary)
    print(f"wrote {FIELDS_JS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
