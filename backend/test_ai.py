from ultralytics import YOLO
import cv2

# Load the trained road damage model
model = YOLO("ai_models/best.pt")

# Change this to your test image path
image_path = "test_road.jpg"

# Run AI detection
results = model(image_path)

# Process results
for result in results:
    annotated_frame = result.plot()

    cv2.imshow("Urban Intelligence - AI Detection", annotated_frame)

    print("\n--- DETECTIONS ---")

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        class_name = model.names[class_id]

        print(
            f"Detected: {class_name} | "
            f"Confidence: {confidence:.2%}"
        )

    cv2.waitKey(0)

cv2.destroyAllWindows()