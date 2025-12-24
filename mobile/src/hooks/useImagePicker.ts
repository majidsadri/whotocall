import { useState, useCallback } from 'react';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

interface UseImagePickerReturn {
  imageUri: string | null;
  isLoading: boolean;
  error: string | null;
  pickFromCamera: () => Promise<string | null>;
  pickFromGallery: () => Promise<string | null>;
  clearImage: () => void;
  showPicker: () => void;
}

export function useImagePicker(): UseImagePickerReturn {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Reachr needs access to your camera to scan business cards',
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

  const handleResponse = (response: ImagePickerResponse): string | null => {
    if (response.didCancel) {
      return null;
    }

    if (response.errorCode) {
      setError(response.errorMessage || 'Failed to pick image');
      return null;
    }

    if (response.assets && response.assets[0]?.uri) {
      const uri = response.assets[0].uri;
      setImageUri(uri);
      setError(null);
      return uri;
    }

    return null;
  };

  const pickFromCamera = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setError('Camera permission denied');
        setIsLoading(false);
        return null;
      }

      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: false,
      };

      const response = await launchCamera(options);
      return handleResponse(response);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to open camera');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      };

      const response = await launchImageLibrary(options);
      return handleResponse(response);
    } catch (err) {
      console.error('Gallery error:', err);
      setError('Failed to open gallery');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImageUri(null);
    setError(null);
  }, []);

  const showPicker = useCallback(() => {
    Alert.alert(
      'Select Image',
      'Choose how to add a business card image',
      [
        { text: 'Camera', onPress: () => pickFromCamera() },
        { text: 'Gallery', onPress: () => pickFromGallery() },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [pickFromCamera, pickFromGallery]);

  return {
    imageUri,
    isLoading,
    error,
    pickFromCamera,
    pickFromGallery,
    clearImage,
    showPicker,
  };
}
