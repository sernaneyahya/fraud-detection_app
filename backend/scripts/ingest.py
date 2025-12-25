import pandas as pd
import kagglehub
import os

# Configuration des chemins
RAW_DIR = "data"
os.makedirs(RAW_DIR, exist_ok=True)

def download_and_combine():
    print("⬇️ 1. Téléchargement du dataset depuis Kaggle...")
    # Télécharge dans le cache local
    path = kagglehub.dataset_download("kartik2112/fraud-detection")
    print(f"   📂 Source trouvée : {path}")

    # Lecture
    print("📖 2. Lecture des fichiers train et test...")
    df_train = pd.read_csv(os.path.join(path, "fraudTrain.csv"))
    df_test = pd.read_csv(os.path.join(path, "fraudTest.csv"))
    
    df_train['source_origin'] = 'train'
    df_test['source_origin'] = 'test'

    # Fusion
    print("🔗 3. Fusion des datasets...")
    df_combined = pd.concat([df_train, df_test], axis=0).reset_index(drop=True)
    
    print(f"   📊 Dimensions totales : {df_combined.shape}")

    # Sauvegarde Raw
    output_path = os.path.join(RAW_DIR, "combined_raw.csv")
    df_combined.to_csv(output_path, index=False)
    print(f"✅ 4. Sauvegarde terminée dans : {output_path}")

if __name__ == "__main__":
    download_and_combine()