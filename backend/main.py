from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import Base, engine


# ============================================================
# IMPORT DATABASE MODELS
# ============================================================

# Import models before create_all so SQLAlchemy knows all tables.

import models


# ============================================================
# IMPORT ROUTERS
# ============================================================

from routers.dashboard import router as dashboard_router

from routers.events import router as events_router

from routers.gis import router as gis_router

from routers.incidents import router as incidents_router

from routers.websocket import router as websocket_router

from routers.ai_events import router as ai_events_router


# ============================================================
# EXISTING ROAD AI DETECTION ROUTER
# ============================================================

from routers.ai_detection import (
    router as ai_detection_router
)
from routers.accident_detection import router as accident_detection_router

# ============================================================
# NEW EMERGENCY ACCIDENT DETECTION ROUTER
# ============================================================

from routers.accident_detection import (
    router as accident_detection_router
)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

Base.metadata.create_all(

    bind=engine

)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(

    title="UrbanEye AI Command Center API",

    description=(

        "Backend API for geographically verified "
        "urban intelligence incidents with real-time "
        "road intelligence and emergency accident detection."

    ),

    version="1.0.0"

)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(

    CORSMiddleware,


    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

    ],


    allow_credentials=True,


    allow_methods=["*"],


    allow_headers=["*"],

)


# ============================================================
# REGISTER API ROUTERS
# ============================================================


# ------------------------------------------------------------
# EXISTING APPLICATION ROUTERS
# ------------------------------------------------------------

app.include_router(

    events_router

)


app.include_router(

    incidents_router

)


app.include_router(

    dashboard_router

)


app.include_router(

    gis_router

)


app.include_router(

    websocket_router

)


app.include_router(

    ai_events_router

)


# ------------------------------------------------------------
# EXISTING ROAD INTELLIGENCE AI
#
# Detects:
# - Potholes
# - Road damage
# - Other urban road incidents
# ------------------------------------------------------------

app.include_router(

    ai_detection_router

)


# ------------------------------------------------------------
# NEW EMERGENCY ACCIDENT AI
#
# Detects:
# - Traffic accidents
# - Vehicle collisions
#
# Designed specifically for LIVE CAMERA monitoring.
# ------------------------------------------------------------

app.include_router(

    accident_detection_router

)

app.include_router(ai_events_router)
# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():


    return {


        "message":
            "UrbanEye AI Command Center backend is running",


        "road_ai_detection":
            "available",


        "accident_ai_detection":
            "available"

    }


# ============================================================
# DATABASE + POSTGIS TEST
# ============================================================

@app.get("/api/test-db")
def test_database():


    try:


        with engine.connect() as connection:


            # ------------------------------------------------
            # POSTGRESQL VERSION
            # ------------------------------------------------

            version_result = connection.execute(

                text(

                    "SELECT version();"

                )

            )


            version = (

                version_result
                .fetchone()[0]

            )


            # ------------------------------------------------
            # POSTGIS VERSION
            # ------------------------------------------------

            postgis_result = connection.execute(

                text(

                    "SELECT PostGIS_Version();"

                )

            )


            postgis_version = (

                postgis_result
                .fetchone()[0]

            )


        return {


            "database":
                "connected",


            "postgresql_version":
                version,


            "postgis_version":
                postgis_version

        }


    except Exception as error:


        return {


            "database":
                "connection failed",


            "error":
                str(error)

        }