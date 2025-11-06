import uvicorn  # For running the server
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated  # This is a standard Python library
from pydantic import BaseModel, StringConstraints # Use StringConstraintsfrom contextlib import asynccontextmanager
from contextlib import asynccontextmanager
# --- Import your "Golden Function" ---
# This is clean: your AI logic is separate from your API logic.
try:
    from simplifier_groq import get_friendly_caption
except ImportError:
    print("FATAL ERROR: simplifier_groq.py not found.")
    exit()

# --- Configuration ---
# A good habit is to define settings here, even if simple.
# For a hackathon, "*" is OK, but for production, this MUST change.
CORS_ALLOW_ORIGINS = ["*"]  # TODO: Change this after the hackathon

# --- App Lifespan (Good Practice) ---
# This logs a message on startup, confirming your AI function is ready.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load resources on startup
    print("--- 🚀 AI Backend is starting up... ---")
    print("✅ 'get_friendly_caption' function is loaded.")
    yield
    # Clean up resources on shutdown
    print("--- 🛑 AI Backend is shutting down... ---")

app = FastAPI(lifespan=lifespan)

# --- Security: CORS Middleware ---
# This is REQUIRED for your frontend to talk to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"], # Only allow what you need
    allow_headers=["*"],
)

# --- Data Models (Security & Validation) ---
# Pydantic models are your first line of defense.
# They validate incoming data, preventing many injection attacks.

# --- Data Models (Security & Validation) ---

class SimplifyRequest(BaseModel):
    """Data we EXPECT from the frontend."""
    
    # This is the new, correct syntax
    text: Annotated[str, StringConstraints(min_length=1)]
    language: Annotated[str, StringConstraints(min_length=2)]


class SimplifyResponse(BaseModel):
    """Data we GUARANTEE to send back."""
    raw_text: str
    simple_text: str
# --- API Endpoints ---

@app.get("/")
def read_root():
    """A simple 'health check' endpoint."""
    return {"status": "AI Backend is healthy and running!"}

@app.post("/simplify-text", response_model=SimplifyResponse)
async def simplify_text_endpoint(request: SimplifyRequest):
    """
    This is your main endpoint.
    It's 'async' so it doesn't block the server.
    """
    print(f"Received request for {request.language}: {request.text}")
    
    try:
        # --- This is the core logic ---
        # FastAPI is smart. It will run your 'sync' Groq call
        # in a separate thread pool automatically, so it doesn't
        # block the server.
        simple_text = get_friendly_caption(
            raw_text=request.text,
            target_language=request.language
        )
        
        # We successfully got a response.
        return SimplifyResponse(
            raw_text=request.text,
            simple_text=simple_text
        )
        
    except Exception as e:
        # --- Robust Error Handling ---
        # If your 'get_friendly_caption' function fails,
        # we catch it and send a proper error to the frontend.
        print(f"--- 🚨 UNEXPECTED ERROR ---")
        print(f"Error: {e}")
        # Don't send the user the internal error details.
        raise HTTPException(
            status_code=500,  # Internal Server Error
            detail="An error occurred while processing the text."
        )

# --- Run the App ---
if __name__ == "__main__":
    # This makes it runnable with `python main.py`
    print("--- Starting server on http://127.0.0.1:8000 ---")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)