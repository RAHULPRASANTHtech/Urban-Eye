import { api } from './api';
// ============================================================
// ACCIDENT DETECTION TYPES
// ============================================================

export interface BoundingBox {

  x1: number;

  y1: number;

  x2: number;

  y2: number;

}


export interface AccidentDetection {

  class_id: number;

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

  is_accident: boolean;

}


export interface AccidentVerification {

  consecutive_hits: number;

  required_hits: number;

  missed_frames: number;

}


export interface AccidentStatistics {

  total_frames: number;

  confirmed_accidents: number;

}


export interface AccidentFrameResponse {

  success: boolean;

  detections: AccidentDetection[];

  accident_detected: boolean;

  accident_active: boolean;

  newly_confirmed: boolean;

  verification: AccidentVerification;

  best_accident: AccidentDetection | null;

  statistics: AccidentStatistics;

  frame_width: number;

  frame_height: number;

}
// ============================================================
// IMAGE DATA → JPEG BLOB
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
      'Unable to create canvas context.'
    );

  }

  // Put captured frame into canvas

  context.putImageData(

    frame,

    0,

    0

  );


  // Convert to JPEG

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
                'Unable to convert frame to JPEG.'
              )

            );

            return;

          }


          resolve(
            blob
          );

        },


        'image/jpeg',


        0.90

      );

    }

  );

}
// ============================================================
// ANALYZE ACCIDENT FRAME
// ============================================================

export async function analyzeAccidentFrame(

  frame: ImageData

): Promise<AccidentFrameResponse> {


  try {


    // ========================================================
    // CONVERT FRAME → JPEG
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

      'accident-frame.jpg'

    );


    // ========================================================
    // SEND TO ACCIDENT AI BACKEND
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


    return data as AccidentFrameResponse;


  } catch (error) {


    console.error(

      'Accident AI analysis failed:',

      error

    );


    // Return safe fallback.
    // Never fake accident detection.

    return {

      success: false,

      detections: [],

      accident_detected: false,

      accident_active: false,

      newly_confirmed: false,

      verification: {

        consecutive_hits: 0,

        required_hits: 3,

        missed_frames: 0

      },

      best_accident: null,

      statistics: {

        total_frames: 0,

        confirmed_accidents: 0

      },

      frame_width: 0,

      frame_height: 0

    };

  }

}
// ============================================================
// RESET ACCIDENT DETECTOR
// ============================================================

export async function resetAccidentDetector() {


  try {


    const { data } =
      await api.post(

        '/api/accident-detection/reset'

      );


    console.log(

      'Accident detector reset:',

      data

    );


    return data;


  } catch (error) {


    console.error(

      'Failed to reset accident detector:',

      error

    );


    throw error;

  }

}
// ============================================================
// GET ACCIDENT AI STATUS
// ============================================================

export async function getAccidentAIStatus() {


  const { data } =
    await api.get(

      '/api/accident-detection/status'

    );


  return data;

}