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
    text = "DOB: 12/05/2009"
    facts = extract_facts(text)
    assert "2009-05-12" in facts["dates"]


def test_date_extraction_dash():
    text = "DOB: 12-05-2009"
    facts = extract_facts(text)
    assert "2009-05-12" in facts["dates"]


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