from typing import Optional

from .base import BaseExtractor, ExtractionError
from .txt_extractor import TxtExtractor
from .pdf_extractor import PdfExtractor
from .docx_extractor import DocxExtractor


_EXTRACTORS: list[BaseExtractor] = [
    TxtExtractor(),
    PdfExtractor(),
    DocxExtractor(),
]


def get_extractor(filename: Optional[str]) -> BaseExtractor:
    if not filename:
        raise ExtractionError("Missing filename")
    for extractor in _EXTRACTORS:
        if extractor.can_handle(filename):
            return extractor
    allowed = sorted(
        ext for e in _EXTRACTORS for ext in e.SUPPORTED_EXTENSIONS
    )
    raise ExtractionError(f"Unsupported extension. Allowed: {allowed}")


def extract_any(
    filename: Optional[str],
    content_type: Optional[str],
    data: bytes,
) -> str:
    extractor = get_extractor(filename)
    return extractor.extract(filename, content_type, data)