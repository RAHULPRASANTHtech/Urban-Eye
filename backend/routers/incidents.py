from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import Incident, IncidentStatusHistory
from routers.websocket import manager
from schemas import IncidentStatusUpdate


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


# ============================================================
# INCIDENT SERIALIZER
# ============================================================

def serialize_incident(incident: Incident):
    """
    Serialize an incident into the format currently expected
    by the frontend incident list/dashboard.
    """

    return {
        "id": f"INC-{incident.id:03d}",

        "incident_id": incident.id,

        "type": incident.event_type,

        "severity": incident.severity,

        # Frontend display percentage
        "verification_score": round(
            incident.verification_score * 100,
            1
        ),

        "confirmed_buses": incident.unique_bus_count,

        "status": incident.status,

        "latitude": incident.latitude,

        "longitude": incident.longitude,

        "timestamp": incident.created_at,

        "source_bus": (
            incident.confirmations[0].bus_id
            if incident.confirmations
            else "UNKNOWN"
        ),

        "frames_validated": incident.confirmation_count,

        # Retained for existing frontend compatibility
        "validation_total": 4,

        "description": (
            f"{incident.event_type.replace('_', ' ').title()} "
            f"detected through multi-bus AI verification."
        )
    }


# ============================================================
# GET ALL INCIDENTS
# ============================================================

@router.get("")
def get_incidents(
    db: Session = Depends(get_db)
):

    incidents = (
        db.query(Incident)
        .order_by(Incident.id.desc())
        .all()
    )

    return [
        serialize_incident(incident)
        for incident in incidents
    ]


# ============================================================
# GET SINGLE INCIDENT
# ============================================================

@router.get("/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return {
        "id": incident.id,

        "event_type": incident.event_type,

        "severity": incident.severity,

        "latitude": incident.latitude,

        "longitude": incident.longitude,

        "status": incident.status,

        "confirmation_count": incident.confirmation_count,

        "unique_bus_count": incident.unique_bus_count,

        "average_confidence": round(
            incident.average_confidence,
            4
        ),

        "verification_score": round(
            incident.verification_score,
            4
        ),

        "created_at": incident.created_at,

        "updated_at": incident.updated_at
    }


# ============================================================
# UPDATE INCIDENT STATUS
# ============================================================

@router.patch("/{incident_id}/status")
async def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    db: Session = Depends(get_db)
):

    try:

        # ----------------------------------------------------
        # 1. FIND INCIDENT
        # ----------------------------------------------------

        incident = (
            db.query(Incident)
            .filter(Incident.id == incident_id)
            .first()
        )

        if not incident:
            raise HTTPException(
                status_code=404,
                detail="Incident not found"
            )


        # ----------------------------------------------------
        # 2. ALLOWED STATUSES
        # ----------------------------------------------------

        allowed_statuses = {
            "NEW",
            "UNDER_REVIEW",
            "CONFIRMED",
            "IN_PROGRESS",
            "RESOLVED"
        }

        new_status = status_update.status.strip().upper()


        if new_status not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid incident status",
                    "allowed_statuses": sorted(
                        allowed_statuses
                    )
                }
            )


        # ----------------------------------------------------
        # 3. CHECK IF STATUS IS UNCHANGED
        # ----------------------------------------------------

        old_status = incident.status

        if old_status == new_status:

            return {
                "message": "Incident already has this status",

                "incident_id": incident.id,

                "status": incident.status
            }


        # ----------------------------------------------------
        # 4. UPDATE INCIDENT
        # ----------------------------------------------------

        incident.status = new_status


        # ----------------------------------------------------
        # 5. CREATE STATUS HISTORY RECORD
        # ----------------------------------------------------

        history = IncidentStatusHistory(
            incident_id=incident.id,
            old_status=old_status,
            new_status=new_status
        )

        db.add(history)


        # ----------------------------------------------------
        # 6. COMMIT TRANSACTION
        # ----------------------------------------------------

        db.commit()

        db.refresh(incident)


        # ----------------------------------------------------
        # 7. WEBSOCKET BROADCAST
        # ----------------------------------------------------

        await manager.broadcast(
            {
                "type": "incident_updated",

                "incident_id": incident.id,

                "event_type": incident.event_type,

                "severity": incident.severity,

                "latitude": incident.latitude,

                "longitude": incident.longitude,

                "old_status": old_status,

                "new_status": incident.status,

                "confirmation_count": (
                    incident.confirmation_count
                ),

                "unique_bus_count": (
                    incident.unique_bus_count
                ),

                "average_confidence": round(
                    incident.average_confidence,
                    4
                ),

                "verification_score": round(
                    incident.verification_score,
                    4
                )
            }
        )


        # ----------------------------------------------------
        # 8. RESPONSE
        # ----------------------------------------------------

        return {
            "message": "Incident status updated successfully",

            "incident_id": incident.id,

            "old_status": old_status,

            "new_status": incident.status
        }


    except HTTPException:
        raise


    except SQLAlchemyError as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error while updating incident status: "
                f"{str(error)}"
            )
        )


    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Error while updating incident status: "
                f"{str(error)}"
            )
        )