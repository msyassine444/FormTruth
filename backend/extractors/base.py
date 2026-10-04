from typing import Optional


class ExtractionError(Exception):
    pass


class BaseExtractor:
    SUPPORTED_EXTENSIONS: set[str] = set()
    SUPPORTED_CONTENT_TYPES: set[str] = set()
    MAX_SIZE_BYTES: int = 5 * 1024 * 1024

    def can_handle(self, filename: str) -> bool:
        lower = (filename or "").lower()
        return any(lower.endswith(ext) for ext in self.SUPPORTED_EXTENSIONS)

    def validate(
        self,
        filename: Optional[str],
        content_type: Optional[str],
        data: bytes,
    ) -> None:
        if not filename:
            raise ExtractionError("Missing filename")

        if len(data) > self.MAX_SIZE_BYTES:
            raise ExtractionError(
                f"File too large: {len(data)} bytes (max {self.MAX_SIZE_BYTES})"
            )

        if len(data) == 0:
            raise ExtractionError("Empty file")

        if not self.can_handle(filename):
            raise ExtractionError(
                f"Unsupported extension. Allowed: {sorted(self.SUPPORTED_EXTENSIONS)}"
            )

        if (
            content_type
            and self.SUPPORTED_CONTENT_TYPES
            and content_type not in self.SUPPORTED_CONTENT_TYPES
        ):
            raise ExtractionError(f"Unsupported content type: {content_type}")

    def extract(
        self,
        filename: Optional[str],
        content_type: Optional[str],
        data: bytes,
    ) -> str:
        raise NotImplementedError