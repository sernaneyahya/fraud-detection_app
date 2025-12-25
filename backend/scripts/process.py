import pandas as pd
import numpy as np
import os

# Configuration
RAW_FILE = "data/combined_raw.csv"
PROCESSED_DIR = "data"
os.makedirs(PROCESSED_DIR, exist_ok=True)

def get_haversine_distance(lat1, lon1, lat2, lon2):
    """Calcule la distance en km entre deux points GPS (Formule Haversine)"""
    R = 6371  # Rayon Terre (km)
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    c = 2*np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

def process_data():
    print("⏳ Chargement des données brutes...")
    df = pd.read_csv(RAW_FILE)

    # 1. Gestion des Dates (Format déjà propre: YYYY-MM-DD HH:MM:SS)
    print("📅 Transformation des dates...")
    df['trans_datetime'] = pd.to_datetime(df['trans_date_trans_time'])
    df['dob'] = pd.to_datetime(df['dob'])

    # Feature Engineering Temporel
    df['hour'] = df['trans_datetime'].dt.hour
    df['day_of_week'] = df['trans_datetime'].dt.dayofweek
    df['month'] = df['trans_datetime'].dt.month
    
    # Feature Engineering Age
    df['age'] = (df['trans_datetime'] - df['dob']).dt.days // 365

    # 2. Gestion Géospatiale (Distance)
    print("🌍 Calcul de la distance Client <-> Commerçant...")
    df['distance_km'] = get_haversine_distance(
        df['lat'], df['long'], 
        df['merch_lat'], df['merch_long']
    )

    # 3. Encodage
    print("🔢 Encodage des catégories et du genre...")
    df['gender_M'] = df['gender'].apply(lambda x: 1 if x == 'M' else 0)
    # On transforme les catégories (ex: 'grocery_pos') en chiffres (0, 1, 2...)
    df['category_code'] = df['category'].astype('category').cat.codes
    df['is_extreme_amount'] = df['amt'].apply(lambda x: 1 if x > 1300 else 0)

    # 4. Sélection finale (On garde uniquement ce qui sert au ML)
    features = [
        'amt','is_extreme_amount', 'zip', 'lat', 'long', 'city_pop', 
        'merch_lat', 'merch_long', 
        'hour', 'day_of_week', 'month', 'age', 
        'distance_km', 'gender_M', 'category_code',
        'is_fraud' 
    ]
    
    df_clean = df[features]

    # Sauvegarde
    output_path = os.path.join(PROCESSED_DIR, "fraud_dataset_cleaned.csv")
    df_clean.to_csv(output_path, index=False)
    print(f"✅ Transformations terminées. Dataset prêt pour le training : {output_path}")
    print(df_clean.head())

if __name__ == "__main__":
    process_data()