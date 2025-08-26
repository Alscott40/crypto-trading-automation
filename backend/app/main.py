from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import exchanges

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
def ping():
    """A simple ping endpoint to check if the server is running."""
    return {"message": "pong"}

@app.get("/")
def read_root():
    return {"Hello": "World"}

app.include_router(exchanges.router, prefix="/api/exchanges", tags=["exchanges"])
