from fastapi import APIRouter, Depends, HTTPException
from backend.core.security import get_current_user
from backend.models.schemas import AssessmentCreate, SentimentResult
from backend.services.ai_sentiment import analyze_sentiment
from backend.db.supabase import supabase
import json

router = APIRouter()

@router.post("/", response_model=SentimentResult)
async def submit_assessment(assessment: AssessmentCreate, user = Depends(get_current_user)):
    try:
        # 1. Combine answers into a single text for DistilBERT
        combined_text = " ".join([str(v) for v in assessment.answers.values()])
        
        # 2. Run Sentiment Analysis (DistilBERT)
        sentiment_result = analyze_sentiment(combined_text)
        
        # 3. Save to Supabase (assessments table)
        # Using the existing JSONB structure from previous iteration for answers
        # but injecting the new sentiment fields.
        supabase.table("assessments").insert({
            "user_id": user.id,
            "category": assessment.category,
            "answers": assessment.answers,
            "sentiment": sentiment_result.sentiment_label,
            "stress_score": sentiment_result.stress_score,
            "mood_score": sentiment_result.mood_score
        }).execute()
        
        # 4. Save to moods table
        supabase.table("mood_logs").insert({
            "user_id": user.id,
            "day": 1,
            "note": "Initial Assessment",
            "mood_score": sentiment_result.mood_score,
            "stress_score": sentiment_result.stress_score
        }).execute()
        
        # 5. Initialize wellness score
        supabase.table("wellness_scores").upsert({
            "user_id": user.id,
            "overall_score": sentiment_result.mood_score,
            "burnout_risk": "Low" if sentiment_result.stress_score < 50 else "High",
            "emotional_stability": sentiment_result.mood_score
        }, on_conflict="user_id").execute()

        # 6. Initialize streak
        supabase.table("streaks").upsert({
            "user_id": user.id,
            "current_streak": 1,
            "total_xp": 50
        }, on_conflict="user_id").execute()

        return sentiment_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
