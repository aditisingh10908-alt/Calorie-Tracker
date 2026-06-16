import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
import joblib
import os


def train_weight_predictor():
    dataset_path = "datasets/sample_data.csv"

    # Generate sample dataset if not exists
    if not os.path.exists(dataset_path):
        os.makedirs("datasets", exist_ok=True)
        from app.training.data_processor import generate_synthetic_data

        df = generate_synthetic_data()
        df.to_csv(dataset_path, index=False)
        print("Generated synthetic dataset for training.")
    else:
        df = pd.read_csv(dataset_path)

    # Feature engineering for weight forecasting
    # We want to predict weight change after N days.
    # We will format the records to have: current_weight, average_deficit_last_7d, days, and output weight_change
    features = []
    targets_7d = []
    targets_30d = []

    user_groups = df.groupby("user_id")

    for user_id, group in user_groups:
        group = group.sort_values("date")
        weights = group["weight"].values
        deficits = group["deficit"].values

        # Generate window samples
        for i in range(len(group) - 30):
            current_w = weights[i]
            avg_deficit = np.mean(deficits[max(0, i - 6) : i + 1])

            # Output weight change at 7 and 30 days
            delta_7 = weights[i + 7] - current_w
            delta_30 = weights[i + 30] - current_w

            features.append([current_w, avg_deficit])
            targets_7d.append(delta_7)
            targets_30d.append(delta_30)

    X = np.array(features)
    y_7d = np.array(targets_7d)
    y_30d = np.array(targets_30d)

    # Split and train
    X_train, X_test, y_train_7, y_test_7 = train_test_split(
        X, y_7d, test_size=0.2, random_state=42
    )
    _, _, y_train_30, y_test_30 = train_test_split(
        X, y_30d, test_size=0.2, random_state=42
    )

    model_7d = Ridge(alpha=1.0)
    model_7d.fit(X_train, y_train_7)

    model_30d = Ridge(alpha=1.0)
    model_30d.fit(X_train, y_train_30)

    # Evaluate
    pred_7 = model_7d.predict(X_test)
    pred_30 = model_30d.predict(X_test)

    print(
        f"7d Weight Predictor MAE: {mean_absolute_error(y_test_7, pred_7):.3f} kg"
    )
    print(
        f"30d Weight Predictor MAE: {mean_absolute_error(y_test_30, pred_30):.3f} kg"
    )

    # Save models
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(model_7d, "saved_models/weight_model_7d.joblib")
    joblib.dump(model_30d, "saved_models/weight_model_30d.joblib")
    print("Saved Ridge weight predictor models to saved_models/")


if __name__ == "__main__":
    train_weight_predictor()
