from backend.parsers.field_mapping import normalize_field_name, normalize_fields
from backend.services import compare_data


# ---------------------------
# Unit tests: normalize_field_name
# ---------------------------

def test_name_aliases():
    assert normalize_field_name("name") == "name"
    assert normalize_field_name("full_name") == "name"
    assert normalize_field_name("fullname") == "name"
    assert normalize_field_name("custname") == "name"
    assert normalize_field_name("customer_name") == "name"
    assert normalize_field_name("your_name") == "name"


def test_email_aliases():
    assert normalize_field_name("email") == "email"
    assert normalize_field_name("e-mail") == "email"
    assert normalize_field_name("mail") == "email"
    assert normalize_field_name("custemail") == "email"
    assert normalize_field_name("email_address") == "email"


def test_phone_aliases():
    assert normalize_field_name("phone") == "phone"
    assert normalize_field_name("tel") == "phone"
    assert normalize_field_name("mobile") == "phone"
    assert normalize_field_name("custtel") == "phone"
    assert normalize_field_name("contact_number") == "phone"
    assert normalize_field_name("phone_number") == "phone"


def test_dob_aliases():
    assert normalize_field_name("dob") == "dob"
    assert normalize_field_name("date_of_birth") == "dob"
    assert normalize_field_name("birthdate") == "dob"
    assert normalize_field_name("birthday") == "dob"


def test_address_aliases():
    assert normalize_field_name("address") == "address"
    assert normalize_field_name("addr") == "address"
    assert normalize_field_name("street") == "address"
    assert normalize_field_name("address_line1") == "address"


def test_company_aliases():
    assert normalize_field_name("company") == "company"
    assert normalize_field_name("employer") == "company"
    assert normalize_field_name("organization") == "company"


def test_job_title_aliases():
    assert normalize_field_name("job_title") == "job_title"
    assert normalize_field_name("position") == "job_title"
    assert normalize_field_name("role") == "job_title"


def test_unknown_field_returns_cleaned():
    assert normalize_field_name("custom_field_xyz") == "custom_field_xyz"


def test_case_insensitive():
    assert normalize_field_name("NAME") == "name"
    assert normalize_field_name("Full_Name") == "name"
    assert normalize_field_name("CustName") == "name"


def test_spaces_and_dashes():
    assert normalize_field_name("full name") == "name"
    assert normalize_field_name("full-name") == "name"
    assert normalize_field_name("full_name") == "name"


def test_bracket_notation_stripped():
    assert normalize_field_name("name[]") == "name"
    assert normalize_field_name("name[0]") == "name"
    assert normalize_field_name("phone[primary]") == "phone"


def test_empty_key_returns_empty():
    assert normalize_field_name("") == ""


def test_normalize_fields_dict():
    data = {"custname": "Yassine", "custtel": "0612345678", "custemail": "y@x.com"}
    result = normalize_fields(data)
    assert result == {"name": "Yassine", "phone": "0612345678", "email": "y@x.com"}


def test_normalize_fields_keeps_first_on_collision():
    data = {"name": "First", "full_name": "Second"}
    result = normalize_fields(data)
    # كلاهما → name، الأول يفوز
    assert result["name"] == "First"


# ---------------------------
# Integration: compare_data with aliases
# ---------------------------

def test_compare_custname_maps_to_name():
    truth = {"name": "Yassine El Amrani"}
    form = {"custname": "Yassine El Amrani"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_compare_custtel_maps_to_phone():
    truth = {"phone": "612345678"}
    form = {"custtel": "0612345678"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_compare_custemail_maps_to_email():
    truth = {"email": "yassine@example.com"}
    form = {"custemail": "yassine@example.com"}
    result = compare_data(truth, form)
    assert result.summary["MATCH"] == 1


def test_compare_full_form_aliases():
    truth = {
        "name": "Yassine El Amrani",
        "phone": "612345678",
        "email": "yassine@example.com",
    }
    form = {
        "custname": "Yassine El Amrani",
        "custtel": "0612345678",
        "custemail": "yassine@example.com",
    }
    result = compare_data(truth, form)
    assert result.summary == {"MATCH": 3, "CONFLICT": 0, "UNKNOWN": 0}


def test_compare_alias_with_conflict():
    truth = {"name": "Yassine El Amrani"}
    form = {"full_name": "Someone Else"}
    result = compare_data(truth, form)
    assert result.summary["CONFLICT"] == 1


def test_compare_unknown_field_still_works():
    truth = {"name": "Yassine"}
    form = {"random_thing": "value"}
    result = compare_data(truth, form)
    assert result.summary["UNKNOWN"] == 1