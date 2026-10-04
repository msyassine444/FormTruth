from fastapi import FastAPI, HTTPException, UploadFile, File
from . import __version__
from .models import (
    CompareRequest,
    CompareResponse,
    ExtractResponse,
    ExtractFactsResponse,
    Facts,
    BuildTruthRequest,
    BuildTruthResponse,
)
from .services import compare_data
from .extractors.base import ExtractionError
from .extractors.dispatcher import extract_any
from .parsers.facts import extract_facts
from .parsers.context import extract_contextual_facts
from .builders.truth_builder import build_truth

app = FastAPI(title="FormTruth", version=__version__)


@app.get("/")
def home():
    return {"message": "FormTruth is running", "version": __version__}


@app.post("/compare", response_model=CompareResponse)
def compare_endpoint(request: CompareRequest):
    try:
        return compare_data(request.truth, request.form)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/extract", response_model=ExtractResponse)
async def extract_endpoint(file: UploadFile = File(...)):
    data = await file.read()
    try:
        text = extract_any(
            filename=file.filename,
            content_type=file.content_type,
            data=data,
        )
    except ExtractionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ExtractResponse(
        filename=file.filename or "unknown",
        content_type=file.content_type,
        size=len(data),
        text=text,
    )


@app.post("/extract-facts", response_model=ExtractFactsResponse)
async def extract_facts_endpoint(file: UploadFile = File(...)):
    data = await file.read()
    try:
        text = extract_any(
            filename=file.filename,
            content_type=file.content_type,
            data=data,
        )
    except ExtractionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    raw_facts = extract_facts(text)
    contextual = extract_contextual_facts(text)
    return ExtractFactsResponse(
        filename=file.filename or "unknown",
        size=len(data),
        facts=Facts(**raw_facts),
        contextual=contextual,
    )


@app.post("/build-truth", response_model=BuildTruthResponse)
def build_truth_endpoint(request: BuildTruthRequest):
    result = build_truth(
        facts=request.facts.model_dump(),
        hints=request.hints,
        contextual=request.contextual,
    )
    return BuildTruthResponse(**result)