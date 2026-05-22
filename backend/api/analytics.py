from fastapi import APIRouter, Depends, HTTPException
from backend.core.security import get_current_user
from backend.services.ai_anomaly import detect_anomalies
from backend.db.supabase import supabase

router = APIRouter()

@router.get("/anomalies")
async def run_anomaly_detection(user = Depends(get_current_user)):
    try:
        # 1. Fetch recent mood logs
        logs = supabase.table("mood_logs").select("id, mood_score, stress_score").eq("user_id", user.id).limit(30).execute()
        user_data = logs.data

        # 2. Run Isolation Forest
        anomalies = detect_anomalies(user_data)

        # 3. Save alerts to DB
        saved_alerts = []
        for anomaly in anomalies:
            res = supabase.table("anomaly_alerts").insert({
                "user_id": user.id,
                "alert_reason": anomaly["alert_reason"],
                "severity": anomaly["burnout_risk"]
            }).execute()
            saved_alerts.append(res.data[0])

        return {"status": "success", "anomalies_detected": len(anomalies), "alerts": saved_alerts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
