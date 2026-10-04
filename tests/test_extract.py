from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def _upload(filename: str, content: bytes, content_type: str = "text/plain"):
    files = {"file": (filename, content, content_type)}
    return client.post("/extract", files=files)


# ---------- Happy path ----------

def test_extract_simple_txt():
    response = _upload("cv.txt", b"Hello FormTruth")
    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "cv.txt"
    assert data["text"] == "Hello FormTruth"
    assert data["size"] == 15


def test_extract_utf8_arabic():
    content = "الاسم: ياسين".encode("utf-8")
    response = _upload("cv.txt", content)
    assert response.status_code == 200
    assert response.json()["text"] == "الاسم: ياسين"


def test_extract_with_bom():
    content = "\ufeffName: Yassine Annous".encode("utf-8")
    response = _upload("cv.txt", content)
    assert response.status_code == 200
    # BOM يجب أن يُزال
    assert response.json()["text"].startswith("Name:")


# ---------- Errors ----------

def test_extract_missing_extension():
    response = _upload("cv", b"Hello")
    assert response.status_code == 400
    assert "extension" in response.json()["detail"].lower()


def test_extract_wrong_extension():
    response = _upload("cv.pdf", b"%PDF-1.4 ...")
    assert response.status_code == 400


def test_extract_empty_file():
    response = _upload("cv.txt", b"")
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_extract_too_large():
    big = b"a" * (5 * 1024 * 1024 + 1)
    response = _upload("cv.txt", big)
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


def test_extract_missing_file_field():
    response = client.post("/extract")
    assert response.status_code == 422