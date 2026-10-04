from fastapi.testclient import TestClient
from backend.main import app
from backend.builders.truth_builder import build_truth

client = TestClient(app)


# ---------------------------
# Unit tests: build_truth
# ---------------------------

def test_build_truth_full():
    facts = {
        "emails": ["Yassine Annous@example.com"],
        "phones": ["612345678"],
        "dates": ["2009-05-12"],
        "urls": ["https://Yassine Annous.dev"],
        "names": ["Yassine Annous"],
        "national_ids": ["AB123456"],
    }
    result = build_truth(facts)
    truth = result["truth"]
    assert truth["name"] == "Yassine Annous"
    assert truth["email"] == "Yassine Annous@example.com"
    assert truth["phone"] == "612345678"
    assert truth["dob"] == "2009-05-12"
    assert truth["website"] == "https://Yassine Annous.dev"
    assert truth["national_id"] == "AB123456"
    assert result["warnings"] == []


def test_build_truth_empty_facts():
    result = build_truth({})
    assert result["truth"] == {}
    assert result["warnings"] == []


def test_build_truth_only_email():
    result = build_truth({"emails": ["a@b.com"]})
    assert result["truth"] == {"email": "a@b.com"}


def test_build_truth_multiple_emails_picks_first():
    facts = {"emails": ["first@x.com", "second@x.com"]}
    result = build_truth(facts)
    assert result["truth"]["email"] == "first@x.com"


def test_build_truth_multiple_dates_warns():
    facts = {"dates": ["2009-05-12", "2022-01-01"]}
    result = build_truth(facts)
    assert result["truth"]["dob"] == "2009-05-12"
    assert len(result["warnings"]) == 1
    assert "Multiple dates" in result["warnings"][0]


def test_build_truth_hint_overrides_email():
    facts = {"emails": ["auto@x.com"]}
    hints = {"email": "manual@y.com"}
    result = build_truth(facts, hints)
    assert result["truth"]["email"] == "manual@y.com"


def test_build_truth_hint_overrides_dob():
    facts = {"dates": ["2009-05-12", "2022-01-01"]}
    hints = {"dob": "2009-05-12"}
    result = build_truth(facts, hints)
    assert result["truth"]["dob"] == "2009-05-12"
    assert result["warnings"] == []


def test_build_truth_extra_hints_added():
    facts = {"names": ["Yassine Annous"]}
    hints = {"employment_start": "2022"}
    result = build_truth(facts, hints)
    assert result["truth"]["name"] == "Yassine Annous"
    assert result["truth"]["employment_start"] == "2022"


# ---------------------------
# Integration tests: /build-truth
# ---------------------------

def test_build_truth_endpoint_simple():
    payload = {
        "facts": {
            "emails": ["Yassine Annous@example.com"],
            "phones": ["612345678"],
            "dates": ["2009-05-12"],
            "urls": [],
            "names": ["Yassine Annous"],
            "national_ids": [],
        },
        "hints": {},
    }
    response = client.post("/build-truth", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["truth"]["name"] == "Yassine Annous"
    assert data["truth"]["email"] == "Yassine Annous@example.com"
    assert data["truth"]["phone"] == "612345678"
    assert data["truth"]["dob"] == "2009-05-12"


def test_build_truth_endpoint_with_hints():
    payload = {
        "facts": {
            "emails": [],
            "phones": [],
            "dates": ["2009-05-12", "2022-01-01"],
            "urls": [],
            "names": [],
            "national_ids": [],
        },
        "hints": {"dob": "2009-05-12"},
    }
    response = client.post("/build-truth", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["truth"]["dob"] == "2009-05-12"
    assert data["warnings"] == []


def test_build_truth_endpoint_empty_facts():
    payload = {"facts": {}, "hints": {}}
    response = client.post("/build-truth", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["truth"] == {}
    assert data["warnings"] == []


def test_build_truth_endpoint_missing_facts_returns_422():
    response = client.post("/build-truth", json={"hints": {}})
    assert response.status_code == 422


# ---------------------------
# Full pipeline test
# ---------------------------

def test_full_pipeline_extract_build_compare():
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
    assert r1.status_code == 200
    data = r1.json()

    r2 = client.post("/build-truth", json={
        "facts": data["facts"],
        "hints": {},
        "contextual": data.get("contextual", {}),
    })
    assert r2.status_code == 200
    truth = r2.json()["truth"]

    r3 = client.post("/compare", json={
        "truth": truth,
        "form": {
            "name": "Yassine Annous",
            "email": "Yassine Annous@example.com",
            "phone": "+212612345678",
            "dob": "12/05/2009",
        },
    })
    assert r3.status_code == 200
    assert r3.json()["summary"] == {"MATCH": 4, "CONFLICT": 0, "UNKNOWN": 0}