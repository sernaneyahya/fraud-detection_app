# 🛡️ Nexus Analytics : Real-Time Fraud Detection System

**Nexus Analytics** est une plateforme Full-Stack de détection de fraude bancaire alliant l'Intelligence Artificielle de pointe (Stacking d'ensemble) et un moteur de règles expertes. Le système traite les transactions en temps réel, visualise les risques sur une interface géospatiale et alerte les équipes de sécurité via Slack.

---

## 🚀 Fonctionnalités Clés

* **Intelligence Hybride :** Architecture de **Stacking** combinant Random Forest et XGBoost pour une précision maximale (AUC-ROC : 0.998).
* **Analyse Temps Réel :** Pipeline d'ingestion simulant un flux de transactions bancaires avec prédiction instantanée (< 100ms).
* **Dashboard Interactif :** Visualisation cartographique avec Leaflet, Drag & Drop, et graphiques de risque dynamiques.
* **Explicabilité (XAI) :** Décomposition des facteurs de risque pour chaque transaction (montant, distance, horaire, catégorie).
* **Alerting Professionnel :** Notifications automatisées et riches envoyées vers un canal Slack dédié en cas de fraude critique.

---

## 🛠️ Stack Technique



* **Frontend :** Next.js 14, Tailwind CSS, Lucide Icons, Recharts, Leaflet.
* **Backend :** FastAPI (Python), BackgroundTasks pour l'asynchronisme.
* **Data Science :** Scikit-Learn, XGBoost, Pandas, Joblib.
* **DevOps :** GitHub (Versionning), Slack Webhooks API.

---

## 🧠 Architecture du Modèle & Performance

### Le Stacking d'Ensemble
Pour maximiser le **Recall** (détection des fraudes réelles), nous utilisons une approche multi-couches :
1.  **Niveau 1 (Base Learners) :** Random Forest (Stabilité) + XGBoost (Patterns complexes).
2.  **Niveau 2 (Meta-Learner) :** Régression Logistique (Arbitrage final).



### Métriques de Performance
| Métrique | Valeur |
| :--- | :--- |
| **AUC-ROC** | **0.9987** |
| **Recall (Fraude)** | **84.8%** |
| **F1-Score** | **0.879** |
| **Gap Train/Test** | **0.0012** (Généralisation optimale) |

---

## 🧪 Feature Engineering

L'intelligence du système repose sur la création de variables stratégiques :
* **Distance de Haversine :** Calcul de la distance réelle entre le client et le marchand.
* **Circular Time Encoding :** Transformation des heures en fonctions Sinus/Cosinus pour capturer la cyclicité nocturne.
* **is_extreme_amount :** Flag binaire basé sur l'analyse statistique des montants frauduleux.

---

## 👥 L'Équipe (Nexus Team)

Ce projet a été réalisé en collaboration par :
* **Yahya Sernane** : Data Engineering, Feature Engineering & Modélisation IA.
* **Youssef Ketaj** : Architecture Backend, Logique Métier & Système d'Alerting.
* **Amine Rizki** : UI/UX Design, Développement Frontend & Visualisation Temps Réel.

---

## 🏁 Installation & Lancement

### 1. Backend (FastAPI)
```bash
cd backend
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate # ou venv\Scripts\activate sur Windows
# Installer les dépendances
pip install -r requirements.txt
# Lancer le serveur
uvicorn main:app --reload

2. Frontend (Next.js)
Bash

cd frontend
npm install
npm run dev
L'application sera disponible sur http://localhost:3000.
