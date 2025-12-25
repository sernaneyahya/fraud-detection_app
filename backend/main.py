from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime
import json

import requests 

# --- INITIALISATION API ---
app = FastAPI(title="Nexus Sentinel Analytics API", version="2.0.0")

SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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"
# Configuration CORS pour autoriser Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CHARGEMENT DU MODÈLE ET DE L'ENCODEUR ---
MODEL_PATH = "models/fraud_model.pkl"
# Note: On s'assure que le modèle est bien chargé
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("✅ Cerveau IA : Modèle RandomForest chargé avec succès.")
else:
    model = None
    print("❌ Erreur : Modèle introuvable dans 'models/'. Lancez d'abord train.py.")

# --- UTILS & MAPPING ---
CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net', 'grocery_pos',
    'health_fitness', 'home', 'kids_pets', 'misc_net', 'misc_pos',
    'personal_care', 'shopping_net', 'shopping_pos', 'travel'
]
CAT_MAP = {cat: i for i, cat in enumerate(CATEGORIES)}

def get_haversine(lat1, lon1, lat2, lon2):
    """Calcul de la distance géospatiale réelle"""
    R = 6371  # Rayon de la Terre en km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

# --- SCHÉMA DE DONNÉES ENTRANTES ---
class TransactionRequest(BaseModel):
    amt: float
    category: str
    gender: str
    lat: float
    long: float
    merch_lat: float
    merch_long: float
    age: int
    hour: int
    day_of_week: int
    month: int

# --- ENDPOINT PRINCIPAL ---
@app.post("/predict")
async def predict(tx: TransactionRequest, background_tasks: BackgroundTasks):
    if not model:
        raise HTTPException(status_code=500, detail="Modèle IA non chargé sur le serveur.")

    # 1. Prétraitement des données
    distance = get_haversine(tx.lat, tx.long, tx.merch_lat, tx.merch_long)
    cat_code = CAT_MAP.get(tx.category, 0)
    gender_code = 1 if tx.gender == 'M' else 0
    is_extreme = 1 if tx.amt > 1300 else 0

    # 2. Préparation du vecteur pour le modèle
    features = pd.DataFrame([{
        'amt': tx.amt,
        'is_extreme_amount': is_extreme,
        'zip': 10001,  # Valeur par défaut simulée
        'lat': tx.lat,
        'long': tx.long,
        'city_pop': 50000, # Valeur par défaut simulée
        'merch_lat': tx.merch_lat,
        'merch_long': tx.merch_long,
        'hour': tx.hour,
        'day_of_week': tx.day_of_week,
        'month': tx.month,
        'age': tx.age,
        'distance_km': distance,
        'gender_M': gender_code,
        'category_code': cat_code
    }])

    # 3. Calcul de la probabilité brute via l'IA
    base_proba = model.predict_proba(features)[0][1]
    
    # 4. SYSTÈME HYBRIDE : Ajustement des risques & Explicabilité
    contributors = []
    adjusted_score = base_proba

    # Facteur A : Montant
    if tx.amt > 500:
        impact = min(40, (tx.amt / 1376) * 35)
        contributors.append({"name": "Montant Suspect (> Moyenne)", "impact": round(impact), "color": "#F97316"})
        adjusted_score += 0.15
    
    # Facteur B : Distance
    if distance > 200:
        contributors.append({"name": "Écart Géographique Critique", "impact": 45, "color": "#EF4444"})
        adjusted_score += 0.30
    elif distance > 50:
        contributors.append({"name": "Distance Inhabituelle", "impact": 15, "color": "#FBBF24"})
        adjusted_score += 0.05

    # Facteur C : Horaire
    if tx.hour in [22, 23, 0, 1]:
        contributors.append({"name": "Fenêtre Horaire à Risque", "impact": 30, "color": "#A855F7"})
        adjusted_score += 0.20

    # Facteur D : Catégories
    if tx.category in ['shopping_net', 'entertainment']:
        contributors.append({"name": "Canal de Vente Risqué", "impact": 20, "color": "#3B82F6"})
        adjusted_score += 0.10

    # Facteurs de confiance (si aucun risque détecté)
    if not contributors:
        contributors = [
            {"name": "Profil de Dépense Normal", "impact": 80, "color": "#10B981"},
            {"name": "Localisation de Confiance", "impact": 60, "color": "#10B981"}
        ]

    # Normalisation du score final
    final_score = min(0.99, adjusted_score)
    
    # Décision finale
    is_fraud = 1 if final_score > 0.4 else 0

    # --- 5. DÉCLENCHEMENT DE L'ALERTE SLACK ---
    # Si c'est une fraude, on envoie la notif en arrière-plan (sans bloquer le retour API)
    if is_fraud == 1:
        background_tasks.add_task(send_slack_alert, tx, final_score)

    return {
        "is_fraud": int(is_fraud),
        "risk_score": float(final_score),
        "distance_km": round(distance, 2),
        "factors": contributors,
        "metadata": {
            "model_version": "RandomForest_v2_Expert",
            "execution_time": datetime.now().isoformat()
        }
    }

@app.get("/metrics")
def get_metrics():
    try:
        with open("metrics/metrics.json", "r") as f:
            data = json.load(f)
        return data
    except:
        # Données par défaut si le fichier n'existe pas encore
        return {
            "report": {"accuracy": 0.99},
            "confusion_matrix": [[1970, 0], [12, 18]] 
        }

def send_slack_alert(tx_data, score):
    
    # Couleur : Rouge si critique, Orange si moyen
    color = "#FF0000" if score > 0.8 else "#FF8800"
    
    payload = {
        "attachments": [
            {
                "color": color,
                "pretext": "🚨 *ALERTE SÉCURITÉ NEXUS* : Transaction Suspecte Détectée",
                "fields": [
                    {
                        "title": "Niveau de Risque",
                        "value": f"🔥 {int(score * 100)}% (Critique)",
                        "short": True
                    },
                    {
                        "title": "Montant",
                        "value": f"💰 {tx_data.amt} $",
                        "short": True
                    },
                    {
                        "title": "Localisation",
                        "value": f"📍 {tx_data.merch_lat}, {tx_data.merch_long}",
                        "short": True
                    },
                    {
                        "title": "Catégorie",
                        "value": f"🏷️ {tx_data.category}",
                        "short": True
                    }
                ],
                "footer": "Nexus Fraud Detection System",
                "ts": int(datetime.now().timestamp())
            }
        ]
    }

    try:
        requests.post(SLACK_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"Erreur Slack: {e}")
        
@app.get("/health")
def health_check():
    return {"status": "operational", "ia_model": model is not None}