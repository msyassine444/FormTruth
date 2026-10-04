import re
from typing import Any, Dict, List


EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)

URL_RE = re.compile(
    r"https?://[^\s<>\"']+",
    re.IGNORECASE,
)

PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s\-\.]?)?(?:\(?\d{2,4}\)?[\s\-\.]?){2,4}\d{2,4}"
)

DATE_RE = re.compile(
    r"\b(?:\d{4}[\-/]\d{1,2}[\-/]\d{1,2}|\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4})\b"
)

NAME_RE = re.compile(
    r"(?:full[ \t]*name|name|الاسم)[ \t]*[:\-][ \t]*"
    r"([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF \t'\-]{1,60})",
    re.IGNORECASE,
)

NATIONAL_ID_RE = re.compile(
    r"\b[A-Z]{1,3}\d{5,10}\b|\b\d{8,10}\b"
)


def _normalize_phone(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw)
    if not (8 <= len(digits) <= 15):
        return None

    # رفض السنة الصرفة
    if len(digits) == 4:
        try:
            year = int(digits)
            if 1900 <= year <= 2100:
                return None
        except ValueError:
            pass

    # رفض YYYYMMDD (تاريخ بلا فواصل)
    if len(digits) == 8 and digits[:2] in ("19", "20"):
        return None

    if digits.startswith("212"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    return digits


def _normalize_date(raw: str) -> str | None:
    s = raw.strip().replace("/", "-")
    parts = s.split("-")
    if len(parts) != 3:
        return None
    if len(parts[0]) == 4:
        y, m, d = parts
    else:
        d, m, y = parts
    if len(y) == 2:
        y = "20" + y
    return f"{y.zfill(4)}-{m.zfill(2)}-{d.zfill(2)}"


def _clean_name(raw: str) -> str:
    return raw.strip().strip(".,;:")


def extract_emails(text: str) -> List[str]:
    found = EMAIL_RE.findall(text)
    seen = set()
    result = []
    for e in found:
        e_lower = e.lower()
        if e_lower not in seen:
            seen.add(e_lower)
            result.append(e)
    return result


def extract_urls(text: str) -> List[str]:
    found = URL_RE.findall(text)
    seen = set()
    result = []
    for u in found:
        u_clean = u.rstrip(".,;:")
        if u_clean not in seen:
            seen.add(u_clean)
            result.append(u_clean)
    return result


def extract_phones(text: str) -> List[str]:
    found = PHONE_RE.findall(text)
    seen = set()
    result = []
    for raw in found:
        phone = _normalize_phone(raw)
        if phone and phone not in seen:
            seen.add(phone)
            result.append(phone)
    return result


def extract_dates(text: str) -> List[str]:
    found = DATE_RE.findall(text)
    seen = set()
    result = []
    for raw in found:
        d = _normalize_date(raw)
        if d and d not in seen:
            seen.add(d)
            result.append(d)
    return result


def extract_names(text: str) -> List[str]:
    found = NAME_RE.findall(text)
    seen = set()
    result = []
    for raw in found:
        name = _clean_name(raw)
        if name and name.lower() not in seen:
            seen.add(name.lower())
            result.append(name)
    return result


def extract_national_ids(text: str) -> List[str]:
    found = NATIONAL_ID_RE.findall(text)
    seen = set()
    result = []
    for raw in found:
        if raw not in seen:
            seen.add(raw)
            result.append(raw)
    return result


def extract_facts(text: str) -> Dict[str, Any]:
    return {
        "emails": extract_emails(text),
        "phones": extract_phones(text),
        "dates": extract_dates(text),
        "urls": extract_urls(text),
        "names": extract_names(text),
        "national_ids": extract_national_ids(text),
    }