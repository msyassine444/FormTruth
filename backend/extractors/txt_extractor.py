from typing import Optional
from .base import BaseExtractor, ExtractionError


class TxtExtractor(BaseExtractor):
    SUPPORTED_EXTENSIONS = {".txt"}
    SUPPORTED_CONTENT_TYPES = {
        "text/plain",
        "application/octet-stream",
        "application/txt",
    }

    @staticmethod
    def _decode(data: bytes) -> str:
        for encoding in ("utf-8-sig", "utf-8", "utf-16", "latin-1"):
            try:
                return data.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise ExtractionError("Unable to decode file with supported encodings")

    def extract(
        self,
        filename: Optional[str],
        content_type: Optional[str],
        data: bytes,
    ) -> str:
        self.validate(filename, content_type, data)
        return self._decode(data)


_extractor = TxtExtractor()


def extract_text(
    filename: Optional[str],
    content_type: Optional[str],
    data: bytes,
) -> str:
    return _extractor.extract(filename, content_type, data)