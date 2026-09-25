import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {

  Camera,

  Check,

  FileVideo2,

  MapPin,

  Pause,

  Play,

  RotateCcw,

  Upload,

  Video,

} from 'lucide-react';


import Panel from '../components/ui/Panel';


import {
  useCamera,
} from '../hooks/useCamera';


import {
  useDetectionPipeline,
} from '../hooks/useDetectionPipeline';


import {
  useGeolocation,
} from '../hooks/useGeolocation';


/* ============================================================
   TYPES
============================================================ */

type InputMode =
  | 'VIDEO'
  | 'CAMERA';


/* ============================================================
   FORMAT DETECTION LABEL
============================================================ */

function formatDetectionLabel(

  type: string,

  confidence: number

) {

  return (
    `${type.toUpperCase()} · ` +
    `${(confidence * 100).toFixed(1)}%`
  );

}


/* ============================================================
   MONITORING PAGE
============================================================ */

export default function Monitoring() {


  /* ==========================================================
     REFS
  ========================================================== */

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const processingIntervalRef =
    useRef<number | null>(
      null
    );


  const videoUrlRef =
    useRef<string | null>(
      null
    );


  /* ==========================================================
     HOOKS
  ========================================================== */

  const camera =
    useCamera();


  const geolocation =
    useGeolocation();


  const detectionPipeline =
    useDetectionPipeline();


  /* ==========================================================
     STATE
  ========================================================== */

  const [

    inputMode,

    setInputMode

  ] = useState<InputMode>(
    'VIDEO'
  );


  const [

    videoUrl,

    setVideoUrl

  ] = useState<string | null>(
    null
  );


  const [

    fileName,

    setFileName

  ] = useState(
    'No video selected'
  );


  const [

    isProcessing,

    setIsProcessing

  ] = useState(
    false
  );


  /* ==========================================================
     CONSTANTS
  ========================================================== */

  const FRAME_INTERVAL =
    800;


  const BUS_ID =
    inputMode === 'CAMERA'

      ? 'DEMO-CAMERA-001'

      : 'BUS-104';


  /* ==========================================================
     START GPS
  ========================================================== */

  useEffect(

    () => {

      geolocation.startWatching();


      return () => {

        geolocation.stopWatching();

      };

    },

    []

  );


  /* ==========================================================
     STOP PROCESSING
  ========================================================== */

  const stopProcessing =
    useCallback(

      () => {

        if (
          processingIntervalRef.current !== null
        ) {

          window.clearInterval(

            processingIntervalRef.current

          );


          processingIntervalRef.current =
            null;

        }


        setIsProcessing(
          false
        );


        if (
          inputMode === 'VIDEO' &&
          videoRef.current
        ) {

          videoRef.current.pause();

        }

      },

      [
        inputMode
      ]

    );


  /* ==========================================================
     CAPTURE AND ANALYZE FRAME
  ========================================================== */

  const captureFrame =
    useCallback(

      async () => {

        const video =
          videoRef.current;


        const canvas =
          canvasRef.current;


        if (
          !video ||
          !canvas
        ) {

          return;

        }


        if (
          video.readyState <
          HTMLMediaElement.HAVE_CURRENT_DATA
        ) {

          return;

        }


        const width =
          video.videoWidth;


        const height =
          video.videoHeight;


        if (
          width <= 0 ||
          height <= 0
        ) {

          return;

        }


        canvas.width =
          width;


        canvas.height =
          height;


        const context =
          canvas.getContext(
            '2d'
          );


        if (
          !context
        ) {

          return;

        }


        /* ====================================================
           DRAW VIDEO FRAME
        ==================================================== */

        context.drawImage(

          video,

          0,

          0,

          width,

          height

        );


        /* ====================================================
           SEND TO AI PIPELINE
        ==================================================== */

        await detectionPipeline.analyzeFrame(

          canvas,

          geolocation.location,

          BUS_ID

        );

      },

      [

        detectionPipeline,

        geolocation.location,

        BUS_ID

      ]

    );


  /* ==========================================================
     START PROCESSING
  ========================================================== */

  const startProcessing =
    useCallback(

      async () => {


        const video =
          videoRef.current;


        if (
          !video
        ) {

          return;

        }


        /* ====================================================
           PLAY VIDEO
        ==================================================== */

        if (
          inputMode === 'VIDEO'
        ) {

          try {

            await video.play();

          } catch (
            error
          ) {

            console.error(
              error
            );

          }

        }


        setIsProcessing(
          true
        );


        /* ====================================================
           FIRST FRAME
        ==================================================== */

        captureFrame();


        /* ====================================================
           CONTINUOUS FRAME ANALYSIS
        ==================================================== */

        processingIntervalRef.current =
          window.setInterval(

            () => {

              captureFrame();

            },

            FRAME_INTERVAL

          );


      },

      [

        inputMode,

        captureFrame

      ]

    );


  /* ==========================================================
     RESET
  ========================================================== */

  const reset =
    useCallback(

      () => {


        stopProcessing();


        detectionPipeline.reset();


        if (
          videoRef.current
        ) {

          videoRef.current.pause();


          if (
            inputMode === 'VIDEO'
          ) {

            videoRef.current.currentTime =
              0;

          }

        }


      },

      [

        stopProcessing,

        detectionPipeline,

        inputMode

      ]

    );


  /* ==========================================================
     SELECT VIDEO
  ========================================================== */

  const chooseVideo =
    useCallback(

      (

        file:
          File | undefined

      ) => {


        if (
          !file
        ) {

          return;

        }


        stopProcessing();


        detectionPipeline.reset();


        /* ====================================================
           REVOKE OLD URL
        ==================================================== */

        if (
          videoUrlRef.current
        ) {

          URL.revokeObjectURL(

            videoUrlRef.current

          );

        }


        const url =
          URL.createObjectURL(
            file
          );


        videoUrlRef.current =
          url;


        setVideoUrl(
          url
        );


        setFileName(
          file.name
        );


        setInputMode(
          'VIDEO'
        );


      },

      [

        stopProcessing,

        detectionPipeline

      ]

    );


  /* ==========================================================
     START CAMERA
  ========================================================== */

  const startCamera =
    useCallback(

      async () => {


        stopProcessing();


        detectionPipeline.reset();


        setInputMode(
          'CAMERA'
        );


        /*
         * Wait for React to render
         * before attaching camera.
         */

        setTimeout(

          async () => {

            if (
              videoRef.current
            ) {

              await camera.startCamera(

                videoRef.current

              );

            }

          },

          100

        );


      },

      [

        camera,

        stopProcessing,

        detectionPipeline

      ]

    );


  /* ==========================================================
     STOP CAMERA
  ========================================================== */

  const stopCamera =
    useCallback(

      () => {

        stopProcessing();


        camera.stopCamera();


      },

      [

        stopProcessing,

        camera

      ]

    );


  /* ==========================================================
     SWITCH TO VIDEO
  ========================================================== */

  const switchToVideo =
    useCallback(

      () => {


        stopProcessing();


        camera.stopCamera();


        setInputMode(
          'VIDEO'
        );


      },

      [

        camera,

        stopProcessing

      ]

    );


  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(

    () => {

      return () => {


        if (
          processingIntervalRef.current !== null
        ) {

          window.clearInterval(

            processingIntervalRef.current

          );

        }


        if (
          videoUrlRef.current
        ) {

          URL.revokeObjectURL(

            videoUrlRef.current

          );

        }

      };

    },

    []

  );


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="space-y-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-teal-300">

          Urban Intelligence Edge AI

        </p>


        <h1 className="mt-2 text-2xl font-semibold text-white">

          Live AI Monitoring

        </h1>


        <p className="mt-2 max-w-3xl text-sm text-slate-400">

          Detect road incidents using recorded video or live camera,
          visualize AI detections in real time, capture GPS coordinates,
          and automatically create urban intelligence events.

        </p>

      </div>


      {/* ======================================================
          MODE SELECTOR
      ====================================================== */}

      <div className="flex flex-wrap gap-3">


        {/* VIDEO MODE */}

        <button

          onClick={
            switchToVideo
          }

          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            inputMode === 'VIDEO'

              ? 'border-teal-300 bg-teal-300/10 text-teal-200'

              : 'border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}

        >

          <FileVideo2
            size={16}
          />

          Recorded Video

        </button>


        {/* CAMERA MODE */}

        <button

          onClick={
            startCamera
          }

          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            inputMode === 'CAMERA'

              ? 'border-teal-300 bg-teal-300/10 text-teal-200'

              : 'border-slate-700 text-slate-400 hover:bg-slate-800'
          }`}

        >

          <Camera
            size={16}
          />

          Live Camera

        </button>

      </div>


      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">


        {/* ====================================================
            VIDEO PANEL
        ==================================================== */}

        <Panel

          title={

            inputMode === 'CAMERA'

              ? 'Live camera'

              : 'Road video'

          }

          subtitle={

            inputMode === 'CAMERA'

              ? 'Real-time device camera input'

              : 'Recorded road inspection input'

          }

        >


          {/* ==================================================
              VIDEO CONTAINER
          ================================================== */}

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-black">


            {/* =================================================
                VIDEO
            ================================================= */}

            {(

              inputMode === 'CAMERA'

              ||

              videoUrl

            ) ? (

              <video

                ref={videoRef}

                src={

                  inputMode === 'VIDEO'

                    ? videoUrl ?? undefined

                    : undefined

                }

                muted

                playsInline

                className="h-full w-full object-cover"


                onEnded={() => {

                  stopProcessing();

                }}

              />

            ) : (

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">

                <FileVideo2
                  size={40}
                  className="text-slate-600"
                />

                <p className="mt-4 text-sm text-slate-400">

                  Select a road inspection video

                </p>

              </div>

            )}


            {/* =================================================
                DETECTION OVERLAY
            ================================================= */}

            {

              detectionPipeline
                .state
                .detections
                .length > 0

              &&

              detectionPipeline
                .state
                .analysisWidth > 0

              &&

              detectionPipeline
                .state
                .analysisHeight > 0

              && (

                <div className="pointer-events-none absolute inset-0 z-20">


                  {

                    detectionPipeline
                      .state
                      .detections
                      .map(

                        (

                          detection,

                          index

                        ) => {


                          const box =
                            detection.bounding_box;


                          const left =
                            (
                              box.x1 /
                              detectionPipeline
                                .state
                                .analysisWidth
                            ) * 100;


                          const top =
                            (
                              box.y1 /
                              detectionPipeline
                                .state
                                .analysisHeight
                            ) * 100;


                          const width =
                            (
                              (
                                box.x2 -
                                box.x1
                              )
                              /
                              detectionPipeline
                                .state
                                .analysisWidth
                            ) * 100;


                          const height =
                            (
                              (
                                box.y2 -
                                box.y1
                              )
                              /
                              detectionPipeline
                                .state
                                .analysisHeight
                            ) * 100;


                          return (

                            <div

                              key={`${detection.type}-${index}`}

                              className="
                                absolute
                                border-2
                                border-rose-400
                                bg-rose-500/10
                                shadow-[0_0_18px_rgba(251,113,133,0.45)]
                              "

                              style={{

                                left:
                                  `${left}%`,

                                top:
                                  `${top}%`,

                                width:
                                  `${width}%`,

                                height:
                                  `${height}%`,

                              }}

                            >


                              {/* LABEL */}

                              <div className="absolute -top-7 left-0 whitespace-nowrap rounded bg-rose-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">


                                {

                                  formatDetectionLabel(

                                    detection.type,

                                    detection.confidence

                                  )

                                }


                              </div>


                            </div>

                          );

                        }

                      )

                  }


                </div>

              )

            }


            {/* =================================================
                STATUS BADGE
            ================================================= */}

            <div className="absolute left-4 top-4 z-30 rounded-lg border border-teal-300/20 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold tracking-[.15em] text-teal-200">

              {

                inputMode === 'CAMERA'

                  ? 'LIVE CAMERA'

                  : 'RECORDED VIDEO'

              }

              {' · '}

              {BUS_ID}

            </div>


            {/* =================================================
                PROCESSING STATUS
            ================================================= */}

            <div className="absolute right-4 top-4 z-30 rounded-lg bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">


              {

                isProcessing

                  ? '● AI PROCESSING'

                  : 'READY'

              }


            </div>


          </div>


          {/* ====================================================
              HIDDEN CANVAS
          ==================================================== */}

          <canvas

            ref={canvasRef}

            className="hidden"

          />


          {/* ====================================================
              CONTROLS
          ==================================================== */}

          <div className="mt-5 flex flex-wrap gap-2">


            {/* LOAD VIDEO */}

            {

              inputMode === 'VIDEO'

              && (

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800">

                  <Upload
                    size={16}
                  />

                  Load Video


                  <input

                    ref={fileInputRef}

                    type="file"

                    accept="video/*"

                    className="hidden"

                    onChange={(event) => {

                      chooseVideo(

                        event.target.files?.[0]

                      );

                    }}

                  />

                </label>

              )

            }


            {/* START */}

            <button

              onClick={
                startProcessing
              }

              disabled={

                isProcessing

                ||

                (

                  inputMode === 'VIDEO'

                  &&

                  !videoUrl

                )

                ||

                (

                  inputMode === 'CAMERA'

                  &&

                  !camera.isCameraActive

                )

              }

              className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <Play
                size={16}
              />

              Start Detection

            </button>


            {/* STOP */}

            <button

              onClick={

                inputMode === 'CAMERA'

                  ? stopCamera

                  : stopProcessing

              }

              disabled={

                !isProcessing

                &&

                !camera.isCameraActive

              }

              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <Pause
                size={16}
              />

              Stop

            </button>


            {/* RESET */}

            <button

              onClick={
                reset
              }

              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"

            >

              <RotateCcw
                size={16}
              />

              Reset

            </button>


          </div>


          {/* ====================================================
              FILE NAME
          ==================================================== */}

          {

            inputMode === 'VIDEO'

            && (

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">

                <FileVideo2
                  size={13}
                />

                {fileName}

              </div>

            )

          }


          {/* ====================================================
              GPS STATUS
          ==================================================== */}

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs">


            <MapPin
              size={15}
              className="text-teal-300"
            />


            {

              geolocation.location

                ? (

                  <span className="text-slate-300">

                    GPS:

                    {' '}

                    {

                      geolocation
                        .location
                        .latitude
                        .toFixed(6)

                    }

                    {', '}

                    {

                      geolocation
                        .location
                        .longitude
                        .toFixed(6)

                    }

                  </span>

                )

                : (

                  <span className="text-slate-500">

                    Acquiring GPS location...

                  </span>

                )

            }


          </div>


          {/* ERROR */}

          {

            (
              detectionPipeline.state.error

              ||

              camera.error

              ||

              geolocation.error
            )

            && (

              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-xs text-rose-200">

                {

                  detectionPipeline.state.error

                  ||

                  camera.error

                  ||

                  geolocation.error

                }

              </div>

            )

          }


        </Panel>


        {/* ====================================================
            STATUS PANEL
        ==================================================== */}

        <Panel

          title="AI Monitoring Status"

          subtitle="Detection + GPS + Event Intelligence"

        >

          <div className="space-y-5">


            {/* MODEL */}

            <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">

              <div>

                <p className="text-xs text-slate-500">

                  AI Engine

                </p>


                <p className="mt-1 text-sm font-semibold text-emerald-300">

                  {

                    isProcessing

                      ? 'PROCESSING'

                      : 'READY'

                  }

                </p>

              </div>


              <span className="h-3 w-3 rounded-full bg-emerald-300" />

            </div>


            {/* METRICS */}

            <div className="grid grid-cols-2 gap-3">


              <div className="rounded-xl border border-slate-800 p-4">

                <p className="text-[10px] uppercase tracking-[.15em] text-slate-600">

                  Frames

                </p>


                <p className="mt-2 text-xl font-semibold text-white">

                  {

                    detectionPipeline
                      .state
                      .framesProcessed

                  }

                </p>

              </div>


              <div className="rounded-xl border border-slate-800 p-4">

                <p className="text-[10px] uppercase tracking-[.15em] text-slate-600">

                  Events

                </p>


                <p className="mt-2 text-xl font-semibold text-white">

                  {

                    detectionPipeline
                      .state
                      .eventsCreated

                  }

                </p>

              </div>


            </div>


            {/* DETECTIONS */}

            <div>

              <p className="text-xs font-semibold text-slate-300">

                Current detections

              </p>


              <div className="mt-3 space-y-2">


                {

                  detectionPipeline
                    .state
                    .detections
                    .length === 0

                    ? (

                      <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-600">

                        No incidents detected

                      </div>

                    )

                    : (

                      detectionPipeline
                        .state
                        .detections
                        .map(

                          (

                            detection,

                            index

                          ) => (

                            <div

                              key={`${detection.type}-${index}`}

                              className="flex items-center justify-between rounded-xl border border-rose-400/10 bg-rose-400/5 p-3"

                            >

                              <span className="text-xs font-medium text-slate-200">

                                {

                                  detection.type

                                }

                              </span>


                              <span className="text-xs font-semibold text-rose-300">

                                {

                                  (
                                    detection.confidence *
                                    100
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


            {/* GPS INFO */}

            <div className="rounded-xl border border-slate-800 p-4">

              <div className="flex items-center gap-2">

                <MapPin
                  size={16}
                  className="text-teal-300"
                />

                <span className="text-sm font-semibold text-slate-300">

                  Location Intelligence

                </span>

              </div>


              <div className="mt-3 text-xs text-slate-500">


                {

                  geolocation.location

                    ? (

                      <>

                        Accuracy:

                        {' '}

                        {

                          Math.round(

                            geolocation
                              .location
                              .accuracy

                          )

                        }

                        m

                      </>

                    )

                    : (

                      'Waiting for GPS signal'

                    )

                }


              </div>

            </div>


          </div>

        </Panel>


      </div>


    </div>

  );

}