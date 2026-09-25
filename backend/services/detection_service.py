from ultralytics import YOLO

from services.spatial_tracker import (
    SpatialIncidentTracker
)

import time


class RoadDetectionService:


    def __init__(

        self,

        model_path="ai_models/best.pt",

        confidence_threshold=0.15

    ):


        print(
            "Loading Urban Intelligence AI Model..."
        )


        # =====================================================
        # LOAD YOLO MODEL
        # =====================================================

        self.model = YOLO(
            model_path
        )


        # =====================================================
        # DETECTION CONFIGURATION
        # =====================================================

        self.confidence_threshold = (
            confidence_threshold
        )


        # Ignore unreliable generic class.
        self.ignored_classes = [
            "Other"
        ]


        # =====================================================
        # SPATIAL INCIDENT TRACKER
        # =====================================================

        self.spatial_tracker = (
            SpatialIncidentTracker(

                required_hits=4,

                max_missed_frames=30,

                iou_threshold=0.10,

                max_center_distance_ratio=0.30
            )
        )


        print(
            "AI Model Loaded Successfully."
        )


    # =========================================================
    # ANALYZE SINGLE FRAME USING YOLO
    # =========================================================

    def analyze_frame(
        self,
        frame
    ):


        detections = []


        # =====================================================
        # RUN YOLO MODEL
        # =====================================================

        results = self.model(

            frame,

            conf=self.confidence_threshold,

            verbose=False
        )


        current_timestamp = (
            time.time()
        )


        # =====================================================
        # PROCESS YOLO RESULTS
        # =====================================================

        for result in results:


            boxes = result.boxes


            if boxes is None:

                continue


            for box in boxes:


                # =================================================
                # CLASS
                # =================================================

                class_id = int(
                    box.cls[0]
                )


                class_name = (
                    self.model.names[
                        class_id
                    ]
                )


                # =================================================
                # CONFIDENCE
                # =================================================

                confidence = float(
                    box.conf[0]
                )


                # =================================================
                # IGNORE UNRELIABLE CLASS
                # =================================================

                if (

                    class_name

                    in

                    self.ignored_classes

                ):

                    continue


                # =================================================
                # BOUNDING BOX
                # =================================================

                x1, y1, x2, y2 = (

                    box.xyxy[0].tolist()
                )


                detection = {


                    "type":
                        class_name,


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
                    }
                }


                detections.append(
                    detection
                )


        return detections


    # =========================================================
    # COMPLETE VIDEO FRAME ANALYSIS
    # =========================================================

    def analyze_video_frame(
        self,
        frame
    ):


        # =====================================================
        # STEP 1
        # RUN YOLO DETECTION
        # =====================================================

        detections = (
            self.analyze_frame(
                frame
            )
        )


        # =====================================================
        # DEBUG LOGGING
        # =====================================================

        if detections:


            print(
                "\nRAW DETECTIONS SENT TO TRACKER:"
            )


            for detection in detections:


                print(

                    f"{detection['type']} | "

                    f"{detection['confidence']:.2%}"
                )


        # =====================================================
        # STEP 2
        # SEND DETECTIONS TO SPATIAL TRACKER
        # =====================================================

        tracking_result = (

            self.spatial_tracker.update(

                detections,

                frame.shape
            )
        )


        # =====================================================
        # STEP 3
        # RETURN COMPLETE PIPELINE RESULT
        # =====================================================

        return {


            # Raw YOLO detections.
            "raw_detections":
                detections,


            # Newly confirmed incidents.
            "confirmed_incidents":

                tracking_result[
                    "confirmed_incidents"
                ],


            # Currently active tracks.
            "active_tracks":

                tracking_result[
                    "active_tracks"
                ]
        }