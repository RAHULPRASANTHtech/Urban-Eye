import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  GPSLocation,
} from '../services/location';

import {
  getCurrentLocation,
  stopWatchingLocation,
  watchLocation,
} from '../services/location';


// ============================================================
// GEOLOCATION STATE
// ============================================================

export interface GeolocationState {

  location: GPSLocation | null;

  loading: boolean;

  error: string | null;

  isWatching: boolean;

}


// ============================================================
// GEOLOCATION HOOK
// ============================================================

export function useGeolocation(): GeolocationState & {

  refreshLocation:
    () => Promise<GPSLocation | null>;

  startWatching:
    () => void;

  stopWatching:
    () => void;

} {


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    location,
    setLocation
  ] = useState<GPSLocation | null>(
    null
  );


  const [
    loading,
    setLoading
  ] = useState<boolean>(
    false
  );


  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );


  const [
    isWatching,
    setIsWatching
  ] = useState<boolean>(
    false
  );


  // ==========================================================
  // GPS WATCH REFERENCE
  // ==========================================================

  const watchIdRef =
    useRef<number | null>(
      null
    );


  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const refreshLocation =
    useCallback(

      async (): Promise<
        GPSLocation | null
      > => {

        try {

          setLoading(true);

          setError(null);


          const gpsLocation =
            await getCurrentLocation();


          setLocation(
            gpsLocation
          );


          return gpsLocation;

        }

        catch (
          error
        ) {

          const message =

            error instanceof Error

              ? error.message

              : 'Unable to retrieve GPS location.';


          setError(
            message
          );


          return null;

        }

        finally {

          setLoading(
            false
          );

        }

      },

      []

    );


  // ==========================================================
  // START GPS WATCHING
  // ==========================================================

  const startWatching =
    useCallback(

      () => {

        // Prevent multiple GPS watchers
        if (
          watchIdRef.current !== null
        ) {

          return;

        }


        setLoading(
          true
        );


        setError(
          null
        );


        const watchId =
          watchLocation(

            (
              gpsLocation
            ) => {

              setLocation(
                gpsLocation
              );


              setLoading(
                false
              );


              setError(
                null
              );

            },


            (
              locationError
            ) => {

              setError(
                locationError.message
              );


              setLoading(
                false
              );

            }

          );


        if (
          watchId !== null
        ) {

          watchIdRef.current =
            watchId;


          setIsWatching(
            true
          );

        }

        else {

          setLoading(
            false
          );

        }

      },

      []

    );


  // ==========================================================
  // STOP GPS WATCHING
  // ==========================================================

  const stopWatching =
    useCallback(

      () => {

        stopWatchingLocation(
          watchIdRef.current
        );


        watchIdRef.current =
          null;


        setIsWatching(
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

        stopWatchingLocation(
          watchIdRef.current
        );


        watchIdRef.current =
          null;

      };

    },

    []

  );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    location,

    loading,

    error,

    isWatching,

    refreshLocation,

    startWatching,

    stopWatching,

  };

}