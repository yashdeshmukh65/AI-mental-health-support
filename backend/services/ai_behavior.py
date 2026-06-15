import json
import google.generativeai as genai
from backend.core.config import settings
from typing import Dict, Any

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def analyze_game_behavior(game_type: str, telemetry: Dict[str, Any]) -> Dict[str, int]:
    """
    Sends game telemetry to Gemini to deduce stress and mood scores.
    Returns a dict with 'stress_score' (0-100) and 'mood_score' (0-100).
    """
    if not settings.GEMINI_API_KEY:
        # Fallback if no API key
        return {"stress_score": 50, "mood_score": 50}

    # Configure the model to return JSON
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"}
    )

    prompt = f"""
    You are a behavioral analyst AI for a mental wellness app.
    The user just completed a therapeutic mini-game. Based on their telemetry data, estimate their current cognitive load, frustration, and overall mood.

    Game Type: {game_type}
    Telemetry Data: {json.dumps(telemetry)}

    Rules:
    - High mistakes, long durations, or early quits generally indicate higher stress and lower mood.
    - Fast, accurate completions indicate lower stress and positive mood.
    - Breathing and focus games generally lower stress and improve mood if completed successfully.
    
    Return a JSON object strictly following this format:
    {{
        "stress_score": <int between 0 and 100>,
        "mood_score": <int between 0 and 100>
    }}
    """

    try:
        result = model.generate_content(prompt)
        response_json = json.loads(result.text)
        
        # Ensure bounds
        stress = max(0, min(100, response_json.get("stress_score", 50)))
        mood = max(0, min(100, response_json.get("mood_score", 50)))
        
        return {"stress_score": stress, "mood_score": mood}
    except Exception as e:
        print(f"Game AI Behavior Error: {e}")
        return {"stress_score": 50, "mood_score": 50}
