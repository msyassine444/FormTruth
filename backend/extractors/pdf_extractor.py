from typing import Optional
from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .base import BaseExtractor, ExtractionError


class PdfExtractor(BaseExtractor):
    SUPPORTED_EXTENSIONS = {".pdf"}
    SUPPORTED_CONTENT_TYPES = {
        "application/pdf",
        "application/octet-stream",
    }

    def extract(
        self,
        filename: Optional[str],
        content_type: Optional[str],
        data: bytes,
    ) -> str:
        self.validate(filename, content_type, data)

        try:
            reader = PdfReader(BytesIO(data))
        except PdfReadError as e:
            raise ExtractionError(f"Invalid PDF: {e}") from e

        if reader.is_encrypted:
            # نحاول فتحه بكلمة مرور فارغة
            try:
                reader.decrypt("")
            except Exception:
                raise ExtractionError("PDF is encrypted and cannot be read")

        pages_text = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception as e:
                raise ExtractionError(f"Failed to extract page {i + 1}: {e}") from e
            pages_text.append(text)

        full_text = "\n".join(pages_text).strip()
        if not full_text:
            raise ExtractionError("No extractable text found in PDF (may be scanned image)")
        return full_text


_extractor = PdfExtractor()


def extract_text(
    filename: Optional[str],
    content_type: Optional[str],
    data: bytes,
) -> str:
    return _extractor.extract(filename, content_type, data)