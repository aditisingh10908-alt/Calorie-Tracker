"""Core nutrition and energy‑balance calculation utilities.

All weights are in **kg**, heights in **cm**, and energy values in **kcal**.
"""

from __future__ import annotations

# 7 700 kcal ≈ 1 kg of body fat
CALORIES_PER_KG: float = 7700.0

ACTIVITY_MULTIPLIERS: dict[str, float] = {
    "SEDENTARY": 1.2,
    "LIGHT": 1.375,
    "MODERATE": 1.55,
    "ACTIVE": 1.725,
    "VERY_ACTIVE": 1.9,
}


def _normalise_activity(activity_level: str) -> str:
    """Return the canonical upper‑case activity key."""
    key = activity_level.strip().upper().replace(" ", "_")
    if key not in ACTIVITY_MULTIPLIERS:
        raise ValueError(
            f"Unknown activity_level '{activity_level}'. "
            f"Expected one of {list(ACTIVITY_MULTIPLIERS)}"
        )
    return key


# ------------------------------------------------------------------
# BMR — Mifflin‑St Jeor equation
# ------------------------------------------------------------------


def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
    """Return Basal Metabolic Rate (kcal/day) via Mifflin‑St Jeor.

    Male:   (10 × weight) + (6.25 × height) − (5 × age) + 5
    Female: (10 × weight) + (6.25 × height) − (5 × age) − 161
    """
    base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
    if gender.strip().lower() == "male":
        return base + 5.0
    return base - 161.0


# ------------------------------------------------------------------
# TDEE
# ------------------------------------------------------------------


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Return Total Daily Energy Expenditure (kcal/day)."""
    key = _normalise_activity(activity_level)
    return bmr * ACTIVITY_MULTIPLIERS[key]


# ------------------------------------------------------------------
# Deficit & weight change
# ------------------------------------------------------------------


def calculate_daily_deficit(tdee: float, calories_consumed: float) -> float:
    """Return the calorie deficit for a single day (positive = deficit)."""
    return tdee - calories_consumed


def calculate_weight_change(deficit: float, days: int) -> float:
    """Return expected weight change (kg) over *days* given a daily *deficit*.

    A positive deficit → negative weight change (weight loss).
    """
    return -(deficit * days) / CALORIES_PER_KG


# ------------------------------------------------------------------
# Macros & hydration
# ------------------------------------------------------------------

_PROTEIN_BY_ACTIVITY: dict[str, tuple[float, float]] = {
    "SEDENTARY": (0.8, 1.0),
    "LIGHT": (1.0, 1.4),
    "MODERATE": (1.4, 1.8),
    "ACTIVE": (1.6, 2.0),
    "VERY_ACTIVE": (1.8, 2.2),
}


def calculate_protein_requirement(weight_kg: float, activity_level: str) -> float:
    """Return recommended daily protein (g) — midpoint of range for activity."""
    key = _normalise_activity(activity_level)
    lo, hi = _PROTEIN_BY_ACTIVITY[key]
    return weight_kg * (lo + hi) / 2.0


_WATER_ML_PER_KG_BY_ACTIVITY: dict[str, float] = {
    "SEDENTARY": 30.0,
    "LIGHT": 33.0,
    "MODERATE": 35.0,
    "ACTIVE": 38.0,
    "VERY_ACTIVE": 40.0,
}


def calculate_water_requirement(weight_kg: float, activity_level: str) -> int:
    """Return recommended daily water intake in ml."""
    key = _normalise_activity(activity_level)
    return int(round(weight_kg * _WATER_ML_PER_KG_BY_ACTIVITY[key]))
