import { api } from './api';


export type PipelineStage =
  | 'IDLE'
  | 'DETECTED'
  | 'VALIDATING'
  | 'CONFIRMED'
  | 'SENT';


// ============================================================
// BOUNDING BOX
// ============================================================

export interface BoundingBox {

  x1: number;

  y1: number;

  x2: number;

  y2: number;

}


// ============================================================
// DETECTION
// ============================================================

export interface Detection {

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

}


// ============================================================
// FRAME INFERENCE RESULT
// ============================================================

export interface FrameInference {

  detected: boolean;

  eventType?: string;

  confidence: number;

  detections: Detection[];

  frameWidth: number;

  frameHeight: number;

}
// ============================================================
// ACCIDENT DETECTION
// ============================================================

export interface AccidentDetection {

  class_id: number;

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

  is_accident: boolean;

}


export interface AccidentInference {

  success: boolean;

  accidentDetected: boolean;

  accidentActive: boolean;

  newlyConfirmed: boolean;

  detections: AccidentDetection[];

  bestAccident: AccidentDetection | null;

  consecutiveHits: number;

  requiredHits: number;

  missedFrames: number;

  totalFrames: number;

  confirmedAccidents: number;

  frameWidth: number;

  frameHeight: number;

}

// ============================================================
// CONVERT IMAGEDATA TO JPEG BLOB
// ============================================================

async function imageDataToBlob(
  frame: ImageData
): Promise<Blob> {


  const canvas =
    document.createElement('canvas');


  canvas.width =
    frame.width;

  canvas.height =
    frame.height;


  const context =
    canvas.getContext('2d');


  if (!context) {

    throw new Error(
      'Unable to create canvas context'
    );

  }


  // Put ImageData into canvas
  context.putImageData(
    frame,
    0,
    0
  );


  // Convert canvas → JPEG Blob
  return new Promise(
    (
      resolve,
      reject
    ) => {

      canvas.toBlob(

        (blob) => {

          if (!blob) {

            reject(
              new Error(
                'Unable to convert frame to image blob'
              )
            );

            return;

          }


          resolve(blob);

        },

        'image/jpeg',

        0.90
      );

    }
  );

}


// ============================================================
// REAL YOLO AI FRAME ANALYSIS
// ============================================================

export async function analyzeFrame(
  frame: ImageData
): Promise<FrameInference> {


  try {


    // ========================================================
    // CONVERT VIDEO FRAME → JPEG BLOB
    // ========================================================

    const imageBlob =
      await imageDataToBlob(
        frame
      );


    // ========================================================
    // CREATE MULTIPART FORM DATA
    //
    // Backend expects:
    //
    // file: UploadFile = File(...)
    //
    // Therefore field name MUST be "file"
    // ========================================================

    const formData =
      new FormData();


    formData.append(

      'file',

      imageBlob,

      'frame.jpg'
    );


    // ========================================================
    // SEND FRAME TO FASTAPI YOLO API
    // ========================================================

    const { data } =
      await api.post(

        '/api/ai-detection/frame',

        formData

      );


    console.log(
      'YOLO AI RESPONSE:',
      data
    );


    // ========================================================
    // EXTRACT DETECTIONS
    // ========================================================

    const detections: Detection[] =

      Array.isArray(
        data.detections
      )

        ? data.detections

        : [];


    // ========================================================
    // FIND PRIMARY DETECTION
    //
    // Highest confidence detection in this frame
    // ========================================================

    const primaryDetection =

      detections.length > 0

        ? detections.reduce(

            (
              best: Detection,
              current: Detection
            ) =>

              current.confidence >
              best.confidence

                ? current

                : best

          )

        : null;


    // ========================================================
    // RETURN REAL YOLO RESULT
    // ========================================================

return {

  detected:
    Boolean(
      data.detected ??
      primaryDetection
    ),

  eventType:

    data.event_type ??

    data.eventType ??

    primaryDetection?.type ??

    undefined,


  confidence:

    Number(
      data.confidence ??

      primaryDetection?.confidence ??

      0
    ),


  detections,


  frameWidth:
    Number(data.frame_width ?? 0),


  frameHeight:
    Number(data.frame_height ?? 0),

};


  } catch (error) {


    console.error(
      'AI frame analysis failed:',
      error
    );


    // IMPORTANT:
    // Never fake detection.

    return {

  detected: false,

  confidence: 0,

  detections: [],

  frameWidth: 0,

  frameHeight: 0,

};

  }

}
// ============================================================
// REAL ACCIDENT AI FRAME ANALYSIS
// ============================================================

export async function analyzeAccidentFrame(
  frame: ImageData
): Promise<AccidentInference> {


  try {


    // ========================================================
    // CONVERT VIDEO FRAME → JPEG BLOB
    // ========================================================

    const imageBlob =
      await imageDataToBlob(
        frame
      );


    // ========================================================
    // CREATE FORM DATA
    // ========================================================

    const formData =
      new FormData();


    formData.append(

      'file',

      imageBlob,

      'frame.jpg'
    );


    // ========================================================
    // SEND FRAME TO ACCIDENT DETECTION API
    // ========================================================

    const { data } =
      await api.post(

        '/api/accident-detection/frame',

        formData

      );


    // ========================================================
    // DEBUG LOG
    // ========================================================

    console.log(
      'ACCIDENT AI RESPONSE:',
      data
    );


    // ========================================================
    // RETURN FORMATTED RESULT
    // ========================================================

    return {

      success:
        Boolean(
          data.success
        ),


      accidentDetected:
        Boolean(
          data.accident_detected
        ),


      accidentActive:
        Boolean(
          data.accident_active
        ),


      newlyConfirmed:
        Boolean(
          data.newly_confirmed
        ),


      detections:

        Array.isArray(
          data.detections
        )

          ? data.detections

          : [],


      bestAccident:

        data.best_accident ??

        null,


      consecutiveHits:

        Number(
          data.verification
            ?.consecutive_hits ?? 0
        ),


      requiredHits:

        Number(
          data.verification
            ?.required_hits ?? 0
        ),


      missedFrames:

        Number(
          data.verification
            ?.missed_frames ?? 0
        ),


      totalFrames:

        Number(
          data.statistics
            ?.total_frames ?? 0
        ),


      confirmedAccidents:

        Number(
          data.statistics
            ?.confirmed_accidents ?? 0
        ),


      frameWidth:

        Number(
          data.frame_width ?? 0
        ),


      frameHeight:

        Number(
          data.frame_height ?? 0
        )

    };


  } catch (error) {


    console.error(
      'Accident AI frame analysis failed:',
      error
    );


    return {

      success: false,

      accidentDetected: false,

      accidentActive: false,

      newlyConfirmed: false,

      detections: [],

      bestAccident: null,

      consecutiveHits: 0,

      requiredHits: 0,

      missedFrames: 0,

      totalFrames: 0,

      confirmedAccidents: 0,

      frameWidth: 0,

      frameHeight: 0

    };

  }

}