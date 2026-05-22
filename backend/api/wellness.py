from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.core.security import get_current_user
from backend.db.supabase import supabase
from backend.services.ai_sentiment import analyze_sentiment
from datetime import datetime

router = APIRouter()

class DailyFeedback(BaseModel):
    feedback_text: str
    day: int = 1

@router.get("/routine")
async def get_routine(user = Depends(get_current_user)):
    """
    Returns a dynamic 7-day routine based on the user's stress score.
    """
    try:
        # Get user's latest wellness score
        score_resp = supabase.table("wellness_scores").select("overall_score", "burnout_risk").eq("user_id", user.id).execute()
        
        # Determine stress level (lower overall score means higher stress in our mapping)
        needs_recovery = False
        if score_resp.data:
            score = score_resp.data[0].get("overall_score", 80)
            if score < 50:  # Stress > 50%
                needs_recovery = True

        if needs_recovery:
            # Intensive Recovery Plan
            plan = [
                {"id": "m1", "time": "Morning", "title": "Guided Meditation (10m)", "desc": "Start your day with deep breathing", "completed": False},
                {"id": "m2", "time": "Morning", "title": "Healthy Breakfast & Hydration", "desc": "Nourish your body for energy", "completed": False},
                {"id": "a1", "time": "Afternoon", "title": "4-7-8 Breathing Exercise", "desc": "Calm your nervous system", "completed": False},
                {"id": "a2", "time": "Afternoon", "title": "Digital Detox (30m)", "desc": "Step away from screens", "completed": False},
                {"id": "e1", "time": "Evening", "title": "Light Stretching / Walk", "desc": "Release physical tension", "completed": False},
                {"id": "n1", "time": "Night", "title": "Gratitude Journaling", "desc": "Write 3 positive things", "completed": False},
                {"id": "n2", "time": "Night", "title": "Sleep Meditation", "desc": "Listen to calming sounds", "completed": False}
            ]
        else:
            # Standard Maintenance Plan
            plan = [
                {"id": "m1", "time": "Morning", "title": "Set Daily Intentions", "desc": "Plan your day positively", "completed": False},
                {"id": "a1", "time": "Afternoon", "title": "Hydration Check", "desc": "Drink a glass of water", "completed": False},
                {"id": "e1", "time": "Evening", "title": "Wind Down", "desc": "Relaxing activity of choice", "completed": False}
            ]

        # Fetch completed tasks for today
        # Note: In a real app we'd filter by today's date, but for hackathon we'll just pull the user's progress
        progress_resp = supabase.table("wellness_progress").select("task_id", "completed").eq("user_id", user.id).execute()
        completed_tasks = {p["task_id"]: p["completed"] for p in progress_resp.data} if progress_resp.data else {}

        for task in plan:
            task["completed"] = completed_tasks.get(task["id"], False)

        return {"routine": plan, "is_recovery": needs_recovery}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/daily-feedback")
async def submit_daily_feedback(feedback: DailyFeedback, user = Depends(get_current_user)):
    """
    Analyzes end-of-day emotional feedback via DistilBERT, logs the mood, and checks the therapist threshold.
    """
    try:
        sentiment = analyze_sentiment(feedback.feedback_text)
        
        # 1. Update mood log
        today = datetime.utcnow().strftime('%Y-%m-%d')
        supabase.table("mood_logs").upsert({
            "user_id": user.id,
            "day": feedback.day,
            "note": feedback.feedback_text,
            "mood_score": sentiment.mood_score,
            "stress_score": sentiment.stress_score,
            "updated_at": datetime.utcnow().isoformat()
        }, on_conflict="user_id,day").execute()

        # 2. Update wellness score
        current_score_resp = supabase.table("wellness_scores").select("*").eq("user_id", user.id).execute()
        
        if current_score_resp.data:
            current_score = current_score_resp.data[0]
            new_overall = int((current_score.get('overall_score', 80) * 0.7) + (sentiment.mood_score * 0.3))
            burnout_risk = "High" if sentiment.stress_score > 70 else "Medium" if sentiment.stress_score > 40 else "Low"
            
            supabase.table("wellness_scores").update({
                "overall_score": new_overall,
                "burnout_risk": burnout_risk,
                "emotional_stability": sentiment.mood_score
            }).eq("user_id", user.id).execute()

        # 3. Check Therapist Threshold (Stress > 80%)
        therapist_recommended = sentiment.stress_score > 80

        if therapist_recommended:
            supabase.table("notifications").insert({
                "user_id": user.id,
                "title": "Therapist Support Unlocked",
                "message": "Your stress levels are high. We have unlocked priority access to our mental health professionals. Please consider booking a session.",
                "type": "alert"
            }).execute()

        return {
            "success": True,
            "sentiment": sentiment.sentiment_label,
            "therapist_unlocked": therapist_recommended
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
