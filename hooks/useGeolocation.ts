
import { useState, useCallback } from 'react';
import { GeolocationState } from '../types';

const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    data: null,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = { code: -1, message: 'Geolocation is not supported by your browser.' } as GeolocationPositionError;
      setState(s => ({ ...s, error }));
      return Promise.reject(error);
    }
    
    setState(s => ({ ...s, loading: true, error: null }));

    return new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
                const coords = { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed };
                setState({
                    loading: false,
                    error: null,
                    data: coords
                });
                resolve(coords);
            },
            (error) => {
                setState({
                    loading: false,
                    error,
                    data: null
                });
                reject(error);
            },
            options
        );
    });
  }, [options]);

  return { location: state.data, error: state.error, loading: state.loading, getLocation };
};

export default useGeolocation;
