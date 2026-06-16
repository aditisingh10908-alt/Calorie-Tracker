"""Weight prediction model — blends energy‑balance physics with linear‑regression
trend analysis when sufficient historical data is available."""

from __future__ import annotations

from datetime import datetime

import numpy as np
from sklearn.linear_model import LinearRegression

from app.schemas.prediction import (
    WeightPredictionRequest,
    WeightPredictionResponse,
)
from app.utils.calculations import CALORIES_PER_KG, calculate_daily_deficit


class WeightPredictor:
    """Predicts weight at 7‑day and 30‑day horizons.

    Strategy
    --------
    1. **Energy‑balance model** — ``weight_change = ‑deficit × days / 7700``
    2. If ≥ 5 historical entries exist, fit a ``LinearRegression`` on the
       ordinal‑day index and **blend** the two forecasts (60 % energy‑balance,
       40 % trend) to account for metabolic adaptation.
    3. Confidence is derived from R² of the regression (or 0.5 baseline when
       there is insufficient history).
    """

    # Minimum historical entries to activate trend blending
    MIN_HISTORY = 5

    # Blend weights: energy‑balance vs. historical trend
    ENERGY_WEIGHT = 0.6
    TREND_WEIGHT = 0.4

    def predict(self, request: WeightPredictionRequest) -> WeightPredictionResponse:
        daily_deficit = calculate_daily_deficit(request.tdee, request.daily_calories)

        # Pure energy‑balance predictions
        eb_7d = request.current_weight - (daily_deficit * 7) / CALORIES_PER_KG
        eb_30d = request.current_weight - (daily_deficit * 30) / CALORIES_PER_KG

        confidence: float
        predicted_7d: float
        predicted_30d: float

        if len(request.historical_weights) >= self.MIN_HISTORY:
            predicted_7d, predicted_30d, confidence = self._blend_with_trend(
                request, eb_7d, eb_30d
            )
        else:
            predicted_7d = round(eb_7d, 2)
            predicted_30d = round(eb_30d, 2)
            confidence = 0.5  # baseline when no trend data

        weekly_rate = round((predicted_7d - request.current_weight), 2)

        return WeightPredictionResponse(
            predicted_weight_7d=predicted_7d,
            predicted_weight_30d=predicted_30d,
            weekly_rate=weekly_rate,
            confidence=round(confidence, 2),
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _blend_with_trend(
        self,
        request: WeightPredictionRequest,
        eb_7d: float,
        eb_30d: float,
    ) -> tuple[float, float, float]:
        """Fit linear regression on historical weights and blend forecasts."""

        # Convert dates → ordinal days
        entries = sorted(request.historical_weights, key=lambda h: h.date)
        dates = [datetime.strptime(e.date, "%Y-%m-%d") for e in entries]
        day_offsets = np.array(
            [(d - dates[0]).days for d in dates], dtype=np.float64
        ).reshape(-1, 1)
        weights = np.array([e.weight for e in entries], dtype=np.float64)

        model = LinearRegression()
        model.fit(day_offsets, weights)

        r_squared = float(model.score(day_offsets, weights))
        confidence = max(0.0, min(1.0, 0.4 + 0.6 * r_squared))

        # Project from the *last* historical date
        last_offset = float(day_offsets[-1][0])
        trend_7d = float(model.predict(np.array([[last_offset + 7]]))[0])
        trend_30d = float(model.predict(np.array([[last_offset + 30]]))[0])

        blended_7d = round(
            self.ENERGY_WEIGHT * eb_7d + self.TREND_WEIGHT * trend_7d, 2
        )
        blended_30d = round(
            self.ENERGY_WEIGHT * eb_30d + self.TREND_WEIGHT * trend_30d, 2
        )

        return blended_7d, blended_30d, confidence
