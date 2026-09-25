import cv2
import numpy as np

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile
)

from services.detection_service import RoadDetectionService


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai-detection",
    tags=["AI Detection"]
)


# ============================================================
# LOAD AI MODEL ONCE
# ============================================================
#
# IMPORTANT:
# Do NOT create RoadDetectionService inside every request.
#
# The YOLO model should stay loaded in memory.
#

detector = RoadDetectionService(
    model_path="ai_models/best.pt",
    confidence_threshold=0.15
)


# ============================================================
# FRAME COUNTER
# ============================================================

frame_counter = 0


# ============================================================
# AI DETECTION ENDPOINT
# ============================================================

@router.post("/frame")
async def analyze_frame(
    file: UploadFile = File(...)
):

    global frame_counter

    try:

        # ====================================================
        # VALIDATE IMAGE
        # ====================================================

        if not file.content_type:

            raise HTTPException(
                status_code=400,
                detail="No valid image content type provided."
            )


        if not file.content_type.startswith("image/"):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid file type. "
                    "Please upload an image frame."
                )
            )


        # ====================================================
        # READ IMAGE
        # ====================================================

        image_bytes = await file.read()


        if not image_bytes:

            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )


        # Convert uploaded bytes → NumPy array
        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )


        # Decode image using OpenCV
        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )


        if frame is None:

            raise HTTPException(
                status_code=400,
                detail="Could not decode image frame."
            )


        # ====================================================
        # FRAME COUNTER
        # ====================================================

        frame_counter += 1


        # ====================================================
        # RUN COMPLETE AI PIPELINE
        #
        # YOLO
        #   ↓
        # REAL DETECTIONS
        #   ↓
        # SPATIAL TRACKER
        #   ↓
        # CONFIRMED INCIDENTS
        # ====================================================

        result = detector.analyze_video_frame(
            frame
        )


        raw_detections = result[
            "raw_detections"
        ]


        confirmed_incidents = result[
            "confirmed_incidents"
        ]


        active_tracks = result[
            "active_tracks"
        ]


        # ====================================================
        # FORMAT DETECTIONS FOR FRONTEND
        # ====================================================

        detections = []


        for detection in raw_detections:

            detections.append({

                "type":
                    detection["type"],

                "confidence":
                    round(
                        detection["confidence"],
                        4
                    ),

                "bounding_box":
                    detection["bounding_box"]
            })


        # ====================================================
        # FORMAT CONFIRMED INCIDENTS
        # ====================================================

        incidents = []


        for incident in confirmed_incidents:

            incidents.append({

                "incident_id":
                    incident["incident_id"],

                "track_id":
                    incident["track_id"],

                "incident_type":
                    incident["incident_type"],

                "confidence":
                    incident["confidence"],

                "status":
                    incident["status"],

                "frames_detected":
                    incident["frames_detected"],

                "bounding_box":
                    incident["bounding_box"]
            })


        # ====================================================
        # RESPONSE TO FRONTEND
        # ====================================================

        return {

            "success": True,

            "frame_number":
                frame_counter,


            # True if YOLO found any valid detection
            "detected":
                len(detections) > 0,


            # All YOLO detections in current frame
            "detections":
                detections,


            # Spatial tracking information
            "active_tracks":
                active_tracks,


            # Newly confirmed incidents
            "confirmed_incidents":
                incidents,


            # Frame dimensions
            "frame_width":
                frame.shape[1],

            "frame_height":
                frame.shape[0]
        }


    except HTTPException:

        raise


    except Exception as error:

        print(
            "\nAI DETECTION ERROR:"
        )

        print(error)


        raise HTTPException(

            status_code=500,

            detail=(
                "AI frame analysis failed: "
                f"{str(error)}"
            )
        )


# ============================================================
# AI MODEL STATUS ENDPOINT
# ============================================================

@router.get("/status")
def get_ai_status():

    return {

        "status":
            "READY",

        "model_loaded":
            True,

        "model_path":
            "ai_models/best.pt",

        "confidence_threshold":
            detector.confidence_threshold,

        "ignored_classes":
            detector.ignored_classes,

        "active_tracks":
            len(
                detector.spatial_tracker.tracks
            )
    }


# ============================================================
# RESET AI TRACKER
# ============================================================

@router.post("/reset")
def reset_ai_tracker():

    global frame_counter


    detector.spatial_tracker.tracks = []

    detector.spatial_tracker.frame_number = 0

    frame_counter = 0


    return {

        "success": True,

        "message":
            "AI detection tracker reset successfully."
    }