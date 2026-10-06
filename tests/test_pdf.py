from io import BytesIO

import pytest
from pypdf import PdfWriter
from fastapi.testclient import TestClient

from backend.main import app
from backend.extractors.pdf_extractor import extract_text

client = TestClient(app)


# ---------------------------------------------------------------------------
# Deterministic, dependency-free PDF fixture.
# Builds a minimal, valid PDF containing real text so extraction is actually
# exercised (no external libraries, no committed binary file).
# ---------------------------------------------------------------------------

def _escape(value: str) -> str:
    return value.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def _make_text_pdf(lines: list[str]) -> bytes:
    parts = ["BT", "/F1 12 Tf", "40 760 Td", "16 TL"]
    for index, line in enumerate(lines):
        if index:
            parts.append("T*")
        parts.append("(" + _escape(line) + ") Tj")
    parts.append("ET")
    stream = "\n".join(parts).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + obj + b"\nendobj\n"

    xref_pos = len(out)
    size = len(objects) + 1
    out += f"xref\n0 {size}\n".encode() + b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        b"trailer\n<< /Size " + str(size).encode() + b" /Root 1 0 R >>\n"
        + b"startxref\n" + str(xref_pos).encode() + b"\n%%EOF\n"
    )
    return bytes(out)


def _make_blank_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


CV_PDF = _make_text_pdf([
    "Name: Sara El Idrissi",
    "Email: sara@example.com",
    "Phone: 0612345678",
    "DOB: 2009-05-12",
])


@pytest.fixture
def blank_pdf():
    return _make_blank_pdf()


# ---------- Extractor direct ----------

def test_pdf_extracts_real_text_from_generated_fixture():
    text = extract_text("cv.pdf", "application/pdf", CV_PDF)
    assert "Sara El Idrissi" in text
    assert "sara@example.com" in text
    assert "0612345678" in text


def test_pdf_rejects_non_pdf_bytes():
    with pytest.raises(Exception):
        extract_text("file.pdf", "application/pdf", b"not a pdf")


def test_pdf_rejects_empty():
    with pytest.raises(Exception):
        extract_text("file.pdf", "application/pdf", b"")


def test_pdf_accepts_blank_page(blank_pdf):
    # PDF without text -> ExtractionError
    with pytest.raises(Exception) as exc:
        extract_text("file.pdf", "application/pdf", blank_pdf)
    assert "No extractable text" in str(exc.value) or "text" in str(exc.value).lower()


# ---------- Endpoint ----------

def test_extract_endpoint_pdf_text():
    response = client.post(
        "/extract",
        files={"file": ("cv.pdf", CV_PDF, "application/pdf")},
    )
    assert response.status_code == 200
    assert "Sara El Idrissi" in response.json()["text"]


def test_extract_facts_endpoint_pdf_text():
    response = client.post(
        "/extract-facts",
        files={"file": ("cv.pdf", CV_PDF, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "sara@example.com" in data["facts"]["emails"]
    assert "612345678" in data["facts"]["phones"]
    assert "2009-05-12" in data["facts"]["dates"]


def test_extract_endpoint_pdf_blank(blank_pdf):
    response = client.post(
        "/extract",
        files={"file": ("blank.pdf", blank_pdf, "application/pdf")},
    )
    assert response.status_code == 400


def test_extract_facts_endpoint_pdf_blank(blank_pdf):
    response = client.post(
        "/extract-facts",
        files={"file": ("blank.pdf", blank_pdf, "application/pdf")},
    )
    assert response.status_code == 400


def test_extract_endpoint_unsupported_extension_still_rejected():
    response = client.post(
        "/extract",
        files={"file": ("file.docx", b"fake docx", "application/msword")},
    )
    assert response.status_code == 400


# ---------- Full pipeline ----------

def test_full_pipeline_with_pdf():
    r1 = client.post(
        "/extract-facts",
        files={"file": ("cv.pdf", CV_PDF, "application/pdf")},
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
    assert truth["name"] == "Sara El Idrissi"
    assert truth["email"] == "sara@example.com"
    assert truth["phone"] == "612345678"
    assert truth["dob"] == "2009-05-12"

    r3 = client.post("/compare", json={
        "truth": truth,
        "form": {
            "name": "Sara El Idrissi",
            "email": "Sara@Example.com",
            "phone": "+212612345678",
            "dob": "2009/05/12",
        },
    })
    assert r3.status_code == 200
    assert r3.json()["summary"] == {"MATCH": 4, "CONFLICT": 0, "UNKNOWN": 0}