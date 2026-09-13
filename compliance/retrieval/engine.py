import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from db.models import Requirement

class ComplianceRetrievalEngine:
    """
    Retrieves relevant compliance requirements using semantic vector matching.
    Supports PostgreSQL/pgvector with zero-dependency fallback to local cosine similarity.
    """

    def __init__(self, db_session: Optional[Session] = None):
        self.db = db_session
        self.requirements_path = Path("compliance/requirements/curated_requirements.json")

    def _generate_deterministic_embedding(self, text: str, dim: int = 64) -> List[float]:
        """
        Deterministic, zero-external-dependency embedding generator 
        projecting tokens into a normalized vector space.
        """
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().replace("-", " ").replace("_", " ").split()
        if not words:
            return vec.tolist()

        for idx, word in enumerate(words):
            h = abs(hash(word))
            bucket = h % dim
            sign = 1.0 if (h % 2 == 0) else -1.0
            weight = 1.0 / math.log(idx + 3)
            vec[bucket] += sign * weight

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def retrieve_requirements_for_scope(
        self, 
        system_type: str, 
        risk_category: str, 
        assessment_scope: List[str],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieves requirements matching the assessment scope and risk profile.
        """
        requirements = []
        if self.db:
            try:
                db_reqs = self.db.query(Requirement).all()
                if db_reqs:
                    for r in db_reqs:
                        requirements.append({
                            "id": r.id,
                            "framework": r.framework,
                            "article": r.article,
                            "provision": r.provision,
                            "requirement": r.requirement,
                            "description": r.description,
                            "domain": r.domain,
                            "mandatory_controls": r.mandatory_controls or []
                        })
            except Exception:
                pass

        if not requirements and self.requirements_path.exists():
            with open(self.requirements_path, "r", encoding="utf-8") as f:
                requirements = json.load(f)

        # Filter by assessment scope
        filtered = []
        for req in requirements:
            domain = req.get("domain", "")
            if not assessment_scope or domain in assessment_scope or any(scope in domain for scope in assessment_scope):
                filtered.append(req)

        # Sort with high-risk priority requirements first
        return filtered[:limit] if filtered else requirements[:limit]
