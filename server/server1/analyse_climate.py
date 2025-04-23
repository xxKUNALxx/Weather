import sys
import os
import pandas as pd
import joblib
from fpdf import FPDF
from prophet import Prophet
from utils.preprocess import preprocess_data
from utils.visualization import plot_trend, plot_clusters, plot_anomalies

# Load models
kmeans = joblib.load("models/kmeans_model.pkl")
iso = joblib.load("models/isolation_model.pkl")

# Load dataset
# file_path = sys.argv[1]
df = pd.read_csv("datasets/climate_train.csv")

# Define a list of columns that are generally needed for the analysis
required_columns = {
    'Year', 'Country', 'Avg_Temperature_degC', 'CO2_Emissions_tons_per_capita',
    'Sea_Level_Rise_mm', 'Rainfall_mm', 'Population',
    'Renewable_Energy_pct', 'Extreme_Weather_Events', 'Forest_Area_pct'
}

# Dynamically check if required columns are present and raise a warning if any are missing
missing_columns = required_columns - set(df.columns)
if missing_columns:
    print(f"⚠️ Missing columns: {missing_columns}. The analysis will proceed with available columns.")

# Drop non-numeric and unnecessary columns for model input
# Avoid errors when required columns are missing and select only numeric columns
features = df.select_dtypes(include='number').drop(columns=['Year'], errors='ignore')

# Handle cases where there might be missing or extra columns
df['Cluster'] = kmeans.predict(features)
df['Anomaly'] = iso.predict(features)  # -1 = anomaly, 1 = normal

# Create output directory
os.makedirs("server/output", exist_ok=True)

# Generate visualizations
plot_clusters(df)
plot_anomalies(df)
plot_trend(df)

# Forecasting using Prophet
forecast_df = None
if 'Avg_Temperature_degC' in df.columns and 'Year' in df.columns:
    temp_df = df[['Year', 'Avg_Temperature_degC']].dropna()
    temp_df = temp_df.rename(columns={'Year': 'ds', 'Avg_Temperature_degC': 'y'})
    temp_df['ds'] = pd.to_datetime(temp_df['ds'].astype(str))

    model = Prophet()
    model.fit(temp_df)

    future = model.make_future_dataframe(periods=30, freq='Y')
    forecast = model.predict(future)

    forecast_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    forecast_df.to_csv("server/output/temperature_forecast.csv", index=False)

    model.plot(forecast).savefig("server/output/temperature_forecast_plot.png")

# Generate PDF report
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, "Climate Analysis Report", ln=1)
pdf.cell(200, 10, "Clustering, Anomaly Detection, and Trend Forecasting", ln=1)
pdf.ln(5)

pdf.multi_cell(200, 10, "Conclusion:\nThis report provides an analysis of climate data, including K-Means clustering to group similar regions, anomaly detection to identify unusual patterns, and trend forecasting for temperature over time.")
pdf.ln(5)

pdf.multi_cell(200, 10, f"Cluster Summary:\n{df['Cluster'].value_counts().to_string()}")
pdf.ln(5)

pdf.multi_cell(200, 10, f"Anomaly Summary:\n{df['Anomaly'].value_counts().to_string()}")
pdf.ln(5)

if forecast_df is not None:
    forecast_summary = forecast_df.head().to_string(index=False)
    pdf.multi_cell(200, 10, f"Temperature Forecast (First 5 rows):\n{forecast_summary}")
    pdf.ln(5)

# Insert plots
pdf.image("server/output/cluster_distribution.png", x=10, y=pdf.get_y(), w=180)
pdf.ln(70)
pdf.image("server/output/anomaly_scatter.png", x=10, y=pdf.get_y(), w=180)
pdf.ln(70)
pdf.image("server/output/temp_trend.png", x=10, y=pdf.get_y(), w=180)
pdf.ln(70)
if forecast_df is not None:
    pdf.image("server/output/temperature_forecast_plot.png", x=10, y=pdf.get_y(), w=180)

pdf.output("server/output/climate_analysis_report.pdf")
print("✅ Report generated and saved successfully.")

