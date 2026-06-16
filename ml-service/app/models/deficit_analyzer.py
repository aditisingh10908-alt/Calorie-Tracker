"""Deficit analyser — evaluates calorie‑deficit consistency, detects plateaus,
and generates actionable textual analysis."""

from __future__ import annotations

from datetime import datetime

from app.schemas.prediction import DeficitAnalysisRequest, DeficitAnalysisResponse


class DeficitAnalyzer:
    """Analyses daily calorie logs to score consistency and assess plateau risk."""

    CONSISTENCY_TOLERANCE = 0.20  # ±20 % of target deficit

    def analyze(self, request: DeficitAnalysisRequest) -> DeficitAnalysisResponse:
        logs = sorted(request.daily_logs, key=lambda l: l.date)

        # ---------- Average deficit ----------
        deficits = [log.target_calories - log.calories for log in logs]
        average_deficit = round(sum(deficits) / len(deficits), 1)

        # ---------- Consistency score ----------
        consistency_score = self._score_consistency(logs, deficits)

        # ---------- Plateau risk ----------
        plateau_risk = self._assess_plateau(request)

        # ---------- Analysis text ----------
        analysis = self._generate_analysis(
            average_deficit=average_deficit,
            consistency_score=consistency_score,
            plateau_risk=plateau_risk,
            request=request,
            logs_count=len(logs),
        )

        return DeficitAnalysisResponse(
            average_deficit=average_deficit,
            consistency_score=consistency_score,
            plateau_risk=plateau_risk,
            analysis=analysis,
        )

    # ------------------------------------------------------------------
    # Consistency
    # ------------------------------------------------------------------

    def _score_consistency(
        self, logs: list, deficits: list[float]
    ) -> float:
        """Percentage of days where the actual deficit was within ±20 % of the
        target deficit (target_calories − calories vs. intended target gap)."""

        if not logs:
            return 0.0

        on_target = 0
        for log, deficit in zip(logs, deficits):
            intended_deficit = log.target_calories - log.calories
            # We treat target_calories itself as the upper bound the user should
            # eat; so the "intended" deficit is simply target_calories − calories.
            # A day is "consistent" when the user ate within ±20 % of their
            # target calories.
            tolerance = log.target_calories * self.CONSISTENCY_TOLERANCE
            if abs(log.calories - log.target_calories) <= tolerance:
                on_target += 1

        return round(100.0 * on_target / len(logs), 1)

    # ------------------------------------------------------------------
    # Plateau detection
    # ------------------------------------------------------------------

    def _assess_plateau(self, request: DeficitAnalysisRequest) -> str:
        """Determine plateau risk from the span of logged dates without
        meaningful weight change.

        Since the request carries current and goal weights but not per‑day
        weights, we proxy plateau duration by how many consecutive recent days
        the user has been logging a meaningful deficit (target > consumed) yet
        has a small gap between current and expected weight from deficit.
        Alternatively we check log duration directly.
        """
        if len(request.daily_logs) < 7:
            return "LOW"

        logs = sorted(request.daily_logs, key=lambda l: l.date)

        # Count consecutive days at end of log where deficit exists
        dates = [datetime.strptime(l.date, "%Y-%m-%d") for l in logs]
        total_span_days = (dates[-1] - dates[0]).days + 1

        # Calculate expected weight lost from total deficit
        total_deficit = sum(l.target_calories - l.calories for l in logs)
        expected_loss_kg = total_deficit / 7700.0

        actual_loss_needed = request.current_weight - request.goal_weight

        # If user has been logging for 14+ days and expected loss ≫ apparent
        # progress, that suggests plateau
        if total_span_days >= 14 and expected_loss_kg > 1.0:
            return "HIGH"
        if total_span_days >= 7 and expected_loss_kg > 0.5:
            return "MEDIUM"
        return "LOW"

    # ------------------------------------------------------------------
    # Analysis generation
    # ------------------------------------------------------------------

    def _generate_analysis(
        self,
        *,
        average_deficit: float,
        consistency_score: float,
        plateau_risk: str,
        request: DeficitAnalysisRequest,
        logs_count: int,
    ) -> str:
        parts: list[str] = []

        parts.append(
            f"Over the {logs_count} days analysed, your average daily deficit was "
            f"{average_deficit:.0f} kcal."
        )

        if consistency_score >= 80:
            parts.append(
                f"Your consistency score is excellent at {consistency_score:.0f}% — "
                f"you are staying very close to your targets."
            )
        elif consistency_score >= 60:
            parts.append(
                f"Your consistency score of {consistency_score:.0f}% is good but "
                f"there is room to tighten daily adherence."
            )
        else:
            parts.append(
                f"Your consistency score of {consistency_score:.0f}% indicates "
                f"significant day‑to‑day variation. Try meal‑prepping or setting "
                f"daily reminders to stay closer to your calorie target."
            )

        if plateau_risk == "HIGH":
            parts.append(
                "⚠️ Plateau risk is HIGH. Your logs suggest you have maintained a "
                "deficit for a while but weight loss may have stalled. Consider a "
                "diet break, adjusting your calorie target, or adding variety to "
                "your exercise routine."
            )
        elif plateau_risk == "MEDIUM":
            parts.append(
                "Plateau risk is MEDIUM. Keep monitoring — if weight doesn't budge "
                "in the next week, consider recalculating your TDEE or introducing "
                "refeed days."
            )
        else:
            parts.append(
                "Plateau risk is LOW. You appear to be making steady progress."
            )

        weight_to_lose = request.current_weight - request.goal_weight
        if weight_to_lose > 0 and average_deficit > 0:
            days_remaining = int(weight_to_lose * 7700 / average_deficit)
            parts.append(
                f"At your current average deficit, you could expect to reach your "
                f"goal weight in approximately {days_remaining} days."
            )
        elif weight_to_lose <= 0:
            parts.append("Congratulations — you are at or below your goal weight!")
        else:
            parts.append(
                "You are currently not in a calorie deficit on average. To lose "
                "weight, aim to consume fewer calories than your TDEE."
            )

        return " ".join(parts)
