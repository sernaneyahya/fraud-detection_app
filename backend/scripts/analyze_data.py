import pandas as pd
import os

# --- CONFIG ---
DATA_PATH = "data/fraud_dataset_cleaned.csv"
METRICS_DIR = "metrics"
OUTPUT_FILE = os.path.join(METRICS_DIR, "fraud_patterns.txt")

os.makedirs(METRICS_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("🔍 ANALYSE DES PATTERNS DE FRAUDE\n\n")

    f.write("MONTANTS :\n")
    f.write(f"Moyenne transaction NORMALE : {df[df['is_fraud'] == 0]['amt'].mean():.2f} $\n")
    f.write(f"Moyenne transaction FRAUDE   : {df[df['is_fraud'] == 1]['amt'].mean():.2f} $\n")
    f.write(f"Montant MAX FRAUDE           : {df[df['is_fraud'] == 1]['amt'].max():.2f} $\n\n")

    f.write("HORAIRES :\n")
    fraud_hours = (
        df[df['is_fraud'] == 1]['hour']
        .value_counts()
        .sort_index()
        .nlargest(3)
    )
    f.write("Top 3 des heures de fraude :\n")
    for hour, count in fraud_hours.items():
        f.write(f" - Heure {hour} : {count} fraudes\n")
    f.write("\n")

    f.write("DISTANCE :\n")
    f.write(f"Distance moyenne NORMALE : {df[df['is_fraud'] == 0]['distance_km'].mean():.2f} km\n")
    f.write(f"Distance moyenne FRAUDE   : {df[df['is_fraud'] == 1]['distance_km'].mean():.2f} km\n\n")

    f.write("CORRÉLATION AVEC IS_FRAUD :\n")
    correlations = df.corr(numeric_only=True)['is_fraud'].sort_values(ascending=False)
    for feature, corr in correlations.items():
        f.write(f"{feature:<25} : {corr:.4f}\n")

print(f"Analyse sauvegardée dans : {OUTPUT_FILE}")
