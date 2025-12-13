import * as ExpoLocation from 'expo-location';
import { Location } from '../types';

class LocationServiceClass {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location | null> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      let address: string | undefined;
      try {
        const [geocode] = await ExpoLocation.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocode) {
          const parts = [
            geocode.streetNumber,
            geocode.street,
            geocode.city,
            geocode.region,
            geocode.postalCode,
          ].filter(Boolean);
          
          address = parts.join(', ');
        }
      } catch (geocodeError) {
        console.warn('Geocoding error:', geocodeError);
      }

      return {
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async watchLocation(
    callback: (location: Location) => void,
    errorCallback?: (error: Error) => void
  ): Promise<ExpoLocation.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        errorCallback?.(new Error('Location permission not granted'));
        return null;
      }

      return await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          
          callback({
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
          });
        }
      );
    } catch (error: any) {
      errorCallback?.(error);
      return null;
    }
  }
}

export const LocationService = new LocationServiceClass();
