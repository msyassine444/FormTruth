from backend.parsers.context import extract_contextual_facts


# ---------- Unit tests ----------

def test_name_extraction():
    text = "Name: Yassine Annous"
    ctx = extract_contextual_facts(text)
    assert ctx["name"] == "Yassine Annous"


def test_dob_extraction():
    text = "DOB: 2009-05-12"
    ctx = extract_contextual_facts(text)
    assert ctx["dob"] == "2009-05-12"


def test_dob_normalization():
    # 25/12 can only be DD/MM -> unambiguous, normalized to ISO.
    text = "Date of Birth: 25/12/2009"
    ctx = extract_contextual_facts(text)
    assert ctx["dob"] == "2009-12-25"


def test_dob_ambiguous_date_preserved():
    # 05/12/2009 is ambiguous -> keep raw, never guess a single date.
    text = "DOB: 05/12/2009"
    ctx = extract_contextual_facts(text)
    assert ctx["dob"] == "05/12/2009"


def test_employment_start():
    text = "Employment Start: 2022"
    ctx = extract_contextual_facts(text)
    assert ctx["employment_start"] == "2022"


def test_graduation():
    text = "Graduation: 2027-06-15"
    ctx = extract_contextual_facts(text)
    assert ctx["graduation"] == "2027-06-15"


def test_phone():
    text = "Phone: 0612345678"
    ctx = extract_contextual_facts(text)
    assert ctx["phone"] == "612345678"


def test_email():
    text = "Email: Yassine Annous@example.com"
    ctx = extract_contextual_facts(text)
    assert ctx["email"] == "Yassine Annous@example.com"


def test_address():
    text = "Address: 123 Main St, Rabat"
    ctx = extract_contextual_facts(text)
    assert ctx["address"] == "123 Main St, Rabat"


def test_multiple_fields():
    text = (
        "Name: Yassine Annous\n"
        "Email: Yassine Annous@example.com\n"
        "Phone: 0612345678\n"
        "DOB: 2009-05-12\n"
        "Employment Start: 2022\n"
    )
    ctx = extract_contextual_facts(text)
    assert ctx["name"] == "Yassine Annous"
    assert ctx["email"] == "Yassine Annous@example.com"
    assert ctx["phone"] == "612345678"
    assert ctx["dob"] == "2009-05-12"
    assert ctx["employment_start"] == "2022"


def test_arabic_labels():
    text = "الاسم: ياسين العلمي\nتاريخ الميلاد: 2009-05-12"
    ctx = extract_contextual_facts(text)
    assert ctx["name"] == "ياسين العلمي"
    assert ctx["dob"] == "2009-05-12"


def test_dash_separator():
    text = "DOB - 2009-05-12"
    ctx = extract_contextual_facts(text)
    assert ctx["dob"] == "2009-05-12"


def test_unknown_label_ignored():
    text = "Random Field: some value"
    ctx = extract_contextual_facts(text)
    assert ctx == {}


def test_empty_text():
    ctx = extract_contextual_facts("")
    assert ctx == {}


def test_no_colon_no_match():
    text = "Just a sentence with no labels"
    ctx = extract_contextual_facts(text)
    assert ctx == {}


# ---------- Integration tests ----------

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_extract_facts_endpoint_includes_contextual():
    content = (
        "Name: Yassine Annous\n"
        "DOB: 2009-05-12\n"
        "Employment Start: 2022\n"
        "Email: Yassine Annous@example.com\n"
    ).encode("utf-8")

    response = client.post(
        "/extract-facts",
        files={"file": ("cv.txt", content, "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()

    ctx = data["contextual"]
    assert ctx["name"] == "Yassine Annous"
    assert ctx["dob"] == "2009-05-12"
    assert ctx["employment_start"] == "2022"
    assert ctx["email"] == "Yassine Annous@example.com"


def test_build_truth_uses_contextual_over_general():
    content = (
        "Name: Yassine Annous\n"
        "DOB: 2009-05-12\n"
        "Graduation: 2027-06-15\n"
    ).encode("utf-8")

    r1 = client.post(
        "/extract-facts",
        files={"file": ("cv.txt", content, "text/plain")},
    )
    data = r1.json()

    r2 = client.post("/build-truth", json={
        "facts": data["facts"],
        "hints": {},
        "contextual": data["contextual"],
    })
    assert r2.status_code == 200
    truth = r2.json()["truth"]

    assert truth["name"] == "Yassine Annous"
    assert truth["dob"] == "2009-05-12"
    assert truth["graduation"] == "2027-06-15"
    # employment_start لم يظهر
    assert "employment_start" not in truth


def test_build_truth_hints_override_contextual():
    content = "DOB: 2009-05-12\n".encode("utf-8")
    r1 = client.post(
        "/extract-facts",
        files={"file": ("cv.txt", content, "text/plain")},
    )
    data = r1.json()

    r2 = client.post("/build-truth", json={
        "facts": data["facts"],
        "hints": {"dob": "1990-01-01"},
        "contextual": data["contextual"],
    })
    truth = r2.json()["truth"]
    assert truth["dob"] == "1990-01-01"


def test_full_pipeline_with_context():
    content = (
        "Name: Yassine Annous\n"
        "Email: Yassine Annous@example.com\n"
        "Phone: 0612345678\n"
        "DOB: 2009-05-12\n"
    ).encode("utf-8")

    r1 = client.post(
        "/extract-facts",
        files={"file": ("cv.txt", content, "text/plain")},
    )
    data = r1.json()

    r2 = client.post("/build-truth", json={
        "facts": data["facts"],
        "hints": {},
        "contextual": data["contextual"],
    })
    truth = r2.json()["truth"]

    r3 = client.post("/compare", json={
        "truth": truth,
        "form": {
            "name": "Yassine Annous",
            "email": "Yassine Annous@example.com",
            "phone": "+212612345678",
            "dob": "2009/05/12",
        },
    })
    assert r3.status_code == 200
    assert r3.json()["summary"] == {"MATCH": 4, "CONFLICT": 0, "UNKNOWN": 0}