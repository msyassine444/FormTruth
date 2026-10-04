from typing import Any, Dict, List


def _first_or_none(items: List[str]) -> str | None:
    return items[0] if items else None


def build_truth(
    facts: Dict[str, Any],
    hints: Dict[str, Any] | None = None,
    contextual: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    حوّل facts إلى truth profile.

    الأولوية:
      1. hints (المستخدم يعرف أفضل)
      2. contextual (سياق "Label: Value")
      3. facts (استخراج عام)
    """
    hints = hints or {}
    contextual = contextual or {}
    warnings: List[str] = []

    truth: Dict[str, Any] = {}

    # 1) contextual (أدق من general)
    for key, value in contextual.items():
        if value is not None:
            truth[key] = value

    # 2) facts → fallback للحقول غير المغطّاة
    if "name" not in truth:
        name = _first_or_none(facts.get("names", []))
        if name:
            truth["name"] = name

    if "email" not in truth:
        email = _first_or_none(facts.get("emails", []))
        if email:
            truth["email"] = email

    if "phone" not in truth:
        phone = _first_or_none(facts.get("phones", []))
        if phone:
            truth["phone"] = phone

    if "website" not in truth:
        url = _first_or_none(facts.get("urls", []))
        if url:
            truth["website"] = url

    if "national_id" not in truth:
        nat_id = _first_or_none(facts.get("national_ids", []))
        if nat_id:
            truth["national_id"] = nat_id

    # dob: فقط إذا لم يُحدد في contextual ولا hints
    if "dob" not in truth and "dob" not in hints:
        dates = facts.get("dates", []) or []
        if dates:
            truth["dob"] = dates[0]
            if len(dates) > 1:
                warnings.append(
                    f"Multiple dates found ({dates}); first one assigned to 'dob'. "
                    f"Use contextual labels (e.g. 'DOB: ...') or 'hints'."
                )

    # 3) hints (الأعلى أولوية)
    for key, value in hints.items():
        if value is not None:
            truth[key] = value

    return {"truth": truth, "warnings": warnings}