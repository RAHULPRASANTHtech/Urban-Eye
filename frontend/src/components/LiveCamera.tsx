import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useCamera } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';

import { api } from '../services/api';


// ============================================================
// TYPES
// ============================================================

interface BoundingBox {

  x1: number;

  y1: number;

  x2: number;

  y2: number;

}


interface Detection {

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

}


interface ConfirmedIncident {

  incident_id: string;

  incident_type: string;

  confidence: number;

  frames_detected: number;

}


interface AccidentDetection {

  class_id?: number;

  type: string;

  confidence: number;

  bounding_box: BoundingBox;

  is_accident?: boolean;

}


// ============================================================
// COMPONENT
// ============================================================

export default function LiveCamera() {


  // ==========================================================
  // REFS
  // ==========================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Hidden canvas used to capture frames
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  // Overlay canvas used to draw AI bounding boxes
  const overlayCanvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const detectionIntervalRef =
    useRef<number | null>(
      null
    );


  const isProcessingRef =
    useRef(false);


  // ==========================================================
  // CAMERA
  // ==========================================================

  const {

    startCamera,

    stopCamera,

    isCameraActive,

    error: cameraError,

  } = useCamera();


  // ==========================================================
  // GPS
  // ==========================================================

  const {

    location,

    error: locationError,

    isWatching,

    startWatching,

    stopWatching,

  } = useGeolocation();


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [

    roadDetections,

    setRoadDetections

  ] = useState<Detection[]>(
    []
  );


  const [

    accidentDetections,

    setAccidentDetections

  ] = useState<AccidentDetection[]>(
    []
  );


  const [

    confirmedIncidents,

    setConfirmedIncidents

  ] = useState<ConfirmedIncident[]>(
    []
  );


  // Raw accident detected by YOLO
  const [

    accidentDetected,

    setAccidentDetected

  ] = useState(false);


  // Accident confirmed after temporal verification
  const [

    accidentConfirmed,

    setAccidentConfirmed

  ] = useState(false);


  const [

    isAnalyzing,

    setIsAnalyzing

  ] = useState(false);


  const [

    error,

    setError

  ] = useState<string | null>(
    null
  );


  const [

    totalFrames,

    setTotalFrames

  ] = useState(0);


  // ==========================================================
  // START LIVE CAMERA
  // ==========================================================

  const handleStartCamera =
    useCallback(
      async () => {

        try {

          setError(null);


          if (
            !videoRef.current
          ) {

            return;

          }


          await startCamera(
            videoRef.current
          );


          startWatching();


          console.log(
            'Live camera started'
          );


        } catch (error) {

          console.error(
            error
          );


          setError(
            'Failed to start live camera.'
          );

        }

      },

      [
        startCamera,
        startWatching
      ]
    );


  // ==========================================================
  // STOP LIVE CAMERA
  // ==========================================================

  const handleStopCamera =
    useCallback(
      () => {

        if (
          detectionIntervalRef.current !== null
        ) {

          window.clearInterval(
            detectionIntervalRef.current
          );


          detectionIntervalRef.current =
            null;

        }


        stopCamera();

        stopWatching();


        setRoadDetections([]);

        setAccidentDetections([]);

        setConfirmedIncidents([]);

        setAccidentDetected(false);

        setAccidentConfirmed(false);

        setIsAnalyzing(false);


        // Clear overlay canvas
        const overlay =
          overlayCanvasRef.current;


        if (
          overlay
        ) {

          const context =
            overlay.getContext(
              '2d'
            );


          if (
            context
          ) {

            context.clearRect(

              0,

              0,

              overlay.width,

              overlay.height

            );

          }

        }


        console.log(
          'Live camera stopped'
        );

      },

      [
        stopCamera,
        stopWatching
      ]
    );


  // ==========================================================
  // CAPTURE VIDEO FRAME
  // ==========================================================

  const captureFrame =
    useCallback(
      (): Promise<Blob | null> => {

        return new Promise(
          (resolve) => {

            const video =
              videoRef.current;


            const canvas =
              canvasRef.current;


            if (
              !video ||
              !canvas
            ) {

              resolve(null);

              return;

            }


            if (
              video.videoWidth === 0 ||
              video.videoHeight === 0
            ) {

              resolve(null);

              return;

            }


            canvas.width =
              video.videoWidth;


            canvas.height =
              video.videoHeight;


            const context =
              canvas.getContext(
                '2d'
              );


            if (
              !context
            ) {

              resolve(null);

              return;

            }


            context.drawImage(

              video,

              0,

              0,

              canvas.width,

              canvas.height

            );


            canvas.toBlob(

              (blob) => {

                resolve(
                  blob
                );

              },

              'image/jpeg',

              0.85

            );

          }
        );

      },

      []
    );


  // ==========================================================
  // ANALYZE ROAD FRAME
  // ==========================================================

  const analyzeRoadFrame =
    useCallback(
      async (
        frameBlob: Blob
      ) => {

        try {

          const formData =
            new FormData();


          formData.append(

            'file',

            frameBlob,

            'live-road-frame.jpg'

          );


          const response =
            await api.post(

              '/api/ai-detection/frame',

              formData

            );


          const data =
            response.data;


          setRoadDetections(

            data.detections ?? []

          );


          if (

            data.confirmed_incidents &&

            data.confirmed_incidents.length > 0

          ) {

            setConfirmedIncidents(

              data.confirmed_incidents

            );

          }


        } catch (
          error
        ) {

          console.error(

            'Road AI detection failed:',

            error

          );

        }

      },

      []
    );


  // ==========================================================
  // ANALYZE ACCIDENT FRAME
  // ==========================================================

  const analyzeAccidentFrame =
    useCallback(
      async (
        frameBlob: Blob
      ) => {

        try {

          const formData =
            new FormData();


          formData.append(

            'file',

            frameBlob,

            'live-accident-frame.jpg'

          );


          const response =
            await api.post(

              '/api/accident-detection/frame',

              formData

            );


          const data =
            response.data;


          console.log(

            'ACCIDENT AI RESPONSE:',

            data

          );


          const detections =
            data.detections ?? [];


          setAccidentDetections(
            detections
          );


          // ==================================================
          // RAW ACCIDENT DETECTION
          // ==================================================

          const hasAccident =
            Boolean(
              data.accident_detected
            );


          setAccidentDetected(
            hasAccident
          );


          // ==================================================
          // TEMPORAL CONFIRMATION
          // ==================================================

          const isConfirmed =
            Boolean(
              data.newly_confirmed
            ) ||
            (
              Boolean(
                data.accident_active
              ) &&

              Number(
                data.verification
                  ?.consecutive_hits ?? 0
              ) >=

              Number(
                data.verification
                  ?.required_hits ?? 3
              )
            );


          if (
            isConfirmed
          ) {

            setAccidentConfirmed(
              true
            );


            console.warn(

              '🚨 CONFIRMED ACCIDENT!',

              data

            );

          }

          else {

            setAccidentConfirmed(
              false
            );

          }


        } catch (
          error
        ) {

          console.error(

            'Accident AI detection failed:',

            error

          );

        }

      },

      []
    );


  // ==========================================================
  // COMPLETE AI FRAME PROCESSING
  // ==========================================================

  const processFrame =
    useCallback(
      async () => {

        if (
          isProcessingRef.current
        ) {

          return;

        }


        isProcessingRef.current =
          true;


        setIsAnalyzing(
          true
        );


        try {

          const frameBlob =
            await captureFrame();


          if (
            !frameBlob
          ) {

            return;

          }


          // Run both AI systems
          await Promise.allSettled([

            analyzeRoadFrame(
              frameBlob
            ),

            analyzeAccidentFrame(
              frameBlob
            )

          ]);


          setTotalFrames(

            (previous) =>

              previous + 1

          );


        } catch (
          error
        ) {

          console.error(

            'Frame processing failed:',

            error

          );

        } finally {

          isProcessingRef.current =
            false;


          setIsAnalyzing(
            false
          );

        }

      },

      [

        captureFrame,

        analyzeRoadFrame,

        analyzeAccidentFrame

      ]
    );


  // ==========================================================
  // START AI ANALYSIS LOOP
  // ==========================================================

  useEffect(
    () => {

      if (
        !isCameraActive
      ) {

        return;

      }


      processFrame();


      detectionIntervalRef.current =
        window.setInterval(

          processFrame,

          1000

        );


      return () => {

        if (
          detectionIntervalRef.current !== null
        ) {

          window.clearInterval(

            detectionIntervalRef.current

          );


          detectionIntervalRef.current =
            null;

        }

      };

    },

    [

      isCameraActive,

      processFrame

    ]
  );


  // ==========================================================
  // DRAW AI BOUNDING BOXES
  // ==========================================================

  useEffect(
    () => {

      const video =
        videoRef.current;


      const overlay =
        overlayCanvasRef.current;


      if (
        !video ||
        !overlay
      ) {

        return;

      }


      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {

        return;

      }


      // Match actual displayed video size
      const displayWidth =
        video.clientWidth;


      const displayHeight =
        video.clientHeight;


      if (
        displayWidth === 0 ||
        displayHeight === 0
      ) {

        return;

      }


      // Account for device pixel ratio
      const pixelRatio =
        window.devicePixelRatio || 1;


      overlay.width =
        displayWidth * pixelRatio;


      overlay.height =
        displayHeight * pixelRatio;


      overlay.style.width =
        `${displayWidth}px`;


      overlay.style.height =
        `${displayHeight}px`;


      const context =
        overlay.getContext(
          '2d'
        );


      if (
        !context
      ) {

        return;

      }


      context.setTransform(

        pixelRatio,

        0,

        0,

        pixelRatio,

        0,

        0

      );


      context.clearRect(

        0,

        0,

        displayWidth,

        displayHeight

      );


      // ======================================================
      // VIDEO → DISPLAY SCALE
      // ======================================================

      const scaleX =
        displayWidth /
        video.videoWidth;


      const scaleY =
        displayHeight /
        video.videoHeight;


      // ======================================================
      // DRAW FUNCTION
      // ======================================================

      const drawDetection =
        (

          detection: Detection | AccidentDetection,

          color: string,

          labelPrefix: string

        ) => {

          const box =
            detection.bounding_box;


          const x =
            box.x1 * scaleX;


          const y =
            box.y1 * scaleY;


          const width =
            (
              box.x2 -
              box.x1
            ) * scaleX;


          const height =
            (
              box.y2 -
              box.y1
            ) * scaleY;


          // Bounding box
          context.strokeStyle =
            color;


          context.lineWidth =
            3;


          context.strokeRect(

            x,

            y,

            width,

            height

          );


          // Label
          const label =
            `${labelPrefix} ${detection.type} ${(detection.confidence * 100).toFixed(0)}%`;


          context.font =
            'bold 14px Arial';


          const textWidth =
            context.measureText(
              label
            ).width;


          const labelHeight =
            24;


          context.fillStyle =
            color;


          context.fillRect(

            x,

            Math.max(
              0,
              y - labelHeight
            ),

            textWidth + 12,

            labelHeight

          );


          context.fillStyle =
            '#ffffff';


          context.fillText(

            label,

            x + 6,

            Math.max(
              16,
              y - 7
            )

          );

        };


      // ======================================================
      // DRAW ROAD DETECTIONS
      // ======================================================

      roadDetections.forEach(

        (detection) => {

          drawDetection(

            detection,

            '#facc15',

            'ROAD'

          );

        }

      );


      // ======================================================
      // DRAW ACCIDENT DETECTIONS
      // ======================================================

      accidentDetections.forEach(

        (detection) => {

          const isAccident =
            detection.is_accident === true ||

            detection.type
              .toLowerCase()
              .includes(
                'accident'
              );


          drawDetection(

            detection,

            isAccident

              ? '#ef4444'

              : '#3b82f6',

            isAccident

              ? 'ACCIDENT'

              : 'VEHICLE'

          );

        }

      );


    },

    [

      roadDetections,

      accidentDetections

    ]
  );


  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(
    () => {

      return () => {

        if (
          detectionIntervalRef.current !== null
        ) {

          window.clearInterval(

            detectionIntervalRef.current

          );

        }


        stopWatching();

      };

    },

    [

      stopWatching

    ]
  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        w-full
        space-y-4
      "
    >


      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          flex-wrap
        "
      >

        <div>

          <h2
            className="
              text-xl
              font-bold
              text-white
            "
          >

            Live AI Camera

          </h2>


          <p
            className="
              text-sm
              text-slate-400
            "
          >

            Real-time road and accident detection

          </p>

        </div>


        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <span

            className={

              isCameraActive

                ? `
                  w-3
                  h-3
                  rounded-full
                  bg-green-500
                  animate-pulse
                `

                : `
                  w-3
                  h-3
                  rounded-full
                  bg-slate-500
                `

            }

          />


          <span
            className="
              text-sm
              text-slate-300
            "
          >

            {

              isCameraActive

                ? 'LIVE'

                : 'OFFLINE'

            }

          </span>

        </div>

      </div>


      {/* CAMERA AREA */}

      <div
        className="
          relative
          overflow-hidden
          rounded-xl
          border
          border-slate-700
          bg-black
          aspect-video
        "
      >


        <video

          ref={videoRef}

          className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
          "

          autoPlay

          muted

          playsInline

        />


        {/* AI BOUNDING BOX OVERLAY */}

        <canvas

          ref={overlayCanvasRef}

          className="
            absolute
            inset-0
            w-full
            h-full
            pointer-events-none
          "

        />


        {/* Hidden frame capture canvas */}

        <canvas

          ref={canvasRef}

          className="hidden"

        />


        {/* CONFIRMED ACCIDENT ALERT */}

        {

          accidentConfirmed &&

          (

            <div
              className="
                absolute
                top-4
                left-1/2
                -translate-x-1/2

                bg-red-600
                text-white

                px-6
                py-3

                rounded-lg

                font-bold

                shadow-lg

                animate-pulse

                z-20
              "
            >

              🚨 CONFIRMED ACCIDENT

            </div>

          )

        }


        {/* LIVE INDICATOR */}

        {

          isCameraActive &&

          (

            <div
              className="
                absolute
                top-4
                left-4

                flex
                items-center
                gap-2

                bg-black/70

                px-3
                py-1.5

                rounded-lg

                z-20
              "
            >

              <span
                className="
                  w-2
                  h-2

                  bg-red-500

                  rounded-full

                  animate-pulse
                "
              />


              <span
                className="
                  text-xs
                  text-white
                  font-semibold
                "
              >

                LIVE

              </span>

            </div>

          )

        }


        {/* GPS OVERLAY */}

        {

          location &&

          (

            <div
              className="
                absolute
                bottom-4
                left-4

                bg-black/70

                text-white

                px-3
                py-2

                rounded-lg

                text-xs

                z-20
              "
            >

              <div>

                GPS ACTIVE

              </div>


              <div
                className="
                  text-slate-300
                "
              >

                {

                  location.latitude.toFixed(
                    6
                  )

                }

                ,

                {

                  location.longitude.toFixed(
                    6
                  )

                }

              </div>

            </div>

          )

        }


        {/* OFFLINE PLACEHOLDER */}

        {

          !isCameraActive &&

          (

            <div
              className="
                absolute
                inset-0

                flex
                items-center
                justify-center

                text-slate-400
              "
            >

              Camera is currently offline

            </div>

          )

        }

      </div>


      {/* CONTROLS */}

      <div
        className="
          flex
          gap-3
          flex-wrap
        "
      >

        {

          !isCameraActive

            ? (

              <button

                onClick={
                  handleStartCamera
                }

                className="
                  px-5
                  py-2.5

                  rounded-lg

                  bg-blue-600

                  hover:bg-blue-500

                  text-white

                  font-semibold

                  transition
                "
              >

                Start Live Camera

              </button>

            )

            : (

              <button

                onClick={
                  handleStopCamera
                }

                className="
                  px-5
                  py-2.5

                  rounded-lg

                  bg-red-600

                  hover:bg-red-500

                  text-white

                  font-semibold

                  transition
                "
              >

                Stop Camera

              </button>

            )

        }


        <div
          className="
            px-4
            py-2.5
            rounded-lg
            bg-slate-800
            text-slate-300
            text-sm
          "
        >

          AI Frames: {totalFrames}

        </div>


        <div
          className="
            px-4
            py-2.5
            rounded-lg
            bg-slate-800
            text-slate-300
            text-sm
          "
        >

          GPS: {

            isWatching

              ? 'Tracking'

              : 'Inactive'

          }

        </div>

      </div>


      {/* ERROR DISPLAY */}

      {

        (
          error ||
          cameraError ||
          locationError
        )

        &&

        (

          <div
            className="
              rounded-lg
              border
              border-red-500/40
              bg-red-500/10
              px-4
              py-3
              text-sm
              text-red-400
            "
          >

            {

              error ||

              cameraError ||

              locationError

            }

          </div>

        )

      }


      {/* AI STATUS */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        "
      >


        {/* ROAD AI */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            p-4
          "
        >

          <h3
            className="
              font-semibold
              text-white
              mb-3
            "
          >

            Road Intelligence AI

          </h3>


          {

            roadDetections.length === 0

              ? (

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  No road incidents detected.

                </p>

              )

              : (

                roadDetections.map(

                  (
                    detection,
                    index
                  ) => (

                    <div

                      key={index}

                      className="
                        flex
                        justify-between
                        text-sm
                        bg-slate-800
                        px-3
                        py-2
                        rounded
                        mb-2
                      "
                    >

                      <span>

                        {detection.type}

                      </span>


                      <span
                        className="
                          text-yellow-400
                        "
                      >

                        {

                          (
                            detection.confidence * 100
                          ).toFixed(1)

                        }

                        %

                      </span>

                    </div>

                  )

                )

              )

          }

        </div>


        {/* ACCIDENT AI */}

        <div

          className={`

            rounded-xl
            border
            p-4

            ${

              accidentConfirmed

                ? 'border-red-500 bg-red-500/10'

                : 'border-slate-700 bg-slate-900'

            }

          `}

        >

          <div
            className="
              flex
              justify-between
              items-center
              mb-3
            "
          >

            <h3
              className="
                font-semibold
                text-white
              "
            >

              Accident Detection AI

            </h3>


            <span

              className={

                accidentConfirmed

                  ? `
                    text-xs
                    px-2
                    py-1
                    rounded
                    bg-red-500
                    text-white
                  `

                  : `
                    text-xs
                    px-2
                    py-1
                    rounded
                    bg-green-500/20
                    text-green-400
                  `

              }

            >

              {

                accidentConfirmed

                  ? 'CONFIRMED'

                  : 'MONITORING'

              }

            </span>

          </div>


          {

            accidentDetections.length === 0

              ? (

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  No accident detected.

                </p>

              )

              : (

                accidentDetections.map(

                  (
                    detection,
                    index
                  ) => (

                    <div

                      key={index}

                      className="
                        flex
                        justify-between
                        text-sm
                        bg-slate-800
                        px-3
                        py-2
                        rounded
                        mb-2
                      "
                    >

                      <span
                        className={

                          detection.is_accident

                            ? 'text-red-300'

                            : 'text-blue-300'

                        }

                      >

                        {detection.type}

                      </span>


                      <span>

                        {

                          (
                            detection.confidence * 100
                          ).toFixed(1)

                        }

                        %

                      </span>

                    </div>

                  )

                )

              )

          }

        </div>

      </div>


      {/* PROCESSING STATUS */}

      {

        isAnalyzing

        &&

        (

          <div
            className="
              text-xs
              text-blue-400
            "
          >

            AI analyzing live frame...

          </div>

        )

      }

    </div>

  );

}