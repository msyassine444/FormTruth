import re
from datetime import datetime
from typing import Any, Dict, Optional
from .models import FieldResult, CompareResponse
from .parsers.field_mapping import normalize_fields
from .parsers.dates import parse_date


TRUE_VALUES = {"true", "yes", "y", "1", "on", "نعم", "صح"}
FALSE_VALUES = {"false", "no", "n", "0", "off", "لا", "خطأ"}

def _to_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if value == 1:
            return True
        if value == 0:
            return False
    if isinstance(value, str):
        v = value.strip().lower()
        if v in TRUE_VALUES:
            return True
        if v in FALSE_VALUES:
            return False
    return None


def _to_date(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        parsed = parse_date(value)
        if parsed is not None and parsed.iso:
            year, month, day = (int(p) for p in parsed.iso.split("-"))
            return datetime(year, month, day)
    return None


def _date_is_ambiguous(value: Any) -> bool:
    if isinstance(value, str):
        parsed = parse_date(value)
        return parsed is not None and parsed.ambiguous
    return False


def _looks_like_phone(s: str) -> bool:
    if not re.fullmatch(r"[\d\s\+\-\(\)\.]+", s):
        return False
    digits = re.sub(r"\D", "", s)
    if not (8 <= len(digits) <= 15):
        return False

    if len(digits) == 4:
        try:
            year = int(digits)
            if 1900 <= year <= 2100:
                return False
        except ValueError:
            pass

    if len(digits) == 8 and digits[:2] in ("19", "20"):
        return False

    has_separator = bool(re.search(r"[\s\+\-\(\)]", s))
    if not has_separator and len(digits) not in (9, 10, 11, 12):
        return False
    return True


_DEFAULT_COUNTRY_PREFIX = "212"  # Morocco; explicit default, not an assumption


def _normalize_phone(value: Any, country_prefix: str = _DEFAULT_COUNTRY_PREFIX) -> Optional[str]:
    if not isinstance(value, str):
        return None
    if not _looks_like_phone(value):
        return None
    digits = re.sub(r"\D", "", value)
    # International trunk prefix: 00 6... == +6...
    if digits.startswith("00"):
        digits = digits[2:]
    # Strip the configured country prefix explicitly (default Morocco).
    if country_prefix and digits.startswith(country_prefix):
        digits = digits[len(country_prefix):]
    elif digits.startswith("0"):
        digits = digits[1:]
    return digits


def _normalize(value: Any) -> Any:
    b = _to_bool(value)
    if b is not None:
        return ("bool", b)

    # An ambiguous date (e.g. "05/12/2009") must never be resolved into a
    # single value -- it can only ever be UNKNOWN.
    if _date_is_ambiguous(value):
        return ("ambiguous_date", None)

    d = _to_date(value)
    if d is not None:
        return ("date", d.date())

    if isinstance(value, str):
        s = value.strip()
        phone = _normalize_phone(s)
        if phone:
            return ("phone", phone)
        try:
            num = float(s.replace(",", ""))
            return ("num", num)
        except ValueError:
            pass
        return ("str", s.lower())

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return ("num", float(value))

    return ("raw", value)


def compare_data(truth: Dict[str, Any], form: Dict[str, Any]) -> CompareResponse:
    # 1) حوّل أسماء الحقول إلى أسماء معيارية
    truth_norm = normalize_fields(truth)
    form_norm = normalize_fields(form)

    results: list[FieldResult] = []
    summary = {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 0}

    for field, form_value in form_norm.items():
        truth_value = truth_norm.get(field, None)

        if truth_value is None:
            status = "UNKNOWN"
        else:
            truth_norm_val = _normalize(truth_value)
            form_norm_val = _normalize(form_value)
            # Never guess an ambiguous date: it cannot be a MATCH or CONFLICT.
            if (
                truth_norm_val[0] == "ambiguous_date"
                or form_norm_val[0] == "ambiguous_date"
            ):
                status = "UNKNOWN"
            elif truth_norm_val == form_norm_val:
                status = "MATCH"
            else:
                status = "CONFLICT"

        summary[status] += 1
        results.append(
            FieldResult(field=field, status=status, truth=truth_value, form=form_value)
        )

    return CompareResponse(results=results, summary=summary)