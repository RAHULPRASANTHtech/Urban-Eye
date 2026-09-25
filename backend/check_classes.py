from ultralytics import YOLO

model = YOLO("ai_models/best.pt")

print("\nMODEL CLASSES:\n")

for class_id, class_name in model.names.items():
    print(f"{class_id}: {class_name}")