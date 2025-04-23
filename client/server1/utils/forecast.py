from prophet import Prophet
import pandas as pd

def forecast_temperature(df):
    if 'Year' in df.columns and 'Avg_Temperature_degC' in df.columns:
        # Group by Year and calculate the average temperature
        yearly = df.groupby('Year')['Avg_Temperature_degC'].mean().reset_index()
        yearly['ds'] = pd.to_datetime(yearly['Year'].astype(str))
        yearly.rename(columns={'Avg_Temperature_degC': 'y'}, inplace=True)

        model = Prophet()
        model.fit(yearly[['ds', 'y']])

        # Create future data for forecasting
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)

        return forecast[['ds', 'yhat']]  
    return None

