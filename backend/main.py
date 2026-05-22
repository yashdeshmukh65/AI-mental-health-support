from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings

# Import routers
from backend.api import assessments, chat, analytics, wellness

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware to allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(assessments.router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(wellness.router, prefix="/api/wellness", tags=["Wellness"])

@app.get("/")
async def root():
    return {"message": "Welcome to the MindWell AI Backend!"}
