import uuid

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from database import get_db
from models import AIEvent


router = APIRouter(
    prefix="/api/ai-events",
    tags=["AI Events"]
)


# ============================================================
# CREATE AI EVENT
# ============================================================

@router.post("")
def create_ai_event(
    payload: dict,
    db: Session = Depends(get_db)
):

    try:

        # ----------------------------------------------------
        # REQUIRED FIELDS
        # ----------------------------------------------------

        event_type = payload.get(
            "event_type"
        )

        latitude = payload.get(
            "latitude"
        )

        longitude = payload.get(
            "longitude"
        )

        confidence = payload.get(
            "confidence"
        )


        if not event_type:

            raise HTTPException(
                status_code=400,
                detail="event_type is required"
            )


        if latitude is None:

            raise HTTPException(
                status_code=400,
                detail="latitude is required"
            )


        if longitude is None:

            raise HTTPException(
                status_code=400,
                detail="longitude is required"
            )


        if confidence is None:

            raise HTTPException(
                status_code=400,
                detail="confidence is required"
            )


        # ----------------------------------------------------
        # VALIDATE COORDINATES
        # ----------------------------------------------------

        latitude = float(latitude)

        longitude = float(longitude)

        confidence = float(confidence)


        if not -90 <= latitude <= 90:

            raise HTTPException(
                status_code=400,
                detail="Invalid latitude"
            )


        if not -180 <= longitude <= 180:

            raise HTTPException(
                status_code=400,
                detail="Invalid longitude"
            )


        if not 0 <= confidence <= 1:

            raise HTTPException(
                status_code=400,
                detail=(
                    "confidence must be between "
                    "0 and 1"
                )
            )


        # ----------------------------------------------------
        # OPTIONAL FIELDS
        # ----------------------------------------------------

        severity = (
            payload.get("severity")
            or "MEDIUM"
        ).upper()


        bus_id = (
            payload.get("bus_id")
            or "DEMO-CAMERA-001"
        )


        evidence_url = payload.get(
            "evidence_url"
        )


        # ----------------------------------------------------
        # GENERATE UNIQUE EVENT ID
        # ----------------------------------------------------

        event_id = (
            f"EVT-"
            f"{uuid.uuid4().hex[:12].upper()}"
        )


        # ----------------------------------------------------
        # CREATE POSTGIS POINT
        #
        # IMPORTANT:
        # PostGIS uses:
        # POINT(longitude latitude)
        # ----------------------------------------------------

        location = WKTElement(

            (
                f"POINT("
                f"{longitude} "
                f"{latitude}"
                f")"
            ),

            srid=4326

        )


        # ----------------------------------------------------
        # CREATE AI EVENT
        # ----------------------------------------------------

        ai_event = AIEvent(

            event_id=event_id,

            bus_id=bus_id,

            event_type=event_type,

            severity=severity,

            latitude=latitude,

            longitude=longitude,

            confidence=confidence,

            evidence_url=evidence_url,

            processed=False

        )


        db.add(
            ai_event
        )


        db.commit()


        db.refresh(
            ai_event
        )


        print(
            "\n"
            "========================================"
        )

        print(
            "AI EVENT CREATED"
        )

        print(
            f"Event ID: {event_id}"
        )

        print(
            f"Type: {event_type}"
        )

        print(
            f"Confidence: {confidence:.2%}"
        )

        print(
            f"GPS: {latitude}, {longitude}"
        )

        print(
            "========================================\n"
        )


        return {

            "message":
                "AI event created successfully",

            "event_id":
                event_id,

            "event_type":
                event_type,

            "latitude":
                latitude,

            "longitude":
                longitude,

            "confidence":
                confidence

        }


    except HTTPException:

        raise


    except Exception as error:

        db.rollback()


        print(
            "AI EVENT ERROR:",
            str(error)
        )


        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to create AI event: "
                f"{str(error)}"
            )

        )