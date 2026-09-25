// ============================================================
// GPS LOCATION SERVICE
// ============================================================


export interface GPSLocation {

  latitude: number;

  longitude: number;

  accuracy: number;

  timestamp: number;

}


// ============================================================
// GET CURRENT GPS LOCATION
// ============================================================

export function getCurrentLocation(): Promise<GPSLocation> {

  return new Promise(

    (
      resolve,
      reject
    ) => {

      // ------------------------------------------------------
      // CHECK BROWSER SUPPORT
      // ------------------------------------------------------

      if (
        !navigator.geolocation
      ) {

        reject(
          new Error(
            'Geolocation is not supported by this browser.'
          )
        );

        return;

      }


      // ------------------------------------------------------
      // REQUEST CURRENT LOCATION
      // ------------------------------------------------------

      navigator.geolocation.getCurrentPosition(

        (position) => {

          resolve({

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy,

            timestamp:
              position.timestamp

          });

        },


        (error) => {

          let message =
            'Unable to retrieve GPS location.';


          switch (
            error.code
          ) {

            case error.PERMISSION_DENIED:

              message =
                'Location permission was denied.';

              break;


            case error.POSITION_UNAVAILABLE:

              message =
                'Location information is unavailable.';

              break;


            case error.TIMEOUT:

              message =
                'Location request timed out.';

              break;

          }


          reject(
            new Error(message)
          );

        },


        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 5000
        }

      );

    }

  );

}


// ============================================================
// WATCH GPS LOCATION
// ============================================================

export function watchLocation(

  onLocation: (
    location: GPSLocation
  ) => void,

  onError?: (
    error: Error
  ) => void

): number | null {


  if (
    !navigator.geolocation
  ) {

    onError?.(
      new Error(
        'Geolocation is not supported by this browser.'
      )
    );

    return null;

  }


  const watchId =
    navigator.geolocation.watchPosition(

      (position) => {

        onLocation({

          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude,

          accuracy:
            position.coords.accuracy,

          timestamp:
            position.timestamp

        });

      },


      (error) => {

        let message =
          'Unable to track GPS location.';


        switch (
          error.code
        ) {

          case error.PERMISSION_DENIED:

            message =
              'Location permission was denied.';

            break;


          case error.POSITION_UNAVAILABLE:

            message =
              'Location information is unavailable.';

            break;


          case error.TIMEOUT:

            message =
              'Location tracking timed out.';

            break;

        }


        onError?.(
          new Error(message)
        );

      },


      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 3000
      }

    );


  return watchId;

}


// ============================================================
// STOP WATCHING LOCATION
// ============================================================

export function stopWatchingLocation(

  watchId: number | null

) {

  if (
    watchId !== null
  ) {

    navigator.geolocation.clearWatch(
      watchId
    );

  }

}