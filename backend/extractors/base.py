import os
from typing import Optional

# Configurable via environment variable; keeps a sane 5 MB default.
def _default_max_size() -> int:
    try:
        value = int(os.environ.get("FORM_TRUTH_MAX_UPLOAD_BYTES", ""))
        return value if value > 0 else 5 * 1024 * 1024
    except (TypeError, ValueError):
        return 5 * 1024 * 1024


class ExtractionError(Exception):
    pass


class BaseExtractor:
    SUPPORTED_EXTENSIONS: set[str] = set()
    SUPPORTED_CONTENT_TYPES: set[str] = set()
    MAX_SIZE_BYTES: int = _default_max_size()

    def max_size_bytes(self) -> int:
        # Read the environment at call time so operators (and tests)
        # can override the limit without re-importing modules.
        return _default_max_size() if "FORM_TRUTH_MAX_UPLOAD_BYTES" in os.environ else self.MAX_SIZE_BYTES

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

        if len(data) > self.max_size_bytes():
            raise ExtractionError(
                f"File too large: {len(data)} bytes (max {self.max_size_bytes()})"
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