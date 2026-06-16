"""Goal‑achievement prediction model — estimates the probability and timeline
for a user to reach their target weight."""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
from sklearn.linear_model import LinearRegression

from app.schemas.prediction import (
    GoalPredictionRequest,
    GoalPredictionResponse,
)
from app.utils.calculations import CALORIES_PER_KG, calculate_daily_deficit


class GoalPredictor:
    """Predicts whether a user will reach their goal weight, when, and why they might not."""

    MIN_HISTORY = 5

    def predict(self, request: GoalPredictionRequest) -> GoalPredictionResponse:
        daily_deficit = calculate_daily_deficit(request.tdee, request.daily_calories)

        weight_to_lose = request.current_weight - request.goal_weight

        # Handle edge‑case: already at or below goal
        if weight_to_lose <= 0:
            return GoalPredictionResponse(
                probability=1.0,
                estimated_days=0,
                estimated_date=datetime.now().strftime("%Y-%m-%d"),
                risk_factors=[],
            )

        # ---------- Estimated days (energy‑balance) ----------
        if daily_deficit > 0:
            estimated_days = int(
                round(weight_to_lose * CALORIES_PER_KG / daily_deficit)
            )
        else:
            # No deficit → essentially unreachable
            estimated_days = 9999

        estimated_date = (datetime.now() + timedelta(days=estimated_days)).strftime(
            "%Y-%m-%d"
        )

        # ---------- Risk factors ----------
        risk_factors = self._identify_risks(request, daily_deficit, estimated_days)

        # ---------- Probability ----------
        probability = self._calculate_probability(
            request, daily_deficit, estimated_days, risk_factors
        )

        return GoalPredictionResponse(
            probability=round(probability, 2),
            estimated_days=estimated_days,
            estimated_date=estimated_date,
            risk_factors=risk_factors,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _identify_risks(
        self,
        request: GoalPredictionRequest,
        daily_deficit: float,
        estimated_days: int,
    ) -> list[str]:
        risks: list[str] = []

        # Deficit too aggressive — intake below safe minimums
        intake = request.daily_calories
        if intake < 1200:
            risks.append(
                "Daily calorie intake is below 1 200 kcal — this is not sustainable "
                "and may cause metabolic slowdown."
            )
        elif intake < 1500:
            risks.append(
                "Daily calorie intake is below 1 500 kcal — ensure adequate "
                "nutrient intake and consult a professional."
            )

        # No meaningful deficit
        if daily_deficit <= 0:
            risks.append(
                "Current calorie intake exceeds or matches TDEE — no deficit "
                "means no expected weight loss."
            )

        # Very aggressive deficit (> 1 000 kcal/day)
        if daily_deficit > 1000:
            risks.append(
                "Deficit exceeds 1 000 kcal/day — risk of muscle loss and "
                "metabolic adaptation. Consider a more moderate approach."
            )

        # Timeline too long (> 1 year)
        if estimated_days > 365:
            risks.append(
                "Estimated timeline exceeds one year — long timelines increase "
                "the chance of adherence fatigue."
            )

        # Inconsistent logging — check historical variance
        if len(request.historical_weights) >= self.MIN_HISTORY:
            weights = [h.weight for h in request.historical_weights]
            diffs = [weights[i + 1] - weights[i] for i in range(len(weights) - 1)]
            positive_count = sum(1 for d in diffs if d > 0)
            if positive_count / len(diffs) > 0.4:
                risks.append(
                    "Historical data shows frequent weight increases — "
                    "inconsistent deficit adherence."
                )

            # Plateau pattern — last N entries nearly flat
            recent = weights[-7:] if len(weights) >= 7 else weights
            if max(recent) - min(recent) < 0.3:
                risks.append(
                    "Recent weight measurements show a plateau pattern — "
                    "consider adjusting calories or activity."
                )

        return risks

    def _calculate_probability(
        self,
        request: GoalPredictionRequest,
        daily_deficit: float,
        estimated_days: int,
        risk_factors: list[str],
    ) -> float:
        """Heuristic probability based on deficit quality, timeline, and trend."""
        prob = 1.0

        # Penalise each risk factor
        prob -= 0.12 * len(risk_factors)

        # Penalise no/negative deficit
        if daily_deficit <= 0:
            prob -= 0.4

        # Penalise very long timelines
        if estimated_days > 365:
            prob -= 0.15
        elif estimated_days > 180:
            prob -= 0.08

        # Bonus for strong historical downward trend
        if len(request.historical_weights) >= self.MIN_HISTORY:
            weights = np.array([h.weight for h in request.historical_weights])
            x = np.arange(len(weights)).reshape(-1, 1)
            lr = LinearRegression().fit(x, weights)
            if lr.coef_[0] < -0.02:
                prob += 0.1  # clear downward trend

        return max(0.05, min(prob, 0.99))
