from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_home_returns_200():
    response = client.get("/")
    assert response.status_code == 200


def test_home_message():
    response = client.get("/")
    data = response.json()
    assert data["message"] == "FormTruth is running"
    assert "version" in data


def test_compare_match_only():
    payload = {
        "truth": {"name": "Yassine Annous"},
        "form": {"name": "Yassine Annous"},
    }
    response = client.post("/compare", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["summary"] == {"MATCH": 1, "CONFLICT": 0, "UNKNOWN": 0}
    assert data["results"][0]["field"] == "name"
    assert data["results"][0]["status"] == "MATCH"


def test_compare_mixed():
    payload = {
        "truth": {
            "name": "Yassine Annous",
            "employment_start": 2022,
            "dob": "2009-05-12",
        },
        "form": {
            "name": "Yassine Annous",
            "employment_start": 2023,
            "address": "Rabat",
        },
    }
    response = client.post("/compare", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["summary"] == {"MATCH": 1, "CONFLICT": 1, "UNKNOWN": 1}

    by_field = {r["field"]: r for r in data["results"]}
    assert by_field["name"]["status"] == "MATCH"
    assert by_field["employment_start"]["status"] == "CONFLICT"
    assert by_field["address"]["status"] == "UNKNOWN"


def test_compare_normalization_via_api():
    payload = {
        "truth": {"dob": "2009-05-12", "phone": "0612345678"},
        "form":  {"dob": "12/05/2009", "phone": "+212612345678"},
    }
    response = client.post("/compare", json=payload)
    assert response.status_code == 200
    assert response.json()["summary"] == {"MATCH": 2, "CONFLICT": 0, "UNKNOWN": 0}


def test_compare_empty_bodies():
    payload = {"truth": {}, "form": {}}
    response = client.post("/compare", json=payload)
    assert response.status_code == 200
    assert response.json()["summary"] == {"MATCH": 0, "CONFLICT": 0, "UNKNOWN": 0}


def test_compare_missing_truth_returns_422():
    payload = {"form": {"name": "Yassine Annous"}}
    response = client.post("/compare", json=payload)
    assert response.status_code == 422


def test_compare_missing_form_returns_422():
    payload = {"truth": {"name": "Yassine Annous"}}
    response = client.post("/compare", json=payload)
    assert response.status_code == 422


def test_compare_wrong_type_returns_422():
    payload = {"truth": "not a dict", "form": {"name": "Yassine Annous"}}
    response = client.post("/compare", json=payload)
    assert response.status_code == 422


def test_compare_empty_json_returns_422():
    response = client.post("/compare", json={})
    assert response.status_code == 422