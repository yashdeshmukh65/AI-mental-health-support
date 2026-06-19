from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AssessmentCreate(BaseModel):
    category: str  # "minor" or "adult"
    answers: Dict[str, Any]  # The 5 questions mapped as a dictionary

class ChatMessageCreate(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []
    language: Optional[str] = "en"

class ChatMessageResponse(BaseModel):
    ai_reply: str
    sentiment: str
    stress_score: int
    mood_score: int

class TaskProgressUpdate(BaseModel):
    task_id: str
    completed: bool

class WellnessScoreResponse(BaseModel):
    overall_score: int
    burnout_risk: str
    emotional_stability: int
    recovery_progress: int

class MoodLogCreate(BaseModel):
    day: int
    note: str

class SentimentResult(BaseModel):
    sentiment_label: str
    confidence_score: float
    stress_score: int
    mood_score: int
