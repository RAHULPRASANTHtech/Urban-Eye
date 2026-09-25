import cv2
from pathlib import Path
from ultralytics import YOLO


# ============================================================
# ACCIDENT MODEL
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "ai_models"
    / "accident_model"
    / "epoch14.pt"
)


# ============================================================
# VIDEO PATH
# ============================================================

# CHANGE THIS TO YOUR ACCIDENT VIDEO FILE

VIDEO_PATH = (
    BASE_DIR
    / "test_accident_video.mp4"
)


# ============================================================
# LOAD MODEL
# ============================================================

print("\n==========================================")
print("LOADING ACCIDENT DETECTION MODEL")
print("==========================================\n")

print(f"Model: {MODEL_PATH}")

model = YOLO(
    str(MODEL_PATH)
)

print(
    f"Classes: {model.names}"
)


# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(
    str(VIDEO_PATH)
)


if not cap.isOpened():

    print(
        "\nERROR: Could not open video."
    )

    print(
        f"Video path: {VIDEO_PATH}"
    )

    exit()


print("\n==========================================")
print("VIDEO OPENED SUCCESSFULLY")
print("==========================================\n")


# ============================================================
# CONFIGURATION
# ============================================================

CONFIDENCE_THRESHOLD = 0.15

FRAME_SKIP = 2


frame_count = 0

accident_frames = 0

total_detections = 0


# ============================================================
# PROCESS VIDEO
# ============================================================

while True:


    success, frame = cap.read()


    if not success:

        break


    frame_count += 1


    # --------------------------------------------------------
    # OPTIONAL FRAME SKIPPING
    # --------------------------------------------------------

    if (
        frame_count % FRAME_SKIP != 0
    ):

        continue


    # --------------------------------------------------------
    # RUN YOLO
    # --------------------------------------------------------

    results = model(

        frame,

        conf=CONFIDENCE_THRESHOLD,

        verbose=False

    )


    # --------------------------------------------------------
    # PROCESS DETECTIONS
    # --------------------------------------------------------

    accident_found = False


    for result in results:


        if result.boxes is None:

            continue


        for box in result.boxes:


            class_id = int(
                box.cls[0]
            )


            confidence = float(
                box.conf[0]
            )


            class_name = str(
                model.names[class_id]
            )


            x1, y1, x2, y2 = map(

                int,

                box.xyxy[0].tolist()

            )


            total_detections += 1


            # ------------------------------------------------
            # PRINT DETECTION
            # ------------------------------------------------

            print(

                f"Frame {frame_count} | "

                f"Detected: {class_name} | "

                f"Confidence: {confidence:.2%}"

            )


            # ------------------------------------------------
            # DRAW BOX
            # ------------------------------------------------

            color = (

                (0, 0, 255)

                if class_name.lower() == "accident"

                else

                (0, 255, 0)

            )


            cv2.rectangle(

                frame,

                (x1, y1),

                (x2, y2),

                color,

                2

            )


            label = (

                f"{class_name} "

                f"{confidence:.1%}"

            )


            cv2.putText(

                frame,

                label,

                (x1, max(30, y1 - 10)),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.7,

                color,

                2

            )


            # ------------------------------------------------
            # ACCIDENT CHECK
            # ------------------------------------------------

            if (

                "accident" in
                class_name.lower()

            ):

                accident_found = True


    # --------------------------------------------------------
    # ACCIDENT STATUS
    # --------------------------------------------------------

    if accident_found:


        accident_frames += 1


        print(

            "\n"

            "🚨🚨🚨 ACCIDENT DETECTED 🚨🚨🚨"

            "\n"

        )


    # --------------------------------------------------------
    # DISPLAY
    # --------------------------------------------------------

    cv2.imshow(

        "UrbanEye - Accident Detection Test",

        frame

    )


    key = cv2.waitKey(1)


    if key == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()


# ============================================================
# SUMMARY
# ============================================================

print("\n==========================================")
print("ACCIDENT DETECTION TEST SUMMARY")
print("==========================================")

print(
    f"Frames Processed: {frame_count}"
)

print(
    f"Total Detections: {total_detections}"
)

print(
    f"Frames With Accident: {accident_frames}"
)

print("==========================================\n")