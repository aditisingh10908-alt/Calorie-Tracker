import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import predictions, health

app = FastAPI(
    title="CalorieTracker Pro ML Service",
    description="Machine Learning service providing weight prediction, goal probability analysis, and personalized nutritional recommendations.",
    version="1.0.0",
)

# Enable CORS for local cross-service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(predictions.router, tags=["Predictions"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to the CalorieTracker Pro Machine Learning API",
        "docs_url": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
