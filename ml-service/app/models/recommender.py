"""Nutrition recommender — generates personalised calorie, protein, and hydration
recommendations based on user profile and goals."""

from __future__ import annotations

from app.schemas.prediction import RecommendationRequest, RecommendationResponse
from app.utils.calculations import (
    calculate_bmr,
    calculate_protein_requirement,
    calculate_tdee,
    calculate_water_requirement,
)


class Recommender:
    """Produces actionable nutrition recommendations.

    Design rules
    -------------
    * Never recommend below **1 200 kcal** for women or **1 500 kcal** for men.
    * Default deficit is **500 kcal/day** (≈ 0.5 kg/week).  Adjusted when the
      gap to goal is large (up to 750) or small (down to 250).
    * Protein: 1.6–2.2 g/kg for active users; 0.8–1.2 g/kg for sedentary.
    * Water: 30–40 ml/kg depending on activity level.
    """

    @staticmethod
    def recommend(request: RecommendationRequest) -> RecommendationResponse:
        bmr = calculate_bmr(
            gender=request.gender,
            weight_kg=request.current_weight,
            height_cm=request.height,
            age=request.age,
        )
        tdee = calculate_tdee(bmr, request.activity_level)

        # ---------- Deficit sizing ----------
        weight_gap = request.current_weight - request.goal_weight
        if weight_gap > 20:
            deficit = 750
        elif weight_gap > 10:
            deficit = 500
        elif weight_gap > 0:
            deficit = 250
        else:
            deficit = 0  # at or below goal — maintenance

        recommended_calories = int(round(tdee - deficit))

        # Enforce safe minimums
        gender_lower = request.gender.strip().lower()
        floor = 1500 if gender_lower == "male" else 1200
        if recommended_calories < floor:
            recommended_calories = floor
            deficit = int(round(tdee - recommended_calories))

        # ---------- Protein ----------
        protein = round(calculate_protein_requirement(request.current_weight, request.activity_level), 1)

        # ---------- Water ----------
        water_ml = calculate_water_requirement(request.current_weight, request.activity_level)

        # ---------- Explanation ----------
        weekly_loss = round(deficit * 7 / 7700, 2) if deficit > 0 else 0.0
        explanation = Recommender._build_explanation(
            gender=request.gender,
            bmr=bmr,
            tdee=tdee,
            deficit=deficit,
            recommended_calories=recommended_calories,
            protein=protein,
            water_ml=water_ml,
            weekly_loss=weekly_loss,
            weight_gap=weight_gap,
            activity_level=request.activity_level,
        )

        return RecommendationResponse(
            recommended_calories=recommended_calories,
            recommended_protein=protein,
            recommended_water=water_ml,
            recommended_deficit=deficit,
            explanation=explanation,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_explanation(
        *,
        gender: str,
        bmr: float,
        tdee: float,
        deficit: int,
        recommended_calories: int,
        protein: float,
        water_ml: int,
        weekly_loss: float,
        weight_gap: float,
        activity_level: str,
    ) -> str:
        lines: list[str] = []

        lines.append(
            f"Based on your profile, your estimated Basal Metabolic Rate (BMR) is "
            f"{bmr:.0f} kcal/day and your Total Daily Energy Expenditure (TDEE) with "
            f"a {activity_level.replace('_', ' ').lower()} activity level is "
            f"{tdee:.0f} kcal/day."
        )

        if deficit > 0:
            lines.append(
                f"To lose approximately {weekly_loss} kg per week, we recommend a "
                f"daily deficit of {deficit} kcal, bringing your target intake to "
                f"{recommended_calories} kcal/day."
            )
        else:
            lines.append(
                "You are at or below your goal weight — we recommend maintaining "
                f"your current intake at around {recommended_calories} kcal/day."
            )

        floor = 1500 if gender.strip().lower() == "male" else 1200
        lines.append(
            f"Note: Daily intake should not drop below {floor} kcal for "
            f"{'men' if gender.strip().lower() == 'male' else 'women'} to ensure "
            f"adequate nutrition."
        )

        lines.append(
            f"Aim for {protein:.0f} g of protein per day to support muscle "
            f"retention and satiety."
        )

        lines.append(
            f"Stay hydrated with at least {water_ml} ml ({water_ml / 1000:.1f} L) "
            f"of water daily."
        )

        if weight_gap > 20:
            lines.append(
                "You have a significant amount of weight to lose. Focus on "
                "consistency rather than speed — sustainable habits lead to "
                "lasting results."
            )

        return " ".join(lines)
