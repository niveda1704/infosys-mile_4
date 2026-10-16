"""SwipeX AI service (FastAPI). Run: uvicorn src.main:app --port 8000"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import db, embeddings
from src.routes import router

log = logging.getLogger("swipex.ai")


@asynccontextmanager
async def lifespan(app):
    try:
        db.init_db()
        embeddings.get_embedder().warmup()
        n = len(embeddings.get_index(force=True).jobs)
        log.info("AI service ready: %d jobs indexed", n)
    except Exception as exc:  # the service still starts; /health reports the problem
        log.error("AI startup incomplete: %s", exc)
    yield


app = FastAPI(title="SwipeX AI Service",
              description="Semantic job recommendations, swipe-deck ranking and ATS scoring on the shared Postgres.",
              version="2.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/")
@app.get("/health")
def health():
    ok = db.ping()
    e = embeddings.get_embedder()
    return {"status": "ok" if ok else "degraded", "service": "ai-service", "database": ok,
            "embedding": e.info()}
