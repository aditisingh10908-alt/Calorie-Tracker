"""Pydantic schemas for training data ingestion and training job responses."""

from pydantic import BaseModel, Field


class TrainingDataRow(BaseModel):
    """A single row of training data."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    weight: float = Field(..., gt=0)
    calories_consumed: float = Field(..., ge=0)
    target_calories: float = Field(..., gt=0)
    protein: float = Field(..., ge=0, description="Protein in grams")
    water_ml: int = Field(..., ge=0, description="Water intake in ml")
    activity_level: str


class TrainingData(BaseModel):
    """Payload containing rows of training data."""

    user_id: str = Field(..., description="User identifier")
    rows: list[TrainingDataRow] = Field(..., min_length=1)


class TrainingResponse(BaseModel):
    """Response after a training job completes."""

    status: str = Field(..., description="success or error")
    message: str
    model_path: str | None = Field(default=None, description="Path to the saved model")
    metrics: dict[str, float] = Field(
        default_factory=dict,
        description="Evaluation metrics such as MAE, RMSE",
    )
