from typing import Optional

from pydantic import BaseModel, Field


# ============================================================
# INCIDENT STATUS UPDATE
# ============================================================

class IncidentStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        min_length=1
    )


# ============================================================
# AI EVENT INPUT
# ============================================================

class AIEventCreate(BaseModel):

    event_id: str = Field(
        ...,
        min_length=1
    )

    bus_id: str = Field(
        ...,
        min_length=1
    )

    # Example: pothole, garbage, accident, flooding
    event_type: str = Field(
        ...,
        min_length=1
    )

    # LOW / MEDIUM / HIGH / CRITICAL
    severity: str = Field(
        default="MEDIUM",
        min_length=1
    )

    latitude: float = Field(
        ...,
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180
    )

    # AI confidence: 0.0 - 1.0
    confidence: float = Field(
        ...,
        ge=0,
        le=1
    )

    # Optional image/video/evidence reference
    evidence_url: Optional[str] = None