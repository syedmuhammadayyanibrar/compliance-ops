import os
import json
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from db.models import Base, Requirement, AISystem, IntegrationSetting

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///complianceops.db")
SQLITE_FALLBACK_PATH = os.getenv("SQLITE_FALLBACK_PATH", "complianceops.db")

def get_engine():
    # Attempt to connect to configured DATABASE_URL (e.g. Postgres)
    if DATABASE_URL.startswith("postgresql"):
        try:
            pg_engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with pg_engine.connect() as conn:
                # Try creating pgvector extension if postgres
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                except Exception:
                    pass
            return pg_engine
        except Exception as e:
            print(f"[DB] PostgreSQL connection failed ({e}). Falling back to SQLite: {SQLITE_FALLBACK_PATH}")
    
    # SQLite fallback
    sqlite_url = f"sqlite:///{SQLITE_FALLBACK_PATH}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    seed_initial_data()

def seed_initial_data():
    db = SessionLocal()
    try:
        # Seed AI System
        cs_ai = db.query(AISystem).filter(AISystem.id == "customer-support-ai").first()
        if not cs_ai:
            cs_ai = AISystem(
                id="customer-support-ai",
                name="Customer Support Assistant AI",
                system_type="generative_ai",
                risk_category="high",
                description="Enterprise generative AI agent assisting customer dispute resolutions and automated ticket routing.",
                repository_url="https://github.com/nexus-tech/customer-support-ai"
            )
            db.add(cs_ai)
            db.commit()

        # Seed Curated Requirements
        req_file = Path("compliance/requirements/curated_requirements.json")
        if req_file.exists():
            with open(req_file, "r", encoding="utf-8") as f:
                requirements_data = json.load(f)
            
            for r in requirements_data:
                existing = db.query(Requirement).filter(Requirement.id == r["id"]).first()
                if not existing:
                    req_obj = Requirement(
                        id=r["id"],
                        framework=r.get("framework", "EU AI Act"),
                        article=r.get("article", ""),
                        provision=r.get("provision", ""),
                        requirement=r.get("requirement", ""),
                        description=r.get("description", ""),
                        jurisdiction=r.get("jurisdiction", "European Union"),
                        effective_date=r.get("effective_date", "2026-08-02"),
                        source_url=r.get("source_url", ""),
                        domain=r.get("domain", "governance"),
                        mandatory_controls=r.get("mandatory_controls", [])
                    )
                    db.add(req_obj)
            db.commit()

        # Seed default Integrations
        default_integrations = [
            {"id": "github", "name": "GitHub Repository Gateway", "provider_type": "mcp", "is_connected": True, "status": "operational"},
            {"id": "google_drive", "name": "Google Drive Governance Archive", "provider_type": "mcp", "is_connected": True, "status": "operational"},
            {"id": "slack", "name": "Slack HITL Notification Bot", "provider_type": "rest", "is_connected": True, "status": "operational"},
            {"id": "linear", "name": "Linear Issue Tracker", "provider_type": "rest", "is_connected": True, "status": "operational"},
        ]
        for itg in default_integrations:
            existing = db.query(IntegrationSetting).filter(IntegrationSetting.id == itg["id"]).first()
            if not existing:
                db.add(IntegrationSetting(
                    id=itg["id"],
                    name=itg["name"],
                    provider_type=itg["provider_type"],
                    is_connected=itg["is_connected"],
                    status=itg["status"],
                    config={"mock_fallback": True}
                ))
        db.commit()
    finally:
        db.close()
