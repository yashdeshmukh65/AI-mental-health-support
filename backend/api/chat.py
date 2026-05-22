from fastapi import APIRouter, Depends, HTTPException
from backend.core.security import get_current_user
from backend.models.schemas import ChatMessageCreate, ChatMessageResponse
from backend.services.ai_chat import get_gemini_response
from backend.services.ai_sentiment import analyze_sentiment
from backend.db.supabase import supabase

router = APIRouter()

@router.post("/", response_model=ChatMessageResponse)
async def chat(chat_req: ChatMessageCreate, user = Depends(get_current_user)):
    try:
        # 1. Run DistilBERT Sentiment Analysis on User Message
        sentiment = analyze_sentiment(chat_req.message)
        
        # 2. Run Gemini Chatbot
        ai_reply = get_gemini_response(chat_req.message, chat_req.history)
        
        # 3. Save User Message
        supabase.table("chat_messages").insert({
            "user_id": user.id,
            "role": "user",
            "message": chat_req.message
        }).execute()
        
        # 4. Save AI Response
        supabase.table("chat_messages").insert({
            "user_id": user.id,
            "role": "ai",
            "message": ai_reply
        }).execute()
        
        # 5. Log sentiment score to sentiment_logs table
        supabase.table("sentiment_logs").insert({
            "user_id": user.id,
            "source": "chat",
            "sentiment_label": sentiment.sentiment_label,
            "confidence_score": sentiment.confidence_score
        }).execute()

        # 6. Check for CRITICAL state and trigger alerts
        if sentiment.sentiment_label == "CRITICAL":
            # Add anomaly alert
            supabase.table("anomaly_alerts").insert({
                "user_id": user.id,
                "alert_reason": "Emergency keywords detected in chat",
                "severity": "High",
                "is_resolved": False
            }).execute()

            # Add guardian notification
            supabase.table("notifications").insert({
                "user_id": user.id,
                "title": "🚨 URGENT: Emergency Alert",
                "message": "Critical distress detected. A notification has been generated for your registered guardian.",
                "type": "alert"
            }).execute()

        # 7. Dynamically recalculate and update wellness score
        try:
            current_score_resp = supabase.table("wellness_scores").select("*").eq("user_id", user.id).execute()
            
            # Default starting scores if not found
            current_overall = 80
            current_stability = 85
            if current_score_resp.data:
                current_overall = current_score_resp.data[0].get('overall_score', 80)
                current_stability = current_score_resp.data[0].get('emotional_stability', 85)
                
            # Smooth the score: 80% old score, 20% new chat message score
            new_overall = int((current_overall * 0.8) + (sentiment.mood_score * 0.2))
            new_stability = int((current_stability * 0.8) + (sentiment.mood_score * 0.2))
            burnout_risk = "High" if sentiment.stress_score > 70 else "Medium" if sentiment.stress_score > 40 else "Low"
            
            supabase.table("wellness_scores").upsert({
                "user_id": user.id,
                "overall_score": new_overall,
                "burnout_risk": burnout_risk,
                "emotional_stability": new_stability,
                "recovery_progress": 50 # Default fallback
            }, on_conflict="user_id").execute()
        except Exception as update_err:
            print(f"Warning: Failed to update wellness score dynamically: {update_err}")

        return ChatMessageResponse(
            ai_reply=ai_reply,
            sentiment=sentiment.sentiment_label,
            stress_score=sentiment.stress_score,
            mood_score=sentiment.mood_score
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
