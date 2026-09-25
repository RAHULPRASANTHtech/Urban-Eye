from pathlib import Path
import time

from ultralytics import YOLO


# ============================================================
# ACCIDENT DETECTION SERVICE
# ============================================================

class AccidentDetectionService:
    """
    Dedicated AI service for detecting traffic accidents from
    LIVE camera frames.

    This service is completely independent from the existing
    road damage / pothole detection pipeline.
    """


    def __init__(
        self,
        model_path=None,
        confidence_threshold=0.35,
        required_hits=3,
        max_missed_frames=10
    ):


        print(
            "\n========================================"
        )

        print(
            "Loading Accident Detection AI Model..."
        )


        # ====================================================
        # MODEL PATH
        # ====================================================

        if model_path is None:

            backend_dir = (
                Path(__file__)
                .resolve()
                .parent
                .parent
            )


            model_path = (
                backend_dir
                / "ai_models"
                / "accident_model"
                / "epoch14.pt"
            )


        self.model_path = str(
            model_path
        )


        # ====================================================
        # VERIFY MODEL EXISTS
        # ====================================================

        if not Path(
            self.model_path
        ).exists():

            raise FileNotFoundError(

                "Accident detection model not found at: "
                f"{self.model_path}"

            )


        # ====================================================
        # LOAD YOLO MODEL
        # ====================================================

        self.model = YOLO(
            self.model_path
        )


        # ====================================================
        # CONFIGURATION
        # ====================================================

        self.confidence_threshold = (
            confidence_threshold
        )


        # Number of positive frames required before an
        # accident is considered confirmed.
        self.required_hits = (
            required_hits
        )


        # Number of frames without accident detection before
        # the verification counter resets.
        self.max_missed_frames = (
            max_missed_frames
        )


        # ====================================================
        # TEMPORAL VERIFICATION STATE
        # ====================================================

        self.consecutive_hits = 0

        self.missed_frames = 0

        self.total_frames = 0

        self.confirmed_accidents = 0

        self.accident_active = False

        self.last_detection_time = None


        # ====================================================
        # DISPLAY MODEL INFORMATION
        # ====================================================

        print(
            "Accident AI Model Loaded Successfully."
        )

        print(
            f"Model Path: {self.model_path}"
        )

        print(
            f"Confidence Threshold: "
            f"{self.confidence_threshold}"
        )

        print(
            f"Required Consecutive Hits: "
            f"{self.required_hits}"
        )

        print(
            f"Model Classes: "
            f"{self.model.names}"
        )

        print(
            "========================================\n"
        )


    # ============================================================
    # DETERMINE WHETHER DETECTION IS AN ACCIDENT
    # ============================================================

    def is_accident_class(
        self,
        class_name
    ):


        normalized_name = str(
            class_name
        ).strip().lower()


        accident_keywords = [

            "accident",

            "crash",

            "collision",

            "traffic accident",

            "vehicle accident"

        ]


        return any(

            keyword in normalized_name

            for keyword in accident_keywords

        )


    # ============================================================
    # ANALYZE SINGLE FRAME
    # ============================================================

    def analyze_frame(
        self,
        frame
    ):


        self.total_frames += 1


        detections = []


        # ====================================================
        # RUN YOLO
        # ====================================================

        results = self.model(

            frame,

            conf=self.confidence_threshold,

            verbose=False

        )


        current_timestamp = (
            time.time()
        )


        # ====================================================
        # PROCESS RESULTS
        # ====================================================

        for result in results:


            boxes = result.boxes


            if boxes is None:

                continue


            for box in boxes:


                # ------------------------------------------------
                # CLASS
                # ------------------------------------------------

                class_id = int(
                    box.cls[0]
                )


                class_name = (
                    self.model.names[
                        class_id
                    ]
                )


                # ------------------------------------------------
                # CONFIDENCE
                # ------------------------------------------------

                confidence = float(
                    box.conf[0]
                )


                # ------------------------------------------------
                # BOUNDING BOX
                # ------------------------------------------------

                x1, y1, x2, y2 = (

                    box.xyxy[0].tolist()

                )


                detection = {

                    "class_id":
                        class_id,

                    "type":
                        str(class_name),

                    "confidence":
                        confidence,

                    "timestamp":
                        current_timestamp,

                    "bounding_box": {

                        "x1":
                            int(x1),

                        "y1":
                            int(y1),

                        "x2":
                            int(x2),

                        "y2":
                            int(y2)

                    },

                    "is_accident":
                        self.is_accident_class(
                            class_name
                        )

                }


                detections.append(
                    detection
                )


        # ====================================================
        # CHECK FOR ACCIDENT DETECTIONS
        # ====================================================

        accident_detections = [

            detection

            for detection in detections

            if detection["is_accident"]

        ]


        # ====================================================
        # TEMPORAL VERIFICATION
        #
        # Prevent one random frame from triggering an
        # emergency accident confirmation.
        # ====================================================

        if accident_detections:


            self.consecutive_hits += 1

            self.missed_frames = 0

            self.last_detection_time = (
                current_timestamp
            )


        else:


            self.missed_frames += 1


            if (

                self.missed_frames
                >=
                self.max_missed_frames

            ):

                self.consecutive_hits = 0

                self.accident_active = False


        # ====================================================
        # CONFIRM ACCIDENT
        # ====================================================

        newly_confirmed = False


        if (

            self.consecutive_hits
            >=
            self.required_hits

            and

            not self.accident_active

        ):


            self.accident_active = True

            self.confirmed_accidents += 1

            newly_confirmed = True


            print(
                "\n"
                "========================================"
            )

            print(
                "EMERGENCY ACCIDENT CONFIRMED"
            )

            print(
                f"Consecutive Frames: "
                f"{self.consecutive_hits}"
            )

            print(
                f"Total Confirmed Accidents: "
                f"{self.confirmed_accidents}"
            )

            print(
                "========================================\n"
            )


        # ====================================================
        # FIND HIGHEST CONFIDENCE ACCIDENT
        # ====================================================

        best_accident = None


        if accident_detections:


            best_accident = max(

                accident_detections,

                key=lambda detection:
                    detection["confidence"]

            )


        # ====================================================
        # RETURN RESULT
        # ====================================================

        return {

            "raw_detections":
                detections,


            "accident_detected":
                len(accident_detections) > 0,


            "accident_active":
                self.accident_active,


            "newly_confirmed":
                newly_confirmed,


            "consecutive_hits":
                self.consecutive_hits,


            "required_hits":
                self.required_hits,


            "missed_frames":
                self.missed_frames,


            "best_accident":
                best_accident,


            "total_frames":
                self.total_frames,


            "confirmed_accidents":
                self.confirmed_accidents

        }


    # ============================================================
    # RESET DETECTION STATE
    # ============================================================

    def reset(self):


        self.consecutive_hits = 0

        self.missed_frames = 0

        self.total_frames = 0

        self.confirmed_accidents = 0

        self.accident_active = False

        self.last_detection_time = None


        print(
            "Accident detection state reset."
        )


        return {

            "success":
                True,

            "message":
                "Accident detection state reset successfully."

        }