import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

def detect_anomalies(user_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Runs Isolation Forest on user's mood and stress logs.
    user_data expects a list of dicts: [{'mood_score': int, 'stress_score': int, 'id': str}]
    """
    if not user_data or len(user_data) < 5:
        # Not enough data to reliably run Isolation Forest
        return []

    # Convert to pandas DataFrame
    df = pd.DataFrame(user_data)
    
    # We'll use mood_score and stress_score to find anomalies
    features = df[['mood_score', 'stress_score']].fillna(50)

    # Initialize Isolation Forest
    # contamination=0.1 means we expect roughly 10% of data points to be anomalies
    model = IsolationForest(contamination=0.1, random_state=42)
    
    # Fit and predict (-1 for anomalies, 1 for normal)
    df['anomaly_label'] = model.fit_predict(features)
    
    # Calculate anomaly score (lower means more abnormal)
    df['anomaly_score'] = model.decision_function(features)

    # Filter out only the anomalies
    anomalies = df[df['anomaly_label'] == -1]

    results = []
    for _, row in anomalies.iterrows():
        # Determine burnout risk and reason
        stress = row['stress_score']
        mood = row['mood_score']
        
        if stress > 80 and mood < 30:
            burnout_risk = "High"
            reason = "Critical stress levels combined with very low mood."
        elif stress > 70:
            burnout_risk = "Medium"
            reason = "Elevated stress detected."
        elif mood < 30:
            burnout_risk = "Medium"
            reason = "Unusually low mood detected."
        else:
            burnout_risk = "Low"
            reason = "Unexpected emotional pattern detected."

        results.append({
            "source_id": row.get('id'),
            "burnout_risk": burnout_risk,
            "anomaly_detected": True,
            "anomaly_score": float(row['anomaly_score']),
            "alert_reason": reason
        })

    return results
