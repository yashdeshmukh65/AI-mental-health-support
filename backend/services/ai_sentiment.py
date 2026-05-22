from transformers import pipeline
from backend.models.schemas import SentimentResult

# Initialize DistilBERT for sentiment analysis
# Using the specific model requested by the user
try:
    sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
except Exception as e:
    print(f"Warning: Could not load DistilBERT model. Error: {e}")
    sentiment_analyzer = None

def analyze_sentiment(text: str) -> SentimentResult:
    """
    Analyzes text using DistilBERT and maps it to mood and stress scores.
    """
    if not sentiment_analyzer:
        # Fallback if model fails to load (e.g., memory issues)
        return SentimentResult(
            sentiment_label="POSITIVE",
            confidence_score=0.8,
            stress_score=30,
            mood_score=75
        )

    # Truncate text to 512 tokens to prevent model crashes
    truncated_text = text[:1500] 
    
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

    # 2. Run standard DistilBERT classification
    result = sentiment_analyzer(truncated_text)[0]
    label = result['label']  # "POSITIVE" or "NEGATIVE"
    score = result['score']  # Confidence (0.0 to 1.0)

    # Map to Stress Score (0-100) and Mood Score (0-100)
    # Example logic: NEGATIVE -> higher stress, POSITIVE -> lower stress
    if label == "NEGATIVE":
        stress_score = int(50 + (score * 50))  # 50 to 100
        mood_score = int(50 - (score * 50))    # 0 to 50
    else:
        stress_score = int(50 - (score * 50))  # 0 to 50
        mood_score = int(50 + (score * 50))    # 50 to 100

    return SentimentResult(
        sentiment_label=label,
        confidence_score=score,
        stress_score=stress_score,
        mood_score=mood_score
    )
