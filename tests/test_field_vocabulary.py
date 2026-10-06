"""Field vocabulary is shared and never duplicated by hand.

`backend/parsers/fields.json` is the single source of truth. These tests guard
that (a) the backend still resolves the historical aliases and (b) the
generated extension copy (`formtruth-extension/lib/fields.js`) is in sync.
"""

import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.parsers.field_mapping import (  # noqa: E402
    FIELD_ALIASES,
    FIELD_VOCABULARY,
    normalize_field_name,
    normalize_fields,
)

sync_fields = importlib.import_module("tools.sync_fields")


def test_backend_aliases_preserved():
    assert normalize_field_name("custname") == "name"
    assert normalize_field_name("full_name") == "name"
    assert normalize_field_name("your_name") == "name"
    assert normalize_field_name("custtel") == "phone"
    assert normalize_field_name("custemail") == "email"
    assert normalize_field_name("date_of_birth") == "dob"
    assert normalize_field_name("birthday") == "dob"
    assert normalize_field_name("passport") == "national_id"
    assert normalize_field_name("zip") == "postal_code"
    assert normalize_field_name("job_title") == "job_title"
    assert normalize_field_name("position") == "job_title"


def test_arabic_aliases_resolve_to_canonical_fields():
    assert normalize_field_name("البريد الإلكتروني") == "email"
    assert normalize_field_name("الايميل") == "email"
    assert normalize_field_name("الإيميل") == "email"
    assert normalize_field_name("البريد") == "email"
    assert normalize_field_name("رقم الهاتف") == "phone"
    assert normalize_field_name("الهاتف") == "phone"
    assert normalize_field_name("الجوال") == "phone"
    assert normalize_field_name("رقم الجوال") == "phone"
    assert normalize_field_name("الاسم") == "name"
    assert normalize_field_name("الاسم الأول") == "first_name"
    assert normalize_field_name("الإسم الأول") == "first_name"
    assert normalize_field_name("الاسم الأخير") == "last_name"
    assert normalize_field_name("اسم العائلة") == "last_name"
    assert normalize_field_name("النسب") == "last_name"
    assert normalize_field_name("الموقع الإلكتروني") == "website"
    assert normalize_field_name("الموقع") == "website"
    assert normalize_field_name("تاريخ الميلاد") == "dob"
    assert normalize_field_name("العنوان") == "address"
    assert normalize_field_name("المدينة") == "city"
    assert normalize_field_name("الدولة") == "country"
    assert normalize_field_name("الرمز البريدي") == "postal_code"
    assert normalize_field_name("الشركة") == "company"


def test_arabic_aliases_drive_compare_field_normalization():
    truth = {"البريد": "a@example.com", "الهاتف": "0612345678"}
    form = {"email": "a@example.com"}
    from backend.services import compare_data

    result = compare_data(truth, form)
    assert result.results[0].field == "email"
    assert result.results[0].status == "MATCH"


def test_unknown_field_is_returned_cleaned():
    assert normalize_field_name("custom_field_xyz") == "custom_field_xyz"


def test_normalize_fields_keeps_first_on_collision():
    assert normalize_fields({"name": "First", "full_name": "Second"}) == {"name": "First"}


def test_vocabulary_json_rebuilds_the_same_alias_table():
    vocabulary = sync_fields.load_vocabulary()
    rebuilt = {}
    for canonical, spec in vocabulary["fields"].items():
        for alias in spec["aliases"]:
            rebuilt.setdefault(alias, canonical)
    assert rebuilt == FIELD_ALIASES


def test_vocabulary_has_expected_canonical_fields():
    fields = FIELD_VOCABULARY["fields"]
    for canonical in ("name", "email", "phone", "dob", "national_id", "postal_code"):
        assert canonical in fields
        assert fields[canonical]["aliases"]


def test_extension_vocabulary_file_is_in_sync():
    expected = sync_fields.render_js(sync_fields.load_vocabulary())
    actual = sync_fields.FIELDS_JS.read_text(encoding="utf-8")
    assert actual == expected, "run: python tools/sync_fields.py"


def test_vocabulary_generator_is_idempotent():
    assert sync_fields.vocabulary_from_code() == sync_fields.load_vocabulary()
