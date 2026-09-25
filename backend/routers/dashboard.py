from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Bus, Incident


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # ACTIVE BUSES
    # --------------------------------------------------------

    active_buses = (
        db.query(Bus)
        .filter(
            Bus.is_active.is_(True)
        )
        .count()
    )


    # --------------------------------------------------------
    # TOTAL INCIDENTS
    # --------------------------------------------------------

    total_incidents = (
        db.query(Incident)
        .count()
    )


    # --------------------------------------------------------
    # ACTIVE / UNRESOLVED INCIDENTS
    # --------------------------------------------------------

    active_incidents = (
        db.query(Incident)
        .filter(
            Incident.status != "RESOLVED"
        )
        .count()
    )


    # --------------------------------------------------------
    # CRITICAL INCIDENTS
    # --------------------------------------------------------

    critical_incidents = (
        db.query(Incident)
        .filter(
            Incident.severity == "CRITICAL"
        )
        .count()
    )


    # --------------------------------------------------------
    # POTHOLE INCIDENTS
    # --------------------------------------------------------
    #
    # Uses case-insensitive comparison so both:
    #
    # pothole
    # POTHOLE
    #
    # are counted correctly.
    # --------------------------------------------------------

    potholes = (
        db.query(Incident)
        .filter(
            func.lower(
                Incident.event_type
            ) == "pothole"
        )
        .count()
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_incidents": total_incidents,

        "active_incidents": active_incidents,

        "critical_incidents": critical_incidents,

        "potholes": potholes,

        "active_buses": active_buses
    }