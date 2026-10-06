from backend.services import compare_data


def test_all_match():
    truth = {"name": "Yassine Annous", "dob": "2009-05-12"}
    form = {"name": "Yassine Annous", "dob": "2009-05-12"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 2


def test_conflict_on_different_values():
    truth = {"employment_start": 2022}
    form = {"employment_start": 2023}
    result = compare_data(truth, form)
    assert result.summary["CONFLICT"] == 1


def test_unknown_when_field_not_in_truth():
    truth = {"name": "Yassine Annous"}
    form = {"name": "Yassine Annous", "address": "Rabat"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1
    assert result.summary["UNKNOWN"] == 1


def test_mixed_case():
    truth = {"name": "Yassine Annous", "employment_start": 2022, "dob": "2009-05-12"}
    form = {"name": "Yassine Annous", "employment_start": 2023, "address": "Rabat"}
    result = compare_data(truth, form)
    assert result.summary == {"MATCH": 1, "CONFLICT": 1, "UNKNOWN": 1}


def test_string_normalization():
    truth = {"name": "  Yassine Annous  "}
    form = {"name": "Yassine Annous"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_empty_form():
    truth = {"name": "Yassine Annous"}
    form = {}
    result = compare_data(truth, form)
    assert result.results == []
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 0}


def test_extra_fields_in_truth_are_ignored():
    truth = {"name": "Yassine Annous", "extra": "ignored"}
    form = {"name": "Yassine Annous"}
    result = compare_data(truth, form)
    assert len(result.results) == 1


def test_zero_and_negative_are_not_unknown():
    truth = {"age": 0, "balance": -100}
    form = {"age": 0, "balance": -200}
    result = compare_data(truth, form)
    statuses = {r.field: r.status for r in result.results}
    assert statuses["age"] == "MATCH"
    assert statuses["balance"] == "CONFLICT"
    assert result.summary["UNKNOWN"] == 0


def test_none_in_truth_is_unknown():
    truth = {"phone": None}
    form = {"phone": "0612345678"}
    result = compare_data(truth, form)
    assert result.results[0].status == "UNKNOWN"


def test_boolean_values():
    truth = {"subscribed": True}
    form = {"subscribed": True}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_both_empty():
    result = compare_data({}, {})
    assert result.results == []
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 0}


def test_int_and_str_number_match():
    truth = {"year": 2022}
    form = {"year": "2022"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_str_number_with_spaces_matches_int():
    truth = {"year": 2022}
    form = {"year": "  2022  "}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_dates_different_formats_match():
    # 25/12 can only be DD/MM -> unambiguous different format.
    truth = {"dob": "2009-12-25"}
    form = {"dob": "25/12/2009"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_dates_different_separators_match():
    truth = {"dob": "2009-12-25"}
    form = {"dob": "25-12-2009"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_ambiguous_date_is_unknown_not_match():
    # 05/12/2009 = 5 Dec OR 12 May -> must not be resolved into a MATCH.
    truth = {"dob": "2009-05-12"}
    form = {"dob": "05/12/2009"}
    result = compare_data(truth, form)
    assert result.summary == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 1}
    assert result.results[0].status == "UNKNOWN"


def test_phone_with_spaces_matches():
    truth = {"phone": "0612345678"}
    form = {"phone": "06 12 34 56 78"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_phone_with_country_code_matches():
    truth = {"phone": "0612345678"}
    form = {"phone": "+212612345678"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_boolean_true_variants_match():
    truth = {"subscribed": True}
    form = {"subscribed": "yes"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_boolean_arabic_yes_matches():
    truth = {"subscribed": True}
    form = {"subscribed": "نعم"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_boolean_false_variants_match():
    truth = {"subscribed": False}
    form = {"subscribed": "no"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_boolean_true_vs_false_is_conflict():
    truth = {"subscribed": True}
    form = {"subscribed": False}
    result = compare_data(truth, form)
    assert result.summary["CONFLICT"] == 1


def test_real_conflict_still_works():
    truth = {"dob": "2009-05-12"}
    form = {"dob": "2010-01-01"}
    result = compare_data(truth, form)
    assert result.summary["CONFLICT"] == 1