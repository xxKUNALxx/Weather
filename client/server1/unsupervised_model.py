# server/unsupervised_model.py
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
import joblib
import os

print("📦 Unsupervised Model Script Started")

# Load dataset
dataset_path = os.path.join("datasets", "climate_train.csv")
data = pd.read_csv(dataset_path)
data.dropna(inplace=True)

# Select numerical features
features = data.select_dtypes(include='number').drop(columns=['Year'], errors='ignore')

# Save cleaned data for analysis
features.to_csv("datasets/cleaned_unsupervised.csv", index=False)

# K-Means Clustering
print("🔍 Training K-Means...")
kmeans = KMeans(n_clusters=3, random_state=42)
data['Cluster'] = kmeans.fit_predict(features)

# Anomaly Detection
print("⚠️ Training Isolation Forest for anomaly detection...")
iso = IsolationForest(contamination=0.05)
data['Anomaly'] = iso.fit_predict(features)  # -1 for anomaly, 1 for normal

# Save models
joblib.dump(kmeans, "models/kmeans_model.pkl")
joblib.dump(iso, "models/isolation_model.pkl")

# Save clustered & flagged data
data.to_csv("datasets/clustered_analyzed_data.csv", index=False)

print("✅ Models trained & results saved.")





