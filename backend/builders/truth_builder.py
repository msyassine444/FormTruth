from typing import Any, Dict, List


# facts key -> (truth field, human label, warning wording)
_FACT_FALLBACKS = (
    ("names", "name", "names"),
    ("emails", "email", "emails"),
    ("phones", "phone", "phone numbers"),
    ("urls", "website", "URLs"),
    ("national_ids", "national_id", "national IDs"),
)


def _assign_single_fact(
    truth: Dict[str, Any],
    warnings: List[str],
    facts: Dict[str, Any],
    facts_key: str,
    field: str,
    noun: str,
) -> None:
    """Assign a generic fact only when it is unambiguous.

    If the document yields several distinct values for the same fact type and
    none of them is explicitly labeled, we cannot know which one is the user's
    -> never guess: leave the field unknown and warn instead.
    """
    if field in truth:
        return
    items = [value for value in (facts.get(facts_key) or []) if value]
    if len(items) == 1:
        truth[field] = items[0]
    elif len(items) > 1:
        warnings.append(
            f"Multiple {noun} found ({items}) but none is labeled '{field}'; "
            f"leaving '{field}' unknown. Use a contextual label or 'hints'."
        )


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

    # 2) facts → fallback للحقول غير المغطّاة (فقط عند قيمة واحدة غير ملتبسة)
    for facts_key, field, noun in _FACT_FALLBACKS:
        _assign_single_fact(truth, warnings, facts, facts_key, field, noun)

    # dob: never inferred from a stray/unlabeled date. Only an explicit
    # contextual label (e.g. "DOB: ...") or a hint may set it.
    if "dob" not in truth and "dob" not in hints:
        dates = facts.get("dates", []) or []
        if len(dates) > 1:
            warnings.append(
                f"Multiple dates found ({dates}) but none is labeled 'dob'; "
                f"leaving 'dob' unknown. Use contextual labels (e.g. 'DOB: ...') "
                f"or 'hints'."
            )

    # 3) hints (الأعلى أولوية)
    for key, value in hints.items():
        if value is not None:
            truth[key] = value

    return {"truth": truth, "warnings": warnings}