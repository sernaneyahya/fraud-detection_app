import pandas as pd
import joblib
import json
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, roc_auc_score, f1_score, confusion_matrix

# Configuration
INPUT_FILE = "data/fraud_dataset_cleaned.csv"
MODEL_DIR = "models"
METRICS_DIR = "metrics"
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)

def train():
    print("🚀 Chargement du dataset cleané...")
    df = pd.read_csv(INPUT_FILE)

    X = df.drop('is_fraud', axis=1)
    y = df['is_fraud']

    # Calcul du ratio pour XGBoost (Gestion du déséquilibre)
    # scale_pos_weight = nombre_negatifs / nombre_positifs
    count_fraud = y.sum()
    count_legit = len(y) - count_fraud
    ratio = count_legit / count_fraud
    print(f"Ratio de déséquilibre calculé : {ratio:.2f}")

    # Split Stratifié (Important pour garder la même proportion de fraude)
    print("Séparation Train / Test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Construction de l'architecture Stacking...")

    base_learners = [
        ('rf', RandomForestClassifier(
            n_estimators=200, 
            min_samples_leaf=2,
            class_weight='balanced',
            n_jobs=-1,
            random_state=42
        )),
        ('xgb', XGBClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            scale_pos_weight=ratio,
            eval_metric='logloss',
            random_state=42
        ))
    ]

    meta_model = LogisticRegression(random_state=42)

    model = StackingClassifier(
        estimators=base_learners,
        final_estimator=meta_model,
        cv=3, 
        n_jobs=-1
    )

    print("Entraînement du modèle Stacking...")
    model.fit(X_train, y_train)

    print("Vérification de la généralisation (Train vs Test)...")
    
    y_prob_train = model.predict_proba(X_train)[:, 1]
    y_prob_test = model.predict_proba(X_test)[:, 1]
    
    auc_train = roc_auc_score(y_train, y_prob_train)
    auc_test = roc_auc_score(y_test, y_prob_test)
    
    gap = auc_train - auc_test
    
    print("Évaluation des performances...")
    y_prob = model.predict_proba(X_test)[:, 1]
    
    custom_threshold = 0.4
    y_pred = (y_prob >= custom_threshold).astype(int)

    cm = confusion_matrix(y_test, y_pred)

    metrics = {
        "model_type": "Stacking (RF + XGBoost)",
        "threshold_used": custom_threshold,
        "auc_roc": roc_auc_score(y_test, y_prob),
        "f1_score": f1_score(y_test, y_pred),
        "confusion_matrix": cm.tolist(), 
        "report": classification_report(y_test, y_pred, output_dict=True)
    }

    print(f"   Score AUC (Entraînement) : {auc_train:.5f}")
    print(f"   Score AUC (Test)          : {auc_test:.5f}")
    print(f"   Écart (Gap)               : {gap:.5f}")

    if gap > 0.05:
        print("ATTENTION : Risque d'overfitting détecté (écart > 5%).")
    else:
        print("GÉNÉRALISATION : L'écart est faible, le modèle est robuste.")

    metrics["overfitting_check"] = {
        "auc_train": auc_train,
        "auc_test": auc_test,
        "gap": gap,
        "is_robust": bool(gap <= 0.05)
    }

    print("\n--- RÉSULTATS ---")
    print(f"Confusion Matrix:\n{cm}")
    print(f"ROC AUC: {metrics['auc_roc']:.4f}")
    print(f"F1 Score (Fraud): {metrics['report']['1']['f1-score']:.4f}")
    print(f"Recall (Fraud): {metrics['report']['1']['recall']:.4f}")
    print("-----------------")

    with open(os.path.join(METRICS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=4)
        
    joblib.dump(model, os.path.join(MODEL_DIR, "fraud_model.pkl"))
    print("Modèle Stacking sauvegardé !")

if __name__ == "__main__":
    train()