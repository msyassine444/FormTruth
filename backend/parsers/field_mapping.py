import json
import re
from pathlib import Path
from typing import Dict


# ---------------------------------------------
# Canonical field vocabulary
# ---------------------------------------------
# Single source of truth shared with the browser extension:
#     backend/parsers/fields.json  ->  formtruth-extension/lib/fields.js
# Do not hard-code aliases here. Edit the JSON and run:
#     python tools/sync_fields.py

_FIELDS_PATH = Path(__file__).with_name("fields.json")


def load_field_vocabulary() -> Dict[str, dict]:
    with _FIELDS_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def _build_aliases(vocabulary: Dict[str, dict]) -> Dict[str, str]:
    aliases: Dict[str, str] = {}
    for canonical, spec in vocabulary.get("fields", {}).items():
        for alias in spec.get("aliases", []):
            aliases.setdefault(alias, canonical)
    return aliases


FIELD_VOCABULARY: Dict[str, dict] = load_field_vocabulary()
FIELD_ALIASES: Dict[str, str] = _build_aliases(FIELD_VOCABULARY)


def _clean_key(key: str) -> str:
    """
    نظّف المفتاح:
      - lowercase
      - استبدل - و spaces بـ _
      - احذف [] للـ form arrays
    """
    key = key.strip().lower()
    key = re.sub(r"\[\]$", "", key)          # remove trailing []
    key = re.sub(r"\[\w+\]", "", key)         # remove [something]
    key = key.replace("-", "_")
    key = re.sub(r"\s+", "_", key)
    key = re.sub(r"__+", "_", key)
    return key


def normalize_field_name(key: str) -> str:
    """
    حوّل أي اسم حقل إلى اسم معياري.
    مثال: "custname" → "name"
    """
    if not key:
        return key
    cleaned = _clean_key(key)
    return FIELD_ALIASES.get(cleaned, cleaned)


def normalize_fields(data: dict) -> dict:
    """
    حوّل كل مفاتيح قاموس إلى أسماء معيارية.
    """
    result = {}
    for key, value in data.items():
        normalized = normalize_field_name(key)
        # إذا الاسم المعياري موجود مسبقًا، لا تستبدله
        if normalized not in result:
            result[normalized] = value
    return result