import re
from typing import Any, Dict, List, Optional

from .facts import (
    _normalize_phone,
    _normalize_date,
    _clean_name,
)


# ---------------------------------------------
# Label → canonical field name mapping
# ---------------------------------------------

LABEL_MAP: Dict[str, str] = {
    # name
    "name": "name",
    "full name": "name",
    "fullname": "name",
    "الاسم": "name",
    "الاسم الكامل": "name",

    # email
    "email": "email",
    "e-mail": "email",
    "mail": "email",
    "البريد": "email",
    "البريد الإلكتروني": "email",

    # phone
    "phone": "phone",
    "mobile": "phone",
    "tel": "phone",
    "telephone": "phone",
    "الهاتف": "phone",
    "الجوال": "phone",

    # dob
    "dob": "dob",
    "date of birth": "dob",
    "birth date": "dob",
    "birthday": "dob",
    "تاريخ الميلاد": "dob",

    # employment
    "employment start": "employment_start",
    "start date": "employment_start",
    "work start": "employment_start",
    "بداية العمل": "employment_start",
    "employment end": "employment_end",
    "end date": "employment_end",
    "نهاية العمل": "employment_end",

    # education
    "graduation": "graduation",
    "graduation date": "graduation",
    "تاريخ التخرج": "graduation",
    "university": "university",
    "الجامعة": "university",
    "degree": "degree",
    "الشهادة": "degree",

    # identity
    "national id": "national_id",
    "national_id": "national_id",
    "passport": "national_id",
    "id number": "national_id",
    "رقم الهوية": "national_id",
    "رقم الجواز": "national_id",

    # location
    "address": "address",
    "العنوان": "address",
    "city": "city",
    "المدينة": "city",
    "country": "country",
    "البلد": "country",

    # web
    "website": "website",
    "portfolio": "website",
    "url": "website",
    "الموقع": "website",

    # work
    "company": "company",
    "الشركة": "company",
    "job title": "job_title",
    "position": "job_title",
    "الوظيفة": "job_title",
}


def _normalize_label(raw: str) -> Optional[str]:
    key = re.sub(r"\s+", " ", raw.strip().lower())
    return LABEL_MAP.get(key)


def _try_date(value: str) -> Optional[str]:
    d = _normalize_date(value)
    return d


def _try_phone(value: str) -> Optional[str]:
    return _normalize_phone(value)


def _clean_value(value: str) -> str:
    return value.strip().strip(".,;:")


# ---------------------------------------------
# Regex: "Label: Value"
# ---------------------------------------------

_LABEL_PATTERN = re.compile(
    r"^[ \t]*([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF \t_\-]{0,40})"
    r"[ \t]*[:\-][ \t]*"
    r"(.+?)[ \t]*$",
    re.MULTILINE,
)


def extract_contextual_facts(text: str) -> Dict[str, Any]:
    """
    يقرأ النص سطرًا سطرًا، يبحث عن "Label: Value" ويبني قاموس حقول.
    """
    results: Dict[str, Any] = {}
    seen_values: set[str] = set()

    for line in text.splitlines():
        m = _LABEL_PATTERN.match(line)
        if not m:
            continue

        raw_label, raw_value = m.group(1), m.group(2)
        field = _normalize_label(raw_label)
        if not field:
            continue

        value = _clean_value(raw_value)
        if not value:
            continue

        # امنع التكرار
        key = f"{field}:{value.lower()}"
        if key in seen_values:
            continue
        seen_values.add(key)

        # حاول استخراج تاريخ / هاتف / نص
        if field in {"dob", "employment_start", "employment_end", "graduation"}:
            d = _try_date(value)
            if d:
                results[field] = d
                continue

        if field == "phone":
            p = _try_phone(value)
            if p:
                results[field] = p
                continue

        # name: أزل الرموز
        if field == "name":
            results[field] = _clean_name(value)
            continue

        # باقي الحقول: نص كما هو
        results[field] = value

    return results