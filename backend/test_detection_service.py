import cv2

from services.detection_service import RoadDetectionService
from services.incident_manager import IncidentManager


# ==========================================
# INITIALIZE AI DETECTION SERVICE
# ==========================================

detector = RoadDetectionService(
    model_path="ai_models/best.pt",
    confidence_threshold=0.15
)


# ==========================================
# INITIALIZE INCIDENT MANAGER
# ==========================================

incident_manager = IncidentManager(
    api_url="http://127.0.0.1:8000/api/events",
    bus_id="BUS-001"
)


# ==========================================
# TEMPORARY GPS LOCATION FOR TESTING
# ==========================================

TEST_LATITUDE = 13.0827
TEST_LONGITUDE = 80.2707


# ==========================================
# OPEN VIDEO
# ==========================================

video_path = "test_road_video.mp4"

cap = cv2.VideoCapture(video_path)


if not cap.isOpened():

    print("ERROR: Could not open video.")
    exit()


print("\n========================================")
print("URBAN INTELLIGENCE - AI DETECTION SYSTEM")
print("========================================\n")


frame_number = 0


# ==========================================
# VIDEO PROCESSING LOOP
# ==========================================

while True:

    success, frame = cap.read()

    if not success:
        break


    frame_number += 1


    # ======================================
    # COMPLETE AI PIPELINE
    # YOLO → SPATIAL TRACKER → INCIDENT
    # ======================================

    result = detector.analyze_video_frame(frame)


    confirmed_incidents = result["confirmed_incidents"]


    # ======================================
    # PROCESS CONFIRMED INCIDENTS
    # ======================================

    for incident in confirmed_incidents:

        print("\n" + "=" * 50)
        print("🚨 NEW INCIDENT CONFIRMED")
        print("=" * 50)

        print(f"Frame: {frame_number}")
        print(f"Incident ID: {incident['incident_id']}")
        print(f"Track ID: {incident['track_id']}")
        print(f"Type: {incident['incident_type']}")
        print(f"Confidence: {incident['confidence']:.2%}")
        print(f"Frames Detected: {incident['frames_detected']}")
        print(f"Status: {incident['status']}")


        # ==================================
        # SEND INCIDENT TO BACKEND
        # ==================================

        backend_response = incident_manager.send_incident(
            incident=incident,
            latitude=TEST_LATITUDE,
            longitude=TEST_LONGITUDE
        )


        if backend_response:

            print("\nBACKEND RESPONSE:")
            print(backend_response)


    # ======================================
    # DISPLAY VIDEO
    # ======================================

    raw_results = detector.model(

        frame,

        conf=detector.confidence_threshold,

        verbose=False
    )


    annotated_frame = raw_results[0].plot()


    cv2.imshow(

        "Urban Intelligence - AI Detection",

        annotated_frame
    )


    # Press Q to quit

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ==========================================
# CLEANUP
# ==========================================

cap.release()

cv2.destroyAllWindows()


print("\n========================================")
print("VIDEO ANALYSIS COMPLETED")
print("========================================")