from pydantic import BaseModel
from typing import Any, Dict, List, Literal


class CompareRequest(BaseModel):
    truth: Dict[str, Any]
    form: Dict[str, Any]


class FieldResult(BaseModel):
    field: str
    status: Literal["MATCH", "CONFLICT", "UNKNOWN"]
    truth: Any | None = None
    form: Any | None = None


class CompareResponse(BaseModel):
    results: list[FieldResult]
    summary: Dict[str, int]


class ExtractResponse(BaseModel):
    filename: str
    content_type: str | None = None
    size: int
    text: str


class Facts(BaseModel):
    emails: List[str] = []
    phones: List[str] = []
    dates: List[str] = []
    urls: List[str] = []
    names: List[str] = []
    national_ids: List[str] = []


class ExtractFactsResponse(BaseModel):
    filename: str
    size: int
    facts: Facts
    contextual: Dict[str, Any] = {}


class BuildTruthRequest(BaseModel):
    facts: Facts
    hints: Dict[str, Any] = {}
    contextual: Dict[str, Any] = {}


class BuildTruthResponse(BaseModel):
    truth: Dict[str, Any]
    warnings: List[str] = []