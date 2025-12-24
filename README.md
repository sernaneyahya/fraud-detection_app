🛡️ Nexus Analytics : Real-Time Fraud Detection System
Nexus Analytics est une plateforme Full-Stack de détection de fraude bancaire alliant l'Intelligence Artificielle de pointe (Stacking d'ensemble) et un moteur de règles expertes. Le système traite les transactions en temps réel, visualise les risques sur une interface géospatiale et alerte les équipes de sécurité via Slack.

🚀 Fonctionnalités Clés
Intelligence Hybride : Architecture de Stacking combinant Random Forest et XGBoost pour une précision maximale (AUC-ROC : 0.998).

Analyse Temps Réel : Pipeline d'ingestion simulant un flux de transactions bancaires avec prédiction instantanée (< 100ms).

Dashboard Interactif : Visualisation cartographique avec Leaflet, Drag & Drop, et graphiques de risque dynamiques.

Explicabilité (XAI) : Décomposition des facteurs de risque pour chaque transaction (montant, distance, horaire, catégorie).

Alerting Professionnel : Notifications automatisées et riches envoyées vers un canal Slack dédié en cas de fraude critique.

🛠️ Stack Technique
Frontend : Next.js 14, Tailwind CSS, Lucide Icons, Recharts, Leaflet.

Backend : FastAPI (Python), BackgroundTasks pour l'asynchronisme.

Data Science : Scikit-Learn, XGBoost, Pandas, Joblib.

DevOps : GitHub (Versionning), Slack Webhooks.

📊 Performance du Modèle
Le modèle a été optimisé pour le Recall afin de minimiser les faux négatifs (fraudes non détectées).

Recall (Fraude) : 84.8%

Précision (Fraude) : 91.3%

AUC-ROC : 0.9987

Gap Train/Test : 0.0012 (Généralisation optimale, pas d'overfitting).

📂 Structure du Projet
Bash

├── backend/
│   ├── data/           # Dataset nettoyé
│   ├── models/         # Modèle Stacking (.pkl)
│   ├── metrics/        # Rapports de performance (JSON)
│   ├── scripts/        # Script d'entraînement (train_model.py)
│   └── main.py         # Serveur FastAPI
├── frontend/
│   ├── app/            # Pages et layout Next.js
│   ├── components/     # Composants React (Map, Charts, UI)
│   └── tailwind.config.js
👥 L'Équipe (Nexus Team)
Ce projet a été réalisé en collaboration par :

Yahya Sernane : Data Engineering, Feature Engineering & Modélisation IA.

Youssef Ketaj : Architecture Backend, Logique Métier & Système d'Alerting.

Amine Rizki : UI/UX Design, Développement Frontend & Visualisation Temps Réel.

🏁 Installation Rapide
Backend :

Bash

cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Frontend :

Bash

cd frontend
npm install
npm run dev
