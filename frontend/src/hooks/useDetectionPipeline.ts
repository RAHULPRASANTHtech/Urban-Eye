import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { api } from '../services/api';

import {
  createAIEvent,
} from '../services/aiEvents';

import type {
  GPSLocation,
} from '../services/location';


/* ============================================================
   TYPES
============================================================ */

export interface BoundingBox {

  x1: number;

  y1: number;

  x2: number;

  y2: number;

}


export interface Detection {

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

}


export interface DetectionPipelineState {

  detections: Detection[];

  analysisWidth: number;

  analysisHeight: number;

  isProcessing: boolean;

  error: string | null;

  framesProcessed: number;

  eventsCreated: number;

}


/* ============================================================
   HOOK
============================================================ */

export function useDetectionPipeline() {


  /* ==========================================================
     STATE
  ========================================================== */

  const [

    state,

    setState

  ] = useState<DetectionPipelineState>({

    detections: [],

    analysisWidth: 0,

    analysisHeight: 0,

    isProcessing: false,

    error: null,

    framesProcessed: 0,

    eventsCreated: 0,

  });


  /* ==========================================================
     PROCESSING LOCK
  ========================================================== */

  const processingRef =
    useRef(false);


  /* ==========================================================
     EVENT COOLDOWN

     Prevents same detection from creating hundreds of
     database events every second.
  ========================================================== */

  const lastEventTimeRef =
    useRef<Record<string, number>>({});


  /* ==========================================================
     ANALYZE FRAME
  ========================================================== */

  const analyzeFrame =
    useCallback(

      async (

        canvas: HTMLCanvasElement,

        location: GPSLocation | null,

        busId: string =
          'DEMO-CAMERA-001'

      ) => {


        /* ====================================================
           PREVENT PARALLEL REQUESTS
        ==================================================== */

        if (
          processingRef.current
        ) {

          return;

        }


        processingRef.current =
          true;


        setState(

          previous => ({

            ...previous,

            isProcessing: true,

            error: null,

          })

        );


        try {


          /* ==================================================
             CONVERT CANVAS → BLOB
          ================================================== */

          const blob =
            await new Promise<Blob | null>(

              resolve => {

                canvas.toBlob(

                  resolve,

                  'image/jpeg',

                  0.85

                );

              }

            );


          if (
            !blob
          ) {

            throw new Error(
              'Failed to capture frame.'
            );

          }


          /* ==================================================
             CREATE FORM DATA
          ================================================== */

          const formData =
            new FormData();


          formData.append(

            'file',

            blob,

            'frame.jpg'

          );


          /* ==================================================
             SEND FRAME TO BACKEND
          ================================================== */

          const response =
            await api.post(

              '/api/ai-detection/frame',

              formData,

              {

                headers: {

                  'Content-Type':
                    'multipart/form-data'

                }

              }

            );


          const data =
            response.data;


          /* ==================================================
             NORMALIZE DETECTIONS
          ================================================== */

          const detections:
            Detection[] =

            data.raw_detections
            ??

            data.detections
            ??

            [];


          /* ==================================================
             UPDATE FRONTEND STATE
          ================================================== */

          setState(

            previous => ({

              ...previous,

              detections,

              analysisWidth:
                canvas.width,

              analysisHeight:
                canvas.height,

              framesProcessed:
                previous.framesProcessed + 1,

            })

          );


          /* ==================================================
             CREATE DATABASE EVENTS
          ================================================== */

          if (
            location &&
            detections.length > 0
          ) {

            const now =
              Date.now();


            for (
              const detection
              of detections
            ) {


              /* ==============================================
                 EVENT COOLDOWN
              ============================================== */

              const key =
                `${detection.type}`;


              const lastTime =
                lastEventTimeRef
                  .current[key]
                ?? 0;


              /* 10 SECOND COOLDOWN */

              if (
                now - lastTime <
                10000
              ) {

                continue;

              }


              lastEventTimeRef
                .current[key] =
                now;


              /* ==============================================
                 DETERMINE SEVERITY
              ============================================== */

              let severity =
                'MEDIUM';


              if (
                detection.confidence >=
                0.75
              ) {

                severity =
                  'HIGH';

              }


              if (
                detection.confidence >=
                0.90
              ) {

                severity =
                  'CRITICAL';

              }


              /* ==============================================
                 CREATE AI EVENT
              ============================================== */

              try {

                await createAIEvent({

                  event_type:
                    detection.type,

                  severity,

                  latitude:
                    location.latitude,

                  longitude:
                    location.longitude,

                  confidence:
                    detection.confidence,

                  bus_id:
                    busId,

                });


                setState(

                  previous => ({

                    ...previous,

                    eventsCreated:
                      previous.eventsCreated + 1,

                  })

                );


                console.log(

                  'AI Event created:',

                  detection.type,

                  location.latitude,

                  location.longitude

                );


              } catch (
                eventError
              ) {

                console.error(

                  'Failed to create AI event:',

                  eventError

                );

              }

            }

          }


        } catch (
          error
        ) {


          console.error(

            'Frame analysis failed:',

            error

          );


          setState(

            previous => ({

              ...previous,

              error:

                error instanceof Error

                  ? error.message

                  : 'Failed to analyze frame.'

            })

          );


        } finally {


          processingRef.current =
            false;


          setState(

            previous => ({

              ...previous,

              isProcessing: false,

            })

          );

        }

      },

      []

    );


  /* ==========================================================
     RESET
  ========================================================== */

  const reset =
    useCallback(

      () => {

        processingRef.current =
          false;


        lastEventTimeRef.current =
          {};


        setState({

          detections: [],

          analysisWidth: 0,

          analysisHeight: 0,

          isProcessing: false,

          error: null,

          framesProcessed: 0,

          eventsCreated: 0,

        });

      },

      []

    );


  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(

    () => {

      return () => {

        processingRef.current =
          false;

      };

    },

    []

  );


  /* ==========================================================
     RETURN
  ========================================================== */

  return {

    state,

    analyzeFrame,

    reset,

  };

}