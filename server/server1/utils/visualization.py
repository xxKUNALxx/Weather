import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

def plot_trend(df):
    if 'Year' in df.columns and 'Avg_Temperature_degC' in df.columns:
        yearly = df.groupby('Year')['Avg_Temperature_degC'].mean().reset_index()
        plt.figure(figsize=(10, 5))
        plt.plot(yearly['Year'], yearly['Avg_Temperature_degC'], marker='o')
        plt.title("Average Temperature Over Years")
        plt.xlabel("Year")
        plt.ylabel("Temperature (°C)")
        plt.tight_layout()
        plt.savefig("server/output/temp_trend.png")

def plot_clusters(df):
    if 'Cluster' in df.columns:
        plt.figure(figsize=(6, 4))
        sns.countplot(x='Cluster', data=df)
        plt.title("K-Means Cluster Distribution")
        plt.tight_layout()
        plt.savefig("server/output/cluster_distribution.png")

def plot_anomalies(df):
    if 'Anomaly' in df.columns:
        plt.figure(figsize=(8, 6))
        sns.scatterplot(
            x='Avg_Temperature_degC', 
            y='CO2_Emissions_tons_per_capita', 
            hue='Anomaly', 
            data=df, 
            palette={1: "blue", -1: "red"}
        )
        plt.title("Anomaly Detection (Red = Outliers)")
        plt.tight_layout()
        plt.savefig("server/output/anomaly_scatter.png")



