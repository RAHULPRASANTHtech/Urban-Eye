from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import AIEvent, Incident, IncidentConfirmation
from routers.websocket import manager
from schemas import AIEventCreate


router = APIRouter(
    prefix="/api/events",
    tags=["Events"]
)


# ============================================================
# CONFIGURATION
# ============================================================

MATCHING_RADIUS_METERS = 20


# ============================================================
# SEVERITY CALCULATION
# ============================================================

def calculate_severity(
    confidence: float,
    verification_score: float,
    unique_bus_count: int
) -> str:
    """
    Calculate incident severity based on AI confidence,
    verification score, and number of independent buses.
    """

    if (
        verification_score >= 0.85
        and unique_bus_count >= 3
    ):
        return "CRITICAL"

    if verification_score >= 0.75:
        return "HIGH"

    if confidence >= 0.70:
        return "MEDIUM"

    return "LOW"


# ============================================================
# RECEIVE AI EVENT
# ============================================================

@router.post("")
async def receive_event(
    event: AIEventCreate,
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # 1. IDEMPOTENCY CHECK
        # ====================================================

        existing_event = (
            db.query(AIEvent)
            .filter(
                AIEvent.event_id == event.event_id
            )
            .first()
        )

        if existing_event:

            return {
                "message": "Event already processed",
                "event_id": event.event_id,
                "duplicate": True
            }


        # ====================================================
        # 2. STORE RAW AI EVENT
        # ====================================================

        db_event = AIEvent(
            event_id=event.event_id,
            bus_id=event.bus_id,
            event_type=event.event_type,
            severity=event.severity.upper(),
            latitude=event.latitude,
            longitude=event.longitude,
            confidence=event.confidence,
            evidence_url=event.evidence_url,
            processed=False
        )

        db.add(db_event)

        # Flush to database without committing yet.
        # This allows the event_id foreign key relationship
        # to be available for IncidentConfirmation.
        db.flush()


        # ====================================================
        # 3. POSTGIS SPATIAL MATCHING
        # ====================================================
        #
        # Find an unresolved incident where:
        #
        # - event type matches
        # - status is not RESOLVED
        # - location is within 20 meters
        #
        # Both geometries are converted to geography because
        # ST_DWithin on geography uses meters.
        # ====================================================

        spatial_match_condition = text(
            """
            ST_DWithin(
                incidents.location::geography,
                ST_SetSRID(
                    ST_MakePoint(:longitude, :latitude),
                    4326
                )::geography,
                :radius
            )
            """
        )

        nearby_incident = (
            db.query(Incident)
            .filter(
                Incident.event_type == event.event_type,
                Incident.status != "RESOLVED",
                spatial_match_condition
            )
            .params(
                longitude=event.longitude,
                latitude=event.latitude,
                radius=MATCHING_RADIUS_METERS
            )
            .order_by(Incident.id.asc())
            .first()
        )


        # ====================================================
        # 4. MATCH EXISTING INCIDENT OR CREATE NEW INCIDENT
        # ====================================================

        if nearby_incident:

            # ------------------------------------------------
            # EXISTING INCIDENT FOUND
            # ------------------------------------------------

            incident = nearby_incident
            action = "confirmed"


        else:

            # ------------------------------------------------
            # NO MATCH FOUND → CREATE NEW INCIDENT
            # ------------------------------------------------

            incident = Incident(
                event_type=event.event_type,

                severity=event.severity.upper(),

                latitude=event.latitude,

                longitude=event.longitude,

                # PostGIS POINT(longitude latitude)
                location=(
                    f"SRID=4326;"
                    f"POINT({event.longitude} {event.latitude})"
                ),

                status="NEW",

                confirmation_count=0,

                unique_bus_count=0,

                average_confidence=0.0,

                verification_score=0.0
            )

            db.add(incident)

            db.flush()

            action = "created"


        # ====================================================
        # 5. ADD EVENT AS INCIDENT CONFIRMATION
        # ====================================================

        confirmation = IncidentConfirmation(
            incident_id=incident.id,
            event_id=db_event.event_id,
            bus_id=event.bus_id,
            confidence=event.confidence
        )

        db.add(confirmation)

        db.flush()


        # ====================================================
        # 6. CALCULATE MULTI-BUS VERIFICATION
        # ====================================================

        confirmations = (
            db.query(IncidentConfirmation)
            .filter(
                IncidentConfirmation.incident_id == incident.id
            )
            .all()
        )


        # ----------------------------------------------------
        # TOTAL CONFIRMATIONS
        # ----------------------------------------------------

        confirmation_count = len(confirmations)


        # ----------------------------------------------------
        # UNIQUE BUSES
        # ----------------------------------------------------

        unique_buses = {
            confirmation.bus_id
            for confirmation in confirmations
        }

        unique_bus_count = len(unique_buses)


        # ----------------------------------------------------
        # AVERAGE AI CONFIDENCE
        # ----------------------------------------------------

        average_confidence = (
            sum(
                confirmation.confidence
                for confirmation in confirmations
            )
            / confirmation_count
        )


        # ====================================================
        # 7. CALCULATE VERIFICATION SCORE
        # ====================================================
        #
        # AI confidence       = 50%
        # Unique buses        = 30%
        # Confirmation count  = 20%
        #
        # Final score range:
        # 0.0 → 1.0
        # ====================================================

        confidence_component = (
            average_confidence * 0.5
        )

        bus_component = (
            min(unique_bus_count / 3, 1.0) * 0.3
        )

        confirmation_component = (
            min(confirmation_count / 5, 1.0) * 0.2
        )

        verification_score = (
            confidence_component
            + bus_component
            + confirmation_component
        )


        # ====================================================
        # 8. UPDATE INCIDENT VERIFICATION DATA
        # ====================================================

        incident.confirmation_count = confirmation_count

        incident.unique_bus_count = unique_bus_count

        incident.average_confidence = average_confidence

        incident.verification_score = verification_score

        incident.severity = calculate_severity(
            confidence=average_confidence,
            verification_score=verification_score,
            unique_bus_count=unique_bus_count
        )


        # ====================================================
        # 8.1 AUTOMATIC STATUS UPDATE
        # ====================================================

        if (
            incident.unique_bus_count >= 2
            and verification_score >= 0.75
        ):

            incident.status = "CONFIRMED"

        elif incident.confirmation_count >= 1:

            incident.status = "UNDER_REVIEW"

        else:

            incident.status = "NEW"


        # ====================================================
        # 9. MARK EVENT AS PROCESSED
        # ====================================================

        db_event.processed = True


        # ====================================================
        # 10. SAVE EVERYTHING
        # ====================================================

        db.commit()

        db.refresh(incident)


        # ====================================================
        # 11. WEBSOCKET BROADCAST
        # ====================================================
        #
        # Broadcast only after successful database commit.
        # ====================================================

        if action == "created":

            await manager.broadcast(
                {
                    "type": "incident_created",

                    "incident_id": incident.id,

                    "event_type": incident.event_type,

                    "severity": incident.severity,

                    "latitude": incident.latitude,

                    "longitude": incident.longitude,

                    "status": incident.status,

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


        else:

            await manager.broadcast(
                {
                    "type": "incident_confirmed",

                    "incident_id": incident.id,

                    "event_id": event.event_id,

                    "bus_id": event.bus_id,

                    "severity": incident.severity,

                    "status": incident.status,

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


        # ====================================================
        # 12. RESPONSE
        # ====================================================

        return {

            "message": "Event processed successfully",

            "event_id": event.event_id,

            "incident_id": incident.id,

            "action": action,

            "severity": incident.severity,

            "status": incident.status,

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


    # ========================================================
    # DATABASE ERROR HANDLING
    # ========================================================

    except SQLAlchemyError as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error while processing event: {str(error)}"
        )


    # ========================================================
    # GENERAL ERROR HANDLING
    # ========================================================

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Error while processing event: {str(error)}"
        )