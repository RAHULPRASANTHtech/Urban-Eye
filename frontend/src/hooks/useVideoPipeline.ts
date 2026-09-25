import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  analyzeFrame,
  type PipelineStage,
  type Detection,
} from '../services/ai';


// ============================================================
// VIDEO PIPELINE STATE
// ============================================================

export interface VideoPipelineState {

  stage: PipelineStage;

  isPlaying: boolean;

  // Total frames analyzed
  framesCaptured: number;

  // Consecutive frames validating same event
  framesValidated: number;

  // Number of frames required for confirmation
  validationTotal: number;

  // Confidence percentage for UI
  confidence: number;

  // Current detected event
  eventType: string | null;


  // Latest YOLO detections
  detections: Detection[];


  // Dimensions of the frame sent to YOLO.
  // Bounding boxes are relative to these dimensions.
  analysisWidth: number;

  analysisHeight: number;


  error: string | null;

}


// ============================================================
// CONFIGURATION
// ============================================================

// Require 4 consistent detections before confirmation
const VALIDATION_TOTAL = 4;


// Analyze one frame every 500ms
const ANALYSIS_INTERVAL = 500;


// ============================================================
// VIDEO PIPELINE HOOK
// ============================================================

export function useVideoPipeline() {


  // ==========================================================
  // VIDEO REFERENCES
  // ==========================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(null);


  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);


  const fileUrlRef =
    useRef<string | null>(null);


  const timerRef =
    useRef<number | null>(null);


  // ==========================================================
  // PIPELINE REFERENCES
  // ==========================================================

  const runningRef =
    useRef(false);


  const processingRef =
    useRef(false);


  const eventConfirmedRef =
    useRef(false);


  // ==========================================================
  // FRAME COUNTERS
  // ==========================================================

  const framesCapturedRef =
    useRef(0);


  const framesValidatedRef =
    useRef(0);


  // ==========================================================
  // CURRENT EVENT BEING VALIDATED
  // ==========================================================

  const candidateEventRef =
    useRef<string | null>(null);


  // ==========================================================
  // VIDEO URL
  // ==========================================================

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null);


  // ==========================================================
  // PIPELINE STATE
  // ==========================================================

  const [state, setState] =
    useState<VideoPipelineState>({

      stage: 'IDLE',

      isPlaying: false,

      framesCaptured: 0,

      framesValidated: 0,

      validationTotal: VALIDATION_TOTAL,

      confidence: 0,

      eventType: null,

      detections: [],

      analysisWidth: 0,

      analysisHeight: 0,

      error: null,

    });


  // ==========================================================
  // CLEAR TIMER
  // ==========================================================

  const clearTimer =
    useCallback(() => {

      if (
        timerRef.current !== null
      ) {

        window.clearInterval(
          timerRef.current
        );

        timerRef.current =
          null;

      }

    }, []);


  // ==========================================================
  // STOP PIPELINE
  // ==========================================================

  const stop =
    useCallback(() => {

      runningRef.current =
        false;


      clearTimer();


      if (videoRef.current) {

        videoRef.current.pause();

      }


      setState((prev) => ({

        ...prev,

        isPlaying: false,

      }));

    }, [
      clearTimer,
    ]);


  // ==========================================================
  // CAPTURE + ANALYZE FRAME
  // ==========================================================

  const captureAndAnalyze =
    useCallback(async () => {


      // Pipeline is stopped
      if (!runningRef.current) {

        return;

      }


      // Prevent overlapping AI requests
      if (processingRef.current) {

        return;

      }


      if (
        !videoRef.current ||
        !canvasRef.current
      ) {

        return;

      }


      const video =
        videoRef.current;


      const canvas =
        canvasRef.current;


      // ======================================================
      // VIDEO READINESS CHECK
      // ======================================================

      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {

        return;

      }


      processingRef.current =
        true;


      try {


        // ======================================================
        // PREPARE FRAME
        // ======================================================

        // Limit width for faster AI processing
        canvas.width =
          Math.min(
            video.videoWidth,
            640
          );


        // Preserve aspect ratio
        canvas.height =
          Math.max(
            1,
            Math.round(
              (
                canvas.width /
                video.videoWidth
              ) *
              video.videoHeight
            )
          );


        const context =
          canvas.getContext('2d');


        if (!context) {

          return;

        }


        // ======================================================
        // CAPTURE CURRENT VIDEO FRAME
        // ======================================================

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );


        const frame =
          context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );


        // ======================================================
        // SEND FRAME TO REAL YOLO BACKEND
        // ======================================================

        const result =
          await analyzeFrame(
            frame
          );


        // ======================================================
        // COUNT ANALYZED FRAME
        // ======================================================

        framesCapturedRef.current += 1;


        const captured =
          framesCapturedRef.current;


        // ======================================================
        // DETECTION VALIDATION
        // ======================================================

        if (result.detected) {


          const detectedEvent =
            result.eventType ??
            'UNKNOWN';


          // Same event detected consecutively
          if (
            candidateEventRef.current ===
            detectedEvent
          ) {

            framesValidatedRef.current += 1;

          }


          // New event detected
          else {

            candidateEventRef.current =
              detectedEvent;


            framesValidatedRef.current =
              1;


            // Allow new event confirmation
            eventConfirmedRef.current =
              false;

          }

        }


        // ======================================================
        // NO DETECTION
        // ======================================================

        else {

          framesValidatedRef.current =
            0;


          candidateEventRef.current =
            null;


          eventConfirmedRef.current =
            false;

        }


        // ======================================================
        // CONFIRMATION STATUS
        // ======================================================

        const confirmed =
          framesValidatedRef.current >=
          VALIDATION_TOTAL;


        // Cap UI display at validation total
        const validatedDisplay =
          Math.min(
            framesValidatedRef.current,
            VALIDATION_TOTAL
          );


        // ======================================================
        // DETERMINE PIPELINE STAGE
        // ======================================================

        let nextStage: PipelineStage =
          'IDLE';


        if (confirmed) {

          nextStage =
            'CONFIRMED';

        }

        else if (result.detected) {

          if (
            framesValidatedRef.current > 1
          ) {

            nextStage =
              'VALIDATING';

          }

          else {

            nextStage =
              'DETECTED';

          }

        }


        // ======================================================
        // UPDATE UI WITH REAL YOLO DATA
        // ======================================================

        setState((prev) => ({

          ...prev,


          // Pipeline stage
          stage:
            nextStage,


          // Video status
          isPlaying:
            true,


          // Frame counters
          framesCaptured:
            captured,


          framesValidated:
            validatedDisplay,


          validationTotal:
            VALIDATION_TOTAL,


          // AI confidence
          confidence:
            Math.round(
              result.confidence * 100
            ),


          // Current event
          eventType:

            result.detected

              ? (
                  result.eventType ??
                  null
                )

              : null,


          // ==================================================
          // LATEST YOLO BOUNDING BOXES
          // ==================================================

          detections:
            result.detections,


          // ==================================================
          // FRAME DIMENSIONS
          //
          // These MUST match the frame sent to YOLO.
          // Monitoring.tsx uses them to convert YOLO pixel
          // coordinates into CSS percentages.
          // ==================================================

          analysisWidth:
            canvas.width,


          analysisHeight:
            canvas.height,


          error:
            null,

        }));


        // ======================================================
        // LOG CONFIRMED EVENT ONCE
        // ======================================================

        if (
          confirmed &&
          !eventConfirmedRef.current
        ) {

          eventConfirmedRef.current =
            true;


          console.log(
            '========================================'
          );


          console.log(
            'AI EVENT CONFIRMED'
          );


          console.log({

            eventType:
              candidateEventRef.current,

            confidence:
              result.confidence,

            framesValidated:
              framesValidatedRef.current,

            framesCaptured:
              framesCapturedRef.current,

            detections:
              result.detections,

          });


          console.log(
            '========================================'
          );


          // Video continues.
          // AI continues.
          // We do not stop the pipeline.

        }


      } catch (error) {


        console.error(
          'Frame analysis error:',
          error
        );


        setState((prev) => ({

          ...prev,

          error:

            error instanceof Error

              ? error.message

              : 'Frame analysis failed',

        }));


      } finally {


        processingRef.current =
          false;

      }


    }, []);


  // ==========================================================
  // LOAD VIDEO
  // ==========================================================

  const loadVideo =
    useCallback((file: File) => {


      // Stop existing processing
      stop();


      // Remove old video URL
      if (fileUrlRef.current) {

        URL.revokeObjectURL(
          fileUrlRef.current
        );

      }


      // Create new video URL
      const url =
        URL.createObjectURL(
          file
        );


      fileUrlRef.current =
        url;


      setVideoUrl(
        url
      );


      // ======================================================
      // RESET REFERENCES
      // ======================================================

      framesCapturedRef.current =
        0;


      framesValidatedRef.current =
        0;


      candidateEventRef.current =
        null;


      eventConfirmedRef.current =
        false;


      processingRef.current =
        false;


      runningRef.current =
        false;


      // ======================================================
      // RESET UI STATE
      // ======================================================

      setState({

        stage: 'IDLE',

        isPlaying: false,

        framesCaptured: 0,

        framesValidated: 0,

        validationTotal: VALIDATION_TOTAL,

        confidence: 0,

        eventType: null,

        detections: [],

        analysisWidth: 0,

        analysisHeight: 0,

        error: null,

      });


    }, [
      stop,
    ]);


  // ==========================================================
  // START PROCESSING
  // ==========================================================

  const start =
    useCallback(async () => {


      if (
        !videoUrl ||
        !videoRef.current
      ) {

        return;

      }


      // ======================================================
      // RESET DETECTION SESSION
      // ======================================================

      framesCapturedRef.current =
        0;


      framesValidatedRef.current =
        0;


      candidateEventRef.current =
        null;


      eventConfirmedRef.current =
        false;


      processingRef.current =
        false;


      runningRef.current =
        true;


      // ======================================================
      // RESET UI
      // ======================================================

      setState((prev) => ({

        ...prev,

        stage: 'IDLE',

        isPlaying: true,

        framesCaptured: 0,

        framesValidated: 0,

        validationTotal: VALIDATION_TOTAL,

        confidence: 0,

        eventType: null,

        detections: [],

        analysisWidth: 0,

        analysisHeight: 0,

        error: null,

      }));


      try {


        // ======================================================
        // START VIDEO
        // ======================================================

        await videoRef.current.play();


        // ======================================================
        // CLEAR PREVIOUS TIMER
        // ======================================================

        clearTimer();


        // ======================================================
        // START PERIODIC AI ANALYSIS
        // ======================================================

        timerRef.current =
          window.setInterval(

            captureAndAnalyze,

            ANALYSIS_INTERVAL

          );


        // Analyze first frame immediately
        captureAndAnalyze();


      } catch {


        setState((prev) => ({

          ...prev,

          error:
            'Unable to play the selected video.',

          isPlaying:
            false,

        }));


        stop();

      }


    }, [

      captureAndAnalyze,

      clearTimer,

      stop,

      videoUrl,

    ]);


  // ==========================================================
  // RESET PIPELINE
  // ==========================================================

  const reset =
    useCallback(() => {


      stop();


      // Reset references
      framesCapturedRef.current =
        0;


      framesValidatedRef.current =
        0;


      candidateEventRef.current =
        null;


      eventConfirmedRef.current =
        false;


      processingRef.current =
        false;


      runningRef.current =
        false;


      // Reset video position
      if (videoRef.current) {

        videoRef.current.currentTime =
          0;

      }


      // Reset UI
      setState({

        stage: 'IDLE',

        isPlaying: false,

        framesCaptured: 0,

        framesValidated: 0,

        validationTotal: VALIDATION_TOTAL,

        confidence: 0,

        eventType: null,

        detections: [],

        analysisWidth: 0,

        analysisHeight: 0,

        error: null,

      });


    }, [
      stop,
    ]);


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {


    return () => {


      stop();


      if (fileUrlRef.current) {

        URL.revokeObjectURL(
          fileUrlRef.current
        );

      }


    };


  }, [
    stop,
  ]);


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    videoRef,

    canvasRef,

    videoUrl,

    state,

    loadVideo,

    start,

    stop,

    reset,

  };

}