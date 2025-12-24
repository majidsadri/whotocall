import { useState, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  address: string;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Reachr needs access to your location to record where you met contacts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            'User-Agent': 'Reachr/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      const parts: string[] = [];

      if (data.address?.suburb || data.address?.neighbourhood) {
        parts.push(data.address.suburb || data.address.neighbourhood);
      }
      if (data.address?.city || data.address?.town || data.address?.village) {
        parts.push(data.address.city || data.address.town || data.address.village);
      }
      if (data.address?.state) {
        parts.push(data.address.state);
      }
      if (data.address?.country && parts.length < 2) {
        parts.push(data.address.country);
      }

      return parts.join(', ');
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return '';
    }
  };

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          setLocation({ latitude, longitude });

          // Get address from coordinates
          const addressStr = await reverseGeocode(latitude, longitude);
          setAddress(addressStr);
          setLocation({ latitude, longitude, address: addressStr });

          setIsLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(err.message || 'Failed to get location');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (err) {
      console.error('Location error:', err);
      setError('Failed to get location');
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    address,
    isLoading,
    error,
    getCurrentLocation,
  };
}
