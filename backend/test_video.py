from ultralytics import YOLO
import cv2
import time

# Load AI model
model = YOLO("ai_models/best.pt")

# Open road video
video_path = "test_road_video.mp4"
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

print("\n===================================")
print("URBAN INTELLIGENCE - VIDEO AI TEST")
print("===================================\n")

frame_count = 0
start_time = time.time()

while True:
    success, frame = cap.read()

    if not success:
        print("\nVideo processing completed.")
        break

    frame_count += 1

    # Run AI detection
    results = model(frame, conf=0.35)

    # Get annotated frame
    annotated_frame = results[0].plot()

    # Print detections
    boxes = results[0].boxes

    if boxes is not None and len(boxes) > 0:

        print(f"\nFrame {frame_count}:")

        for box in boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            class_name = model.names[class_id]

            print(
                f"  Detected: {class_name} | "
                f"Confidence: {confidence:.2%}"
            )

    # Show live processed video
    cv2.imshow(
        "Urban Intelligence - AI Road Monitoring",
        annotated_frame
    )

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        print("\nStopped by user.")
        break


cap.release()
cv2.destroyAllWindows()

elapsed = time.time() - start_time

print("\n===================================")
print("VIDEO ANALYSIS SUMMARY")
print("===================================")
print(f"Total Frames Processed: {frame_count}")
print(f"Processing Time: {elapsed:.2f} seconds")