"""Ambiguity-aware date handling: unit + consistency-engine coverage.

Golden rule under test: an ambiguous written date (e.g. ``05/12/2009``) is
never guessed. It can only ever be UNKNOWN, never MATCH or CONFLICT.
"""

from fastapi.testclient import TestClient

from backend.main import app
from backend.parsers.dates import parse_date
from backend.services import compare_data

client = TestClient(app)


# ---------------------------
# parse_date: unambiguous
# ---------------------------

def test_iso_date_is_unambiguous():
    parsed = parse_date("2009-12-05")
    assert parsed.iso == "2009-12-05"
    assert parsed.ambiguous is False


def test_year_first_slash_is_unambiguous():
    assert parse_date("2009/12/05").iso == "2009-12-05"


def test_dd_mm_unambiguous_day_gt_12():
    # 25 cannot be a month -> must be DD/MM.
    parsed = parse_date("25/12/2009")
    assert parsed.iso == "2009-12-25"
    assert parsed.ambiguous is False


def test_dd_mm_unambiguous_end_of_month():
    assert parse_date("31/01/2000").iso == "2000-01-31"


def test_mm_dd_unambiguous_month_gt_12():
    # 25 cannot be a month in the second slot -> must be MM/DD.
    parsed = parse_date("12/25/2009")
    assert parsed.iso == "2009-12-25"
    assert parsed.ambiguous is False


def test_mm_dd_unambiguous_end_of_month():
    assert parse_date("01/31/2000").iso == "2000-01-31"


def test_two_digit_year_is_unambiguous():
    assert parse_date("25/12/09").iso == "2009-12-25"


# ---------------------------
# parse_date: ambiguous
# ---------------------------

def test_ambiguous_date_flags_both_readings():
    parsed = parse_date("05/12/2009")
    assert parsed.ambiguous is True
    assert parsed.iso is None
    assert set(parsed.candidates) == {"2009-12-05", "2009-05-12"}


def test_ambiguous_date_symmetric_form():
    parsed = parse_date("12/05/2009")
    assert parsed.ambiguous is True
    assert set(parsed.candidates) == {"2009-05-12", "2009-12-05"}


def test_ambiguous_date_with_dash_separator():
    assert parse_date("05-12-2009").ambiguous is True


def test_ambiguous_date_two_digit_year():
    parsed = parse_date("05/12/09")
    assert parsed.ambiguous is True
    assert set(parsed.candidates) == {"2009-12-05", "2009-05-12"}


def test_same_day_and_month_is_not_ambiguous():
    # 05/05/2009 -> both readings are the same date.
    parsed = parse_date("05/05/2009")
    assert parsed.ambiguous is False
    assert parsed.iso == "2009-05-05"


# ---------------------------
# parse_date: invalid
# ---------------------------

def test_invalid_month_returns_none():
    assert parse_date("2009-13-01") is None


def test_non_date_returns_none():
    assert parse_date("not a date") is None


def test_incomplete_date_returns_none():
    assert parse_date("2009-05") is None


def test_empty_returns_none():
    assert parse_date("") is None
    assert parse_date(None) is None


# ---------------------------
# Consistency engine behaviour
# ---------------------------

def test_iso_and_dd_mm_unambiguous_match():
    result = compare_data({"dob": "2009-12-25"}, {"dob": "25/12/2009"})
    assert result.summary == {"MATCH": 1, "CONFLICT": 0, "UNKNOWN": 0}


def test_iso_and_mm_dd_unambiguous_match():
    result = compare_data({"dob": "2009-12-25"}, {"dob": "12/25/2009"})
    assert result.summary == {"MATCH": 1, "CONFLICT": 0, "UNKNOWN": 0}


def test_ambiguous_form_date_is_unknown_never_match():
    # truth 12 May 2009; form 05/12/2009 could be 5 Dec OR 12 May.
    result = compare_data({"dob": "2009-05-12"}, {"dob": "05/12/2009"})
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}
    assert result.results[0].status == "UNKNOWN"


def test_ambiguous_form_date_is_unknown_even_when_other_reading_matches():
    # truth 5 Dec 2009; 05/12/2009 also *could* be 5 Dec, but we must not assume.
    result = compare_data({"dob": "2009-12-05"}, {"dob": "05/12/2009"})
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}


def test_ambiguous_truth_date_is_unknown():
    result = compare_data({"dob": "05/12/2009"}, {"dob": "2009-05-12"})
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}


def test_both_ambiguous_is_unknown():
    result = compare_data({"dob": "05/12/2009"}, {"dob": "05/12/2009"})
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}


def test_ambiguous_date_never_conflicts():
    # Ambiguity must degrade to UNKNOWN, not a (possibly wrong) CONFLICT.
    result = compare_data({"dob": "2001-01-01"}, {"dob": "05/12/2009"})
    assert result.summary["CONFLICT"] == 0
    assert result.summary["UNKNOWN"] == 1


def test_identical_iso_dates_still_match():
    result = compare_data({"dob": "2009-05-12"}, {"dob": "2009-05-12"})
    assert result.summary == {"MATCH": 1, "CONFLICT": 0, "UNKNOWN": 0}


def test_ambiguous_date_via_api_is_unknown():
    payload = {"truth": {"dob": "2009-05-12"}, "form": {"dob": "05/12/2009"}}
    response = client.post("/compare", json=payload)
    assert response.status_code == 200
    assert response.json()["summary"] == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}
