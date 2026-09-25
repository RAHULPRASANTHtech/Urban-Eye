import cv2
from ultralytics import YOLO


# ==========================================
# LOAD MODEL
# ==========================================

print("Loading AI Model...")

model = YOLO("ai_models/best.pt")

print("Model Loaded Successfully.\n")


# ==========================================
# OPEN VIDEO
# ==========================================

video_path = "test_road_video.mp4"

cap = cv2.VideoCapture(video_path)


if not cap.isOpened():

    print("ERROR: Could not open video.")
    exit()


# ==========================================
# MODEL INFORMATION
# ==========================================

print("=" * 50)
print("MODEL CLASSES")
print("=" * 50)

for class_id, class_name in model.names.items():

    print(f"{class_id}: {class_name}")


print("\n" + "=" * 50)
print("STARTING DEBUG DETECTION")
print("=" * 50 + "\n")


frame_number = 0


while True:

    success, frame = cap.read()

    if not success:
        break


    frame_number += 1


    # Run model with VERY LOW threshold
    results = model(

        frame,

        conf=0.10,

        verbose=False
    )


    result = results[0]


    # Print detections
    if result.boxes is not None and len(result.boxes) > 0:

        print(f"\nFRAME {frame_number}")

        for box in result.boxes:

            class_id = int(box.cls[0])

            class_name = model.names[class_id]

            confidence = float(box.conf[0])

            print(
                f"Detected: {class_name} | "
                f"Confidence: {confidence:.2%}"
            )


    # Display annotated frame

    annotated_frame = result.plot()

    cv2.imshow(

        "MODEL DEBUG - Press Q to Quit",

        annotated_frame
    )


    if cv2.waitKey(1) & 0xFF == ord("q"):

        break


cap.release()

cv2.destroyAllWindows()


print("\nDEBUG TEST COMPLETED.")