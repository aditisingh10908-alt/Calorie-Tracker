import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
import joblib
import os


def train_goal_predictor():
    dataset_path = "datasets/sample_data.csv"

    if not os.path.exists(dataset_path):
        os.makedirs("datasets", exist_ok=True)
        from app.training.data_processor import generate_synthetic_data

        df = generate_synthetic_data()
        df.to_csv(dataset_path, index=False)

    df = pd.read_csv(dataset_path)

    # For each user, did they reach their goal weight by the end of the logs?
    features = []
    targets = []

    user_groups = df.groupby("user_id")

    for user_id, group in user_groups:
        group = group.sort_values("date")
        start_w = group["weight"].values[0]
        final_w = group["weight"].values[-1]
        goal_w = group["goal_weight"].values[0]
        deficits = group["deficit"].values
        adherence = group["adherence"].values[0]

        # Calculate user indicators at day 15
        if len(group) >= 30:
            weight_15 = group["weight"].values[15]
            deficit_15 = np.mean(deficits[:15])
            weight_lost_15 = start_w - weight_15
            remaining_to_lose = weight_15 - goal_w

            # Reached goal by day 60?
            reached = 1 if final_w <= goal_w else 0

            features.append([weight_lost_15, deficit_15, remaining_to_lose, adherence])
            targets.append(reached)

    X = np.array(features)
    y = np.array(targets)

    # Handle tiny sample sizes for demonstration
    if len(X) < 10:
        print("Insufficient user groups to split. Training on all available data.")
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42
        )

    model = LogisticRegression()
    model.fit(X_train, y_train)

    if len(X_test) > 0:
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)[:, 1]
        print(f"Goal Predictor Model Accuracy: {accuracy_score(y_test, preds):.2f}")
        try:
            print(f"Goal Predictor Model AUC: {roc_auc_score(y_test, probs):.2f}")
        except Exception:
            pass

    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(model, "saved_models/goal_predictor_model.joblib")
    print("Saved LogisticRegression goal predictor model to saved_models/")


if __name__ == "__main__":
    train_goal_predictor()
