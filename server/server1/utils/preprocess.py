import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

def preprocess_data(df):
    # Select numerical features dynamically (exclude 'Year' or other irrelevant columns)
    features = df.select_dtypes(include='number')

    # Handle missing values (impute with mean)
    imputer = SimpleImputer(strategy='mean')
    
    # Scale the features
    scaler = StandardScaler()

    # Impute and scale the features
    X_clean = scaler.fit_transform(imputer.fit_transform(features))
    
    # Return preprocessed features for further tasks
    return pd.DataFrame(X_clean, columns=features.columns)


