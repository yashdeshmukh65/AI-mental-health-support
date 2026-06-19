from backend.models.schemas import SentimentResult
from textblob import TextBlob

def analyze_sentiment(text: str) -> SentimentResult:
    """
    Analyzes text using TextBlob and maps it to mood and stress scores.
    Extremely lightweight, prevents Render OOM crashes.
    """
    # 1. Check for Emergency Keywords First (Heuristic)
    emergency_keywords = ["suicide", "kill myself", "want to die", "end it all", "hurt myself", "cutting myself", "no reason to live"]
    text_lower = text.lower()
    
    if any(keyword in text_lower for keyword in emergency_keywords):
        return SentimentResult(
            sentiment_label="CRITICAL",
            confidence_score=0.99,
            stress_score=100,
            mood_score=0
        )

    # 2. Run standard TextBlob classification
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity # -1.0 to 1.0
    
    # Map to Stress Score (0-100) and Mood Score (0-100)
    if polarity < 0:
        label = "NEGATIVE"
        score = abs(polarity) # 0 to 1.0
        stress_score = int(50 + (score * 50))  # 50 to 100
        mood_score = int(50 - (score * 50))    # 0 to 50
    else:
        label = "POSITIVE"
        score = polarity
        stress_score = int(50 - (score * 50))  # 0 to 50
        mood_score = int(50 + (score * 50))    # 50 to 100

    return SentimentResult(
        sentiment_label=label,
        confidence_score=score if score != 0 else 0.5,
        stress_score=stress_score,
        mood_score=mood_score
    )
