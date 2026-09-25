from ultralytics import YOLO
import cv2

MODEL_PATH = "ai_models/pothole_best.pt"
VIDEO_PATH = "test_road_video.mp4"   # Change if necessary

print("Loading improved pothole AI model...")

model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

print("Starting video detection...")
print("Press Q to quit.")

while True:

    success, frame = cap.read()

    if not success:
        break

    results = model(
        frame,
        conf=0.50,
        verbose=False
    )

    annotated_frame = results[0].plot()

    cv2.imshow(
        "Improved Pothole Detection",
        annotated_frame
    )

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()

print("Testing completed.")