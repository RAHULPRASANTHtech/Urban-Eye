from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Bus, Incident


router = APIRouter(
    prefix="/api/gis",
    tags=["GIS"]
)


# ============================================================
# GET INCIDENTS AS GEOJSON
# ============================================================

@router.get("/incidents")
def get_gis_incidents(
    db: Session = Depends(get_db)
):

    incidents = (
        db.query(Incident)
        .order_by(Incident.id.desc())
        .all()
    )

    features = []


    for incident in incidents:

        feature = {
            "type": "Feature",

            "geometry": {
                "type": "Point",

                # GeoJSON coordinates are always:
                # [longitude, latitude]
                "coordinates": [
                    incident.longitude,
                    incident.latitude
                ]
            },

            "properties": {
                "id": incident.id,

                "event_type": incident.event_type,

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
                ),

                "created_at": (
                    incident.created_at.isoformat()
                    if incident.created_at
                    else None
                ),

                "updated_at": (
                    incident.updated_at.isoformat()
                    if incident.updated_at
                    else None
                )
            }
        }

        features.append(feature)


    return {
        "type": "FeatureCollection",

        "features": features
    }


# ============================================================
# GET BUSES AS GEOJSON
# ============================================================

@router.get("/buses")
def get_gis_buses(
    db: Session = Depends(get_db)
):

    buses = (
        db.query(Bus)
        .order_by(Bus.bus_id)
        .all()
    )

    features = []


    for bus in buses:

        feature = {
            "type": "Feature",

            "geometry": {
                "type": "Point",

                # GeoJSON coordinates are always:
                # [longitude, latitude]
                "coordinates": [
                    bus.longitude,
                    bus.latitude
                ]
            },

            "properties": {
                "id": bus.id,

                "bus_id": bus.bus_id,

                "is_active": bus.is_active,

                "last_seen": (
                    bus.last_seen.isoformat()
                    if bus.last_seen
                    else None
                )
            }
        }

        features.append(feature)


    return {
        "type": "FeatureCollection",

        "features": features
    }