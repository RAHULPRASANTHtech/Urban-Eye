import {

  useCallback,

  useEffect,

  useRef,

  useState

} from 'react';


// ============================================================
// CAMERA HOOK
// ============================================================

export function useCamera() {


  // ==========================================================
  // CAMERA STATE
  // ==========================================================

  const [

    isCameraActive,

    setIsCameraActive

  ] = useState(false);


  const [

    error,

    setError

  ] = useState<string | null>(
    null
  );


  // ==========================================================
  // MEDIA STREAM REFERENCE
  // ==========================================================

  const streamRef =
    useRef<MediaStream | null>(
      null
    );


  // ==========================================================
  // START CAMERA
  // ==========================================================

  const startCamera =
    useCallback(

      async (

        videoElement: HTMLVideoElement

      ) => {

        try {

          setError(null);


          // --------------------------------------------------
          // STOP EXISTING STREAM FIRST
          // --------------------------------------------------

          if (
            streamRef.current
          ) {

            streamRef.current
              .getTracks()
              .forEach(

                (track) => {

                  track.stop();

                }

              );

          }


          // --------------------------------------------------
          // REQUEST CAMERA ACCESS
          // --------------------------------------------------

          const stream =
            await navigator
              .mediaDevices
              .getUserMedia({

                video: {

                  facingMode: {

                    ideal:
                      'environment'

                  },

                  width: {

                    ideal:
                      1280

                  },

                  height: {

                    ideal:
                      720

                  }

                },


                audio: false

              });


          // --------------------------------------------------
          // STORE STREAM
          // --------------------------------------------------

          streamRef.current =
            stream;


          // --------------------------------------------------
          // ATTACH TO VIDEO ELEMENT
          // --------------------------------------------------

          videoElement.srcObject =
            stream;


          videoElement.muted =
            true;


          videoElement.playsInline =
            true;


          await videoElement.play();


          // --------------------------------------------------
          // UPDATE STATE
          // --------------------------------------------------

          setIsCameraActive(
            true
          );


        } catch (
          err
        ) {

          console.error(
            'Camera access failed:',
            err
          );


          let message =
            'Unable to access camera.';


          if (
            err instanceof DOMException
          ) {

            if (
              err.name ===
              'NotAllowedError'
            ) {

              message =
                'Camera permission was denied.';

            }


            else if (
              err.name ===
              'NotFoundError'
            ) {

              message =
                'No camera was found on this device.';

            }

          }


          setError(
            message
          );


          setIsCameraActive(
            false
          );

        }

      },

      []

    );


  // ==========================================================
  // STOP CAMERA
  // ==========================================================

  const stopCamera =
    useCallback(

      () => {

        if (
          streamRef.current
        ) {

          streamRef.current
            .getTracks()
            .forEach(

              (track) => {

                track.stop();

              }

            );


          streamRef.current =
            null;

        }


        setIsCameraActive(
          false
        );

      },

      []

    );


  // ==========================================================
  // CLEANUP ON COMPONENT UNMOUNT
  // ==========================================================

  useEffect(

    () => {

      return () => {

        if (
          streamRef.current
        ) {

          streamRef.current
            .getTracks()
            .forEach(

              (track) => {

                track.stop();

              }

            );

        }

      };

    },

    []

  );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    startCamera,

    stopCamera,

    isCameraActive,

    error,

    stream:
      streamRef.current

  };

}