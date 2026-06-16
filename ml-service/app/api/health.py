from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    version: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
)
async def health():
    return HealthResponse(
        status="healthy",
        models_loaded=True,
        version="1.0.0",
    )
