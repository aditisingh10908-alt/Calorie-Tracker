"""Pydantic schemas for prediction, goal, deficit analysis, and recommendation endpoints."""

from pydantic import BaseModel, Field


class HistoricalWeight(BaseModel):
    """A single historical weight measurement."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    weight: float = Field(..., gt=0, description="Weight in kg")


class DailyLog(BaseModel):
    """A single day's calorie log entry."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    calories: float = Field(..., ge=0, description="Calories consumed")
    target_calories: float = Field(..., gt=0, description="Target calorie intake")


# ---------------------------------------------------------------------------
# Weight Prediction
# ---------------------------------------------------------------------------


class WeightPredictionRequest(BaseModel):
    """Request body for 7‑day and 30‑day weight prediction."""

    current_weight: float = Field(..., gt=0, description="Current weight in kg")
    daily_calories: float = Field(..., ge=0, description="Average daily calorie intake")
    tdee: float = Field(..., gt=0, description="Total Daily Energy Expenditure")
    activity_level: str = Field(
        ...,
        description="One of SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE",
    )
    historical_weights: list[HistoricalWeight] = Field(
        default_factory=list,
        description="Optional historical weight entries for trend analysis",
    )


class WeightPredictionResponse(BaseModel):
    """Predicted weight at 7 and 30 days with confidence."""

    predicted_weight_7d: float
    predicted_weight_30d: float
    weekly_rate: float = Field(..., description="Projected weekly weight change in kg")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence 0‑1")


# ---------------------------------------------------------------------------
# Goal Prediction
# ---------------------------------------------------------------------------


class GoalPredictionRequest(BaseModel):
    """Request body for goal‑achievement prediction."""

    current_weight: float = Field(..., gt=0)
    goal_weight: float = Field(..., gt=0)
    daily_calories: float = Field(..., ge=0)
    tdee: float = Field(..., gt=0)
    activity_level: str
    historical_weights: list[HistoricalWeight] = Field(default_factory=list)


class GoalPredictionResponse(BaseModel):
    """Probability and timeline for reaching a weight goal."""

    probability: float = Field(..., ge=0, le=1)
    estimated_days: int = Field(..., ge=0)
    estimated_date: str
    risk_factors: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Deficit Analysis
# ---------------------------------------------------------------------------


class DeficitAnalysisRequest(BaseModel):
    """Request body for calorie‑deficit analysis."""

    daily_logs: list[DailyLog] = Field(..., min_length=1)
    current_weight: float = Field(..., gt=0)
    goal_weight: float = Field(..., gt=0)


class DeficitAnalysisResponse(BaseModel):
    """Analysis of calorie deficit consistency and plateau risk."""

    average_deficit: float
    consistency_score: float = Field(..., ge=0, le=100)
    plateau_risk: str = Field(..., description="LOW, MEDIUM, or HIGH")
    analysis: str


# ---------------------------------------------------------------------------
# Recommendation
# ---------------------------------------------------------------------------


class RecommendationRequest(BaseModel):
    """Request body for personalised calorie/macro recommendations."""

    age: int = Field(..., gt=0, le=120)
    gender: str = Field(..., description="male or female")
    height: float = Field(..., gt=0, description="Height in cm")
    current_weight: float = Field(..., gt=0, description="Current weight in kg")
    goal_weight: float = Field(..., gt=0, description="Target weight in kg")
    activity_level: str = Field(
        ...,
        description="One of SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE",
    )


class RecommendationResponse(BaseModel):
    """Personalised nutrition recommendations."""

    recommended_calories: int
    recommended_protein: float = Field(..., description="Grams per day")
    recommended_water: int = Field(..., description="Millilitres per day")
    recommended_deficit: int = Field(..., description="Calorie deficit per day")
    explanation: str
