from backend.parsers.facts import extract_facts
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ---------------------------
# Unit tests: extract_facts
# ---------------------------

def test_email_extraction():
    text = "Contact me at yassine@example.com or admin@test.ma"
    facts = extract_facts(text)
    assert "yassine@example.com" in facts["emails"]
    assert "admin@test.ma" in facts["emails"]


def test_email_deduplication():
    text = "a@b.com and A@B.com"
    facts = extract_facts(text)
    assert len(facts["emails"]) == 1


def test_phone_extraction_moroccan():
    text = "Phone: 0612345678"
    facts = extract_facts(text)
    assert "612345678" in facts["phones"]


def test_phone_extraction_with_country_code():
    text = "Phone: +212612345678"
    facts = extract_facts(text)
    assert "612345678" in facts["phones"]


def test_phone_extraction_with_spaces():
    text = "Tel: 06 12 34 56 78"
    facts = extract_facts(text)
    assert "612345678" in facts["phones"]


def test_date_extraction_iso():
    text = "DOB: 2009-05-12"
    facts = extract_facts(text)
    assert "2009-05-12" in facts["dates"]


def test_date_extraction_slash():
    # 25/12 can only be DD/MM -> unambiguous, normalized to ISO.
    text = "DOB: 25/12/2009"
    facts = extract_facts(text)
    assert "2009-12-25" in facts["dates"]


def test_date_extraction_dash():
    # 25-12 can only be DD/MM -> unambiguous, normalized to ISO.
    text = "DOB: 25-12-2009"
    facts = extract_facts(text)
    assert "2009-12-25" in facts["dates"]


def test_url_extraction():
    text = "Portfolio: https://yassine.dev and http://test.com"
    facts = extract_facts(text)
    assert "https://yassine.dev" in facts["urls"]
    assert "http://test.com" in facts["urls"]


def test_name_extraction_english():
    text = "Name: Yassine Annous"
    facts = extract_facts(text)
    assert "Yassine Annous" in facts["names"]


def test_name_extraction_arabic():
    text = "الاسم: ياسين العلمي"
    facts = extract_facts(text)
    assert "ياسين العلمي" in facts["names"]


def test_empty_text():
    facts = extract_facts("")
    assert facts["emails"] == []
    assert facts["phones"] == []
    assert facts["dates"] == []
    assert facts["urls"] == []
    assert facts["names"] == []
    assert facts["national_ids"] == []


def test_no_facts():
    text = "This is a random sentence with nothing special."
    facts = extract_facts(text)
    assert facts["emails"] == []
    assert facts["phones"] == []


# ---------------------------
# Integration tests: /extract-facts
# ---------------------------

def test_extract_facts_endpoint():
    content = (
        "Name: Yassine Annous\n"
        "Email: yassine@example.com\n"
        "Phone: 0612345678\n"
        "DOB: 2009-05-12\n"
        "Site: https://yassine.dev\n"
    ).encode("utf-8")

    response = client.post(
        "/extract-facts",
        files={"file": ("cv.txt", content, "text/plain")},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "cv.txt"
    facts = data["facts"]
    assert "yassine@example.com" in facts["emails"]
    assert "612345678" in facts["phones"]
    assert "2009-05-12" in facts["dates"]
    assert "https://yassine.dev" in facts["urls"]
    assert "Yassine Annous" in facts["names"]


def test_extract_facts_missing_file():
    response = client.post("/extract-facts")
    assert response.status_code == 422


def test_extract_facts_wrong_extension():
    response = client.post(
        "/extract-facts",
        files={"file": ("cv.pdf", b"%PDF...", "application/pdf")},
    )
    assert response.status_code == 400
def test_phone_does_not_extract_year():
    text = "Year: 2022"
    facts = extract_facts(text)
    assert "2022" not in facts["phones"]


def test_phone_does_not_extract_date_without_separators():
    text = "DOB: 2009-05-12"
    facts = extract_facts(text)
    # 20090512 يجب ألا يُلتقط كرقم هاتف
    assert "20090512" not in facts["phones"]


# ---------------------------
# National ID: must not over-match
# ---------------------------

def test_phone_is_not_national_id():
    facts = extract_facts("Phone: 0612345678")
    assert facts["national_ids"] == []


def test_country_code_phone_is_not_national_id():
    facts = extract_facts("Tel: +212612345678")
    assert facts["national_ids"] == []


def test_date_without_separators_is_not_national_id():
    facts = extract_facts("DOB: 20090512")
    assert facts["national_ids"] == []


def test_unrelated_number_is_not_national_id():
    facts = extract_facts("Invoice no. 12345678")
    assert facts["national_ids"] == []


def test_labeled_national_id_is_extracted():
    facts = extract_facts("National ID: 12345678")
    assert "12345678" in facts["national_ids"]


def test_labeled_passport_is_extracted():
    facts = extract_facts("Passport Number: AB123456")
    assert "AB123456" in facts["national_ids"]


def test_labeled_arabic_id_is_extracted():
    facts = extract_facts("رقم الهوية: 98765432")
    assert "98765432" in facts["national_ids"]


def test_alphanumeric_id_token_is_extracted():
    facts = extract_facts("Reference AB123456 on the card")
    assert "AB123456" in facts["national_ids"]


def test_national_ids_deduplicated():
    facts = extract_facts("National ID: 12345678\nID number: 12345678")
    assert facts["national_ids"].count("12345678") == 1


# ---------------------------
# Ambiguous dates are never guessed
# ---------------------------

def test_ambiguous_slash_date_is_preserved_not_normalized():
    facts = extract_facts("DOB: 05/12/2009")
    # 05/12/2009 = 5 Dec OR 12 May -> keep raw, do not pick an ISO value.
    assert "05/12/2009" in facts["dates"]
    assert "2009-12-05" not in facts["dates"]
    assert "2009-05-12" not in facts["dates"]


def test_unambiguous_dd_mm_date_is_normalized():
    facts = extract_facts("DOB: 31/01/2000")
    assert "2000-01-31" in facts["dates"]


def test_unambiguous_mm_dd_date_is_normalized():
    facts = extract_facts("DOB: 12/25/2009")
    assert "2009-12-25" in facts["dates"]