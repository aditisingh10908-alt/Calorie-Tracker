import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def generate_synthetic_data(num_users=50, days_per_user=60):
    """Generates synthetic historical calorie log and weight tracking data for ML model training demonstration."""
    np.random.seed(42)
    data = []

    activity_levels = ["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]
    activity_multipliers = {
        "SEDENTARY": 1.2,
        "LIGHT": 1.375,
        "MODERATE": 1.55,
        "ACTIVE": 1.725,
        "VERY_ACTIVE": 1.9,
    }

    start_date = datetime.now() - timedelta(days=days_per_user)

    for user_id in range(num_users):
        # Generate user baseline stats
        gender = np.random.choice(["male", "female"])
        height = (
            np.random.normal(175, 7) if gender == "male" else np.random.normal(162, 6)
        )
        age = np.random.randint(18, 65)
        start_weight = (
            np.random.normal(85, 12) if gender == "male" else np.random.normal(72, 10)
        )
        goal_weight = start_weight - np.random.randint(5, 15)
        activity_level = np.random.choice(activity_levels)

        # Calculate TDEE
        if gender == "male":
            bmr = 10 * start_weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * start_weight + 6.25 * height - 5 * age - 161
        tdee = bmr * activity_multipliers[activity_level]

        # Trajectory details
        adherence_score = np.random.uniform(0.5, 0.95)  # user's logging consistency
        target_deficit = np.random.randint(300, 700)
        target_calories = max(1200, tdee - target_deficit)

        weight = start_weight

        for day in range(days_per_user):
            date_str = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")

            # Did the user log today?
            logged = np.random.random() < adherence_score

            if logged:
                # Calories consumed fluctuates around target
                calories_consumed = int(
                    np.random.normal(target_calories, 150)
                )
                calories_consumed = max(1000, calories_consumed)
            else:
                # User did not log, calories tend to be higher (closer to maintenance)
                calories_consumed = int(np.random.normal(tdee, 200))

            deficit = tdee - calories_consumed

            # Weight loss: 7700 kcal ≈ 1 kg fat loss (plus some water weight noise)
            weight_change = -(deficit / 7700.0) + np.random.normal(0, 0.1)
            weight += weight_change

            data.append(
                {
                    "user_id": user_id,
                    "date": date_str,
                    "height": round(height, 1),
                    "age": age,
                    "gender": gender,
                    "activity_level": activity_level,
                    "tdee": round(tdee),
                    "target_calories": round(target_calories),
                    "calories_consumed": calories_consumed,
                    "deficit": round(deficit),
                    "weight": round(weight, 2),
                    "goal_weight": round(goal_weight, 2),
                    "adherence": round(adherence_score, 2),
                }
            )

    return pd.DataFrame(data)


if __name__ == "__main__":
    df = generate_synthetic_data()
    df.to_csv("datasets/sample_data.csv", index=False)
    print(f"Generated {len(df)} synthetic rows in datasets/sample_data.csv")
