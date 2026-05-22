import google.generativeai as genai
from backend.core.config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def get_gemini_response(user_message: str, history: list = None) -> str:
    """
    Sends the user message and history to Gemini and returns the AI response.
    """
    if not settings.GEMINI_API_KEY:
        return "Gemini API key is missing. Please add it to your .env file."

    # Configure the model
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction="You are MindWell AI, a compassionate, empathetic, and professional mental wellness companion. Your goal is to listen, support, and guide the user through their emotional journey. Provide short, concise, and helpful responses. Do not provide medical diagnoses."
    )

    # Format history
    formatted_history = []
    if history:
        for msg in history:
            role = "model" if msg.get("role") == "ai" else "user"
            text = msg.get("text", "") or msg.get("message", "")
            formatted_history.append({"role": role, "parts": [text]})

    # Strip leading model messages as required by Gemini API
    while formatted_history and formatted_history[0]["role"] == "model":
        formatted_history.pop(0)

    try:
        chat_session = model.start_chat(history=formatted_history)
        result = chat_session.send_message(user_message)
        return result.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm having a little trouble connecting right now, but I'm here for you. Let's take a deep breath together. 💙"
