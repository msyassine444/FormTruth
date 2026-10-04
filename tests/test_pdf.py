from io import BytesIO

import pytest
from pypdf import PdfWriter
from fastapi.testclient import TestClient

from backend.main import app
from backend.extractors.pdf_extractor import extract_text
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.pdf"


@pytest.mark.skipif(not FIXTURE.exists(), reason="sample.pdf fixture not found")
def test_pdf_real_fixture():
    data = FIXTURE.read_bytes()
    text = extract_text("sample.pdf", "application/pdf", data)
    assert len(text) > 0
client = TestClient(app)


def _make_pdf_with_text(text: str) -> bytes:
    """
    pypdf لا يدعم إنشاء PDF من نص مباشرة بدون خطوط.
    سنستخدم بدلاً من ذلك pypdf لدمج صفحة فارغة — لكن هذا لا يختبر الاستخراج.
    """
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


@pytest.fixture
def minimal_pdf():
    return _make_pdf_with_text("")


# ---------- Extractor direct ----------

def test_pdf_rejects_non_pdf_bytes():
    with pytest.raises(Exception):
        extract_text("file.pdf", "application/pdf", b"not a pdf")


def test_pdf_rejects_empty():
    with pytest.raises(Exception):
        extract_text("file.pdf", "application/pdf", b"")


def test_pdf_accepts_blank_page(minimal_pdf):
    # PDF بدون نص → ExtractionError
    with pytest.raises(Exception) as exc:
        extract_text("file.pdf", "application/pdf", minimal_pdf)
    assert "No extractable text" in str(exc.value) or "text" in str(exc.value).lower()


# ---------- Endpoint ----------

def test_extract_endpoint_pdf_blank(minimal_pdf):
    response = client.post(
        "/extract",
        files={"file": ("blank.pdf", minimal_pdf, "application/pdf")},
    )
    # نقبل 400 لأن PDF بلا نص
    assert response.status_code == 400


def test_extract_facts_endpoint_pdf_blank(minimal_pdf):
    response = client.post(
        "/extract-facts",
        files={"file": ("blank.pdf", minimal_pdf, "application/pdf")},
    )
    assert response.status_code == 400


def test_extract_endpoint_unsupported_extension_still_rejected():
    response = client.post(
        "/extract",
        files={"file": ("file.docx", b"fake docx", "application/msword")},
    )
    assert response.status_code == 400