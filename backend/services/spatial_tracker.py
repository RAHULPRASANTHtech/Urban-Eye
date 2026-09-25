import math
import uuid


class SpatialIncidentTracker:

    def __init__(
        self,
        required_hits=4,
        max_missed_frames=30,
        iou_threshold=0.10,
        max_center_distance_ratio=0.30
    ):

        # =====================================================
        # ACTIVE TRACKS
        # =====================================================

        self.tracks = []


        # =====================================================
        # CONFIGURATION
        # =====================================================

        # Number of successful detections required
        # before confirming an incident.
        self.required_hits = required_hits


        # Number of frames a detection may disappear
        # before the track is removed.
        self.max_missed_frames = max_missed_frames


        # Minimum IoU required for spatial matching.
        self.iou_threshold = iou_threshold


        # Maximum allowed movement of the bounding box center
        # relative to the full frame diagonal.
        self.max_center_distance_ratio = (
            max_center_distance_ratio
        )


        # Current processed frame number.
        self.frame_number = 0


    # =========================================================
    # MAIN TRACKING UPDATE
    # =========================================================

    def update(
        self,
        detections,
        frame_shape
    ):

        # Move to next frame.
        self.frame_number += 1


        frame_height, frame_width = (
            frame_shape[:2]
        )


        confirmed_incidents = []


        # Tracks already matched during this frame.
        matched_track_ids = set()


        # =====================================================
        # PROCESS CURRENT DETECTIONS
        # =====================================================

        for detection in detections:


            best_track = None

            best_score = -1


            # =================================================
            # FIND BEST EXISTING TRACK
            # =================================================

            for track in self.tracks:


                # ---------------------------------------------
                # INCIDENT TYPE MUST MATCH
                # ---------------------------------------------

                if (
                    track["type"]
                    != detection["type"]
                ):

                    continue


                # ---------------------------------------------
                # ONE DETECTION CAN MATCH ONE TRACK PER FRAME
                # ---------------------------------------------

                if (
                    track["track_id"]
                    in matched_track_ids
                ):

                    continue


                # ---------------------------------------------
                # CALCULATE SPATIAL MATCH SCORE
                # ---------------------------------------------

                score = self._match_score(

                    track["bounding_box"],

                    detection["bounding_box"],

                    frame_width,

                    frame_height
                )


                if score > best_score:

                    best_score = score

                    best_track = track


            # =================================================
            # MATCH FOUND
            # =================================================

            if (
                best_track is not None
                and best_score > 0
            ):


                matched_track_ids.add(
                    best_track["track_id"]
                )


                # Increase evidence count.
                best_track["hits"] += 1


                # Reset missing frame count.
                best_track["missed_frames"] = 0


                # Update last detection frame.
                best_track["last_seen"] = (
                    self.frame_number
                )


                # Store confidence history.
                best_track[
                    "confidence_history"
                ].append(

                    detection["confidence"]
                )


                # Update bounding box.
                best_track[
                    "bounding_box"
                ] = detection["bounding_box"]


                # =================================================
                # CONFIRM INCIDENT
                # =================================================

                if (

                    best_track["hits"]
                    >= self.required_hits

                    and

                    not best_track["confirmed"]

                ):


                    best_track["confirmed"] = True


                    incident = (
                        self._create_incident(
                            best_track
                        )
                    )


                    confirmed_incidents.append(
                        incident
                    )


                    print(
                        "\n"
                        "===================================="
                    )

                    print(
                        "SPATIAL INCIDENT CONFIRMED"
                    )

                    print(
                        f"TYPE: "
                        f"{incident['incident_type']}"
                    )

                    print(
                        f"TRACK: "
                        f"{incident['track_id']}"
                    )

                    print(
                        f"HITS: "
                        f"{incident['frames_detected']}"
                    )

                    print(
                        "====================================\n"
                    )


            # =================================================
            # CREATE NEW TRACK
            # =================================================

            else:


                new_track = {

                    "track_id":
                        (
                            f"TRACK-"
                            f"{uuid.uuid4().hex[:8].upper()}"
                        ),


                    "type":
                        detection["type"],


                    "bounding_box":
                        detection["bounding_box"],


                    # First detection = first hit.
                    "hits":
                        1,


                    "missed_frames":
                        0,


                    "last_seen":
                        self.frame_number,


                    "confirmed":
                        False,


                    "confidence_history": [
                        detection["confidence"]
                    ]
                }


                self.tracks.append(
                    new_track
                )


                matched_track_ids.add(
                    new_track["track_id"]
                )


                print(

                    f"\nNEW TRACK CREATED: "

                    f"{new_track['type']} "

                    f"({new_track['track_id']})"
                )


        # =====================================================
        # HANDLE TRACKS NOT DETECTED IN CURRENT FRAME
        # =====================================================

        for track in self.tracks:


            if (
                track["track_id"]
                not in matched_track_ids
            ):

                track["missed_frames"] += 1


        # =====================================================
        # REMOVE EXPIRED TRACKS
        # =====================================================

        active_tracks = []


        for track in self.tracks:


            if (

                track["missed_frames"]

                <=

                self.max_missed_frames

            ):


                active_tracks.append(
                    track
                )


            else:


                print(

                    f"\nIncident tracking ended: "

                    f"{track['type']} "

                    f"({track['track_id']}) "

                    f"after "

                    f"{track['hits']} hits"
                )


        self.tracks = active_tracks


        # =====================================================
        # RETURN TRACKING RESULT
        # =====================================================

        return {

            "confirmed_incidents":
                confirmed_incidents,


            "active_tracks":
                self._get_active_tracks()
        }


    # =========================================================
    # CREATE CONFIRMED INCIDENT
    # =========================================================

    def _create_incident(
        self,
        track
    ):


        confidence_history = (
            track["confidence_history"]
        )


        average_confidence = (

            sum(confidence_history)

            /

            len(confidence_history)
        )


        return {


            "incident_id":

                (
                    f"INC-"
                    f"{uuid.uuid4().hex[:8].upper()}"
                ),


            "track_id":
                track["track_id"],


            "incident_type":
                track["type"],


            "confidence":
                round(
                    average_confidence,
                    4
                ),


            "status":
                "confirmed",


            "bounding_box":
                track["bounding_box"],


            "frames_detected":
                track["hits"],


            "frame_number":
                self.frame_number
        }


    # =========================================================
    # SPATIAL MATCH SCORE
    # =========================================================

    def _match_score(

        self,

        box1,

        box2,

        frame_width,

        frame_height

    ):


        # Calculate IoU.
        iou = self._calculate_iou(
            box1,
            box2
        )


        # Calculate center movement.
        center_distance = (
            self._center_distance(
                box1,
                box2
            )
        )


        # Frame diagonal.
        frame_diagonal = math.sqrt(

            frame_width ** 2

            +

            frame_height ** 2
        )


        normalized_distance = (

            center_distance

            /

            frame_diagonal
        )


        # =====================================================
        # STRONG MATCH: BOUNDING BOX OVERLAP
        # =====================================================

        if iou >= self.iou_threshold:


            return (

                1.0

                +

                iou
            )


        # =====================================================
        # CAMERA MOVEMENT MATCH
        #
        # Road camera moves continuously.
        #
        # Therefore boxes may not overlap perfectly.
        # We also allow matching based on center movement.
        # =====================================================

        if (

            normalized_distance

            <=

            self.max_center_distance_ratio

        ):


            return (

                1

                -

                normalized_distance
            )


        # =====================================================
        # NO MATCH
        # =====================================================

        return -1


    # =========================================================
    # IOU CALCULATION
    # =========================================================

    def _calculate_iou(
        self,
        box1,
        box2
    ):


        x1 = max(
            box1["x1"],
            box2["x1"]
        )


        y1 = max(
            box1["y1"],
            box2["y1"]
        )


        x2 = min(
            box1["x2"],
            box2["x2"]
        )


        y2 = min(
            box1["y2"],
            box2["y2"]
        )


        intersection_width = max(

            0,

            x2 - x1
        )


        intersection_height = max(

            0,

            y2 - y1
        )


        intersection_area = (

            intersection_width

            *

            intersection_height
        )


        box1_area = (

            (box1["x2"] - box1["x1"])

            *

            (box1["y2"] - box1["y1"])
        )


        box2_area = (

            (box2["x2"] - box2["x1"])

            *

            (box2["y2"] - box2["y1"])
        )


        union_area = (

            box1_area

            +

            box2_area

            -

            intersection_area
        )


        if union_area <= 0:

            return 0


        return (

            intersection_area

            /

            union_area
        )


    # =========================================================
    # CENTER DISTANCE
    # =========================================================

    def _center_distance(
        self,
        box1,
        box2
    ):


        center1_x = (

            box1["x1"]

            +

            box1["x2"]

        ) / 2


        center1_y = (

            box1["y1"]

            +

            box1["y2"]

        ) / 2


        center2_x = (

            box2["x1"]

            +

            box2["x2"]

        ) / 2


        center2_y = (

            box2["y1"]

            +

            box2["y2"]

        ) / 2


        return math.sqrt(

            (center1_x - center2_x) ** 2

            +

            (center1_y - center2_y) ** 2
        )


    # =========================================================
    # ACTIVE TRACK INFORMATION
    # =========================================================

    def _get_active_tracks(self):


        tracks = []


        for track in self.tracks:


            confidence_history = (
                track["confidence_history"]
            )


            average_confidence = (

                sum(confidence_history)

                /

                len(confidence_history)
            )


            tracks.append({

                "track_id":
                    track["track_id"],


                "type":
                    track["type"],


                "hits":
                    track["hits"],


                "required_hits":
                    self.required_hits,


                "confirmed":
                    track["confirmed"],


                "missed_frames":
                    track["missed_frames"],


                "confidence":
                    round(
                        average_confidence,
                        4
                    ),


                "bounding_box":
                    track["bounding_box"]
            })


        return tracks