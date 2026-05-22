import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load the .env from the root of the project
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindWell AI Backend"
    SUPABASE_URL: str = os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("VITE_SUPABASE_ANON_KEY", "")
    GEMINI_API_KEY: str = os.getenv("VITE_GEMINI_API_KEY", "")
    
    # We will use the VITE_ prefixed env vars directly since this is a unified codebase
    # for a hackathon, but in production they should be separate.

settings = Settings()
