import cv2
import numpy as np

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile
)

from services.accident_detection_service import (
    AccidentDetectionService
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(

    prefix="/api/accident-detection",

    tags=["Emergency Accident Detection"]

)


# ============================================================
# LOAD ACCIDENT AI MODEL ONCE
# ============================================================
#
# IMPORTANT:
#
# The model is loaded when FastAPI starts.
#
# It is NOT loaded every time a frame is uploaded.
#
# ============================================================

detector = AccidentDetectionService(

    confidence_threshold=0.35,

    required_hits=3,

    max_missed_frames=10

)


# ============================================================
# ANALYZE LIVE CAMERA FRAME
# ============================================================

@router.post("/frame")
async def analyze_accident_frame(

    file: UploadFile = File(...)

):


    try:


        # ====================================================
        # VALIDATE FILE
        # ====================================================

        if not file.content_type:


            raise HTTPException(

                status_code=400,

                detail=(
                    "No valid image content type provided."
                )

            )


        if not file.content_type.startswith(

            "image/"

        ):


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


        # ====================================================
        # CONVERT BYTES → NUMPY
        # ====================================================

        image_array = np.frombuffer(

            image_bytes,

            dtype=np.uint8

        )


        # ====================================================
        # DECODE IMAGE
        # ====================================================

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
        # RUN ACCIDENT AI
        # ====================================================

        result = detector.analyze_frame(

            frame

        )


        # ====================================================
        # FORMAT DETECTIONS
        # ====================================================

        detections = []


        for detection in result[

            "raw_detections"

        ]:


            detections.append({

                "class_id":
                    detection["class_id"],


                "type":
                    detection["type"],


                "confidence":
                    round(

                        detection["confidence"],

                        4

                    ),


                "bounding_box":
                    detection["bounding_box"],


                "is_accident":
                    detection["is_accident"]

            })


        # ====================================================
        # RESPONSE
        # ====================================================

        return {


            "success":
                True,


            # ------------------------------------------------
            # RAW MODEL DETECTIONS
            # ------------------------------------------------

            "detections":
                detections,


            # ------------------------------------------------
            # ACCIDENT STATUS
            # ------------------------------------------------

            "accident_detected":
                result["accident_detected"],


            "accident_active":
                result["accident_active"],


            # True ONLY when accident becomes confirmed
            "newly_confirmed":
                result["newly_confirmed"],


            # ------------------------------------------------
            # TEMPORAL VERIFICATION
            # ------------------------------------------------

            "verification": {

                "consecutive_hits":
                    result["consecutive_hits"],


                "required_hits":
                    result["required_hits"],


                "missed_frames":
                    result["missed_frames"]

            },


            # ------------------------------------------------
            # BEST ACCIDENT DETECTION
            # ------------------------------------------------

            "best_accident":
                result["best_accident"],


            # ------------------------------------------------
            # STATISTICS
            # ------------------------------------------------

            "statistics": {

                "total_frames":
                    result["total_frames"],


                "confirmed_accidents":
                    result["confirmed_accidents"]

            },


            # ------------------------------------------------
            # FRAME INFORMATION
            # ------------------------------------------------

            "frame_width":
                frame.shape[1],


            "frame_height":
                frame.shape[0]

        }


    except HTTPException:


        raise


    except Exception as error:


        print(
            "\nACCIDENT DETECTION ERROR:"
        )


        print(
            str(error)
        )


        raise HTTPException(

            status_code=500,

            detail=(

                "Accident frame analysis failed: "

                f"{str(error)}"

            )

        )


# ============================================================
# ACCIDENT AI STATUS
# ============================================================

@router.get("/status")
def get_accident_ai_status():


    return {


        "status":
            "READY",


        "model_loaded":
            True,


        "model_path":
            detector.model_path,


        "confidence_threshold":
            detector.confidence_threshold,


        "required_hits":
            detector.required_hits,


        "max_missed_frames":
            detector.max_missed_frames,


        "model_classes":
            detector.model.names,


        "total_frames":
            detector.total_frames,


        "confirmed_accidents":
            detector.confirmed_accidents

    }


# ============================================================
# RESET ACCIDENT DETECTOR
# ============================================================

@router.post("/reset")
def reset_accident_detector():


    return detector.reset()