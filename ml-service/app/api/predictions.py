from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import (
    WeightPredictionRequest,
    WeightPredictionResponse,
    GoalPredictionRequest,
    GoalPredictionResponse,
    DeficitAnalysisRequest,
    DeficitAnalysisResponse,
    RecommendationRequest,
    RecommendationResponse,
)
from app.models.weight_predictor import WeightPredictor
from app.models.goal_predictor import GoalPredictor
from app.models.deficit_analyzer import DeficitAnalyzer
from app.models.recommender import Recommender

router = APIRouter()

# Instantiate predictors at router level
weight_predictor = WeightPredictor()
goal_predictor = GoalPredictor()
deficit_analyzer = DeficitAnalyzer()
recommender = Recommender()


@router.post(
    "/predict/weight",
    response_model=WeightPredictionResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_weight(request: WeightPredictionRequest):
    try:
        return weight_predictor.predict(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weight prediction failed: {str(e)}",
        )


@router.post(
    "/predict/goal",
    response_model=GoalPredictionResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_goal(request: GoalPredictionRequest):
    try:
        return goal_predictor.predict(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Goal prediction failed: {str(e)}",
        )


@router.post(
    "/analyze/deficit",
    response_model=DeficitAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_deficit(request: DeficitAnalysisRequest):
    try:
        return deficit_analyzer.analyze(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deficit analysis failed: {str(e)}",
        )


@router.post(
    "/recommend",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
)
async def recommend(request: RecommendationRequest):
    try:
        return recommender.recommend(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations generation failed: {str(e)}",
        )
